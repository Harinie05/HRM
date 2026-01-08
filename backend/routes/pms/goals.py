from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_db
from models.models_tenant import PMSGoal, User
from pydantic import BaseModel, validator
from typing import Optional
from datetime import date
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user, require_permission

router = APIRouter()

@router.get("/employees")
async def get_employees(db: Session = Depends(get_tenant_db)):
    try:
        users = db.query(User).all()
        employees = []
        for user in users:
            employees.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "value": f"user_{user.id}",
                "label": user.name
            })
        return employees
    except Exception as e:
        print(f"Error fetching employees: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching employees: {str(e)}")

# Get employee review cycle integration
@router.get("/employee-review-cycle/{employee_id}")
async def get_employee_review_cycle(employee_id: int, db: Session = Depends(get_tenant_db)):
    try:
        # Get current active review cycle for employee
        cycle_result = db.execute(text("""
            SELECT rc.*, COUNT(wa.id) as assignment_count
            FROM pms_review_cycles rc
            LEFT JOIN work_assignments wa ON rc.id = wa.review_cycle_id AND wa.assigned_employee_id = :employee_id
            WHERE rc.is_active = 1 AND rc.status = 'Open'
            GROUP BY rc.id
            ORDER BY rc.created_at DESC
            LIMIT 1
        """), {"employee_id": employee_id}).fetchone()
        
        if not cycle_result:
            return {"message": "No active review cycle found", "data": None}
        
        # Get KPI score for this employee in this cycle
        kpi_result = db.execute(text("""
            SELECT SUM(wa.weightage_percentage * COALESCE(ast.completion_percentage, 0) / 100) as kpi_score
            FROM work_assignments wa
            LEFT JOIN assignment_status ast ON wa.id = ast.assignment_id AND ast.employee_id = wa.assigned_employee_id
            WHERE wa.assigned_employee_id = :employee_id AND wa.review_cycle_id = :cycle_id AND wa.is_active = 1
        """), {"employee_id": employee_id, "cycle_id": cycle_result[0]}).fetchone()
        
        kpi_score = kpi_result[0] if kpi_result[0] else 0.0
        
        # Get feedback status
        feedback_result = db.execute(text("""
            SELECT COUNT(*) FROM pms_feedback 
            WHERE to_employee_id = :employee_id AND cycle = :cycle_name
        """), {"employee_id": employee_id, "cycle_name": cycle_result[1]}).scalar()
        
        # Get appraisal status
        appraisal_result = db.execute(text("""
            SELECT * FROM pms_appraisal 
            WHERE employee_id = :employee_id AND cycle = :cycle_name AND is_active = 1
        """), {"employee_id": employee_id, "cycle_name": cycle_result[1]}).fetchone()
        
        return {
            "data": {
                "cycle_id": cycle_result[0],
                "cycle_name": cycle_result[1],
                "start_date": cycle_result[2],
                "end_date": cycle_result[3],
                "status": cycle_result[4],
                "assignment_count": cycle_result[6],
                "kpi_score": round(kpi_score, 2),
                "feedback_given": feedback_result > 0,
                "appraisal_completed": appraisal_result is not None,
                "can_give_feedback": cycle_result[4] == "Closed",
                "performance_status": "On Track" if kpi_score >= 75 else "Needs Improvement"
            }
        }
    except Exception as e:
        print(f"Error fetching employee review cycle: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching employee review cycle: {str(e)}")

# Get integrated PMS data for employee
@router.get("/employee-pms-data/{employee_id}")
async def get_employee_pms_data(employee_id: int, db: Session = Depends(get_tenant_db)):
    try:
        # Get employee info
        employee = db.query(User).filter(User.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Get work assignments
        assignments_result = db.execute(text("""
            SELECT wa.*, ast.completion_status, ast.completion_percentage, ast.remarks, rc.cycle_name, rc.status as cycle_status
            FROM work_assignments wa
            LEFT JOIN assignment_status ast ON wa.id = ast.assignment_id AND ast.employee_id = wa.assigned_employee_id
            LEFT JOIN pms_review_cycles rc ON wa.review_cycle_id = rc.id
            WHERE wa.assigned_employee_id = :employee_id AND wa.is_active = 1
        """), {"employee_id": employee_id}).fetchall()
        
        assignments = []
        total_score = 0
        for row in assignments_result:
            completion_pct = row[10] or 0.0
            weighted_score = (row[3] * completion_pct) / 100
            total_score += weighted_score
            
            assignments.append({
                "id": row[0],
                "title": row[1],
                "category": row[2],
                "weightage_percentage": row[3],
                "frequency": row[4],
                "completion_status": row[9] or "Not Completed",
                "completion_percentage": completion_pct,
                "remarks": row[11] or "",
                "cycle_name": row[12],
                "cycle_status": row[13],
                "weighted_score": round(weighted_score, 2)
            })
        
        # Get feedback
        feedback_result = db.execute(text("""
            SELECT * FROM pms_feedback 
            WHERE to_employee_id = :employee_id AND is_active = 1
            ORDER BY created_at DESC
        """), {"employee_id": employee_id}).fetchall()
        
        feedback = []
        for row in feedback_result:
            feedback.append({
                "id": row[0],
                "from_employee_id": row[1],
                "relationship": row[3],
                "cycle": row[4],
                "rating": row[5],
                "comments": row[6],
                "strengths": row[7],
                "improvements": row[8],
                "created_at": row[10]
            })
        
        # Get appraisal
        appraisal_result = db.execute(text("""
            SELECT * FROM pms_appraisal 
            WHERE employee_id = :employee_id AND is_active = 1
            ORDER BY created_at DESC
            LIMIT 1
        """), {"employee_id": employee_id}).fetchone()
        
        appraisal = None
        if appraisal_result:
            appraisal = {
                "id": appraisal_result[0],
                "cycle": appraisal_result[2],
                "kpi_score": appraisal_result[3],
                "final_rating": appraisal_result[5],
                "recommendation": appraisal_result[6],
                "strengths": appraisal_result[9],
                "improvements": appraisal_result[10],
                "development_plan": appraisal_result[11],
                "comments": appraisal_result[12],
                "status": appraisal_result[15]
            }
        
        return {
            "data": {
                "employee": {
                    "id": employee.id,
                    "name": employee.name,
                    "email": employee.email,
                    "employee_code": employee.employee_code
                },
                "kpi_score": round(total_score, 2),
                "performance_status": "On Track" if total_score >= 75 else "Needs Improvement",
                "assignments": assignments,
                "feedback": feedback,
                "appraisal": appraisal
            }
        }
    except Exception as e:
        print(f"Error fetching employee PMS data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching employee PMS data: {str(e)}")
@router.get("/kpi-dashboard")
async def get_kpi_dashboard(db: Session = Depends(get_tenant_db), user = Depends(require_permission("view_goals_kpi"))):
    try:
        # Check permissions: if user has view_self, show only own records regardless of other permissions
        user_permissions = user.get('permissions', [])
        current_user_id = user.get('user_id')
        
        if 'view_self' in user_permissions and current_user_id:
            # Get only current user's KPI data
            result = db.execute(text("""
                SELECT DISTINCT wa.assigned_employee_id, u.name as employee_name
                FROM work_assignments wa
                LEFT JOIN users u ON wa.assigned_employee_id = u.id
                WHERE wa.is_active = 1 AND wa.assigned_employee_id = :user_id
            """), {"user_id": current_user_id}).fetchall()
        else:
            # Get all employees with work assignments
            result = db.execute(text("""
                SELECT DISTINCT wa.assigned_employee_id, u.name as employee_name
                FROM work_assignments wa
                LEFT JOIN users u ON wa.assigned_employee_id = u.id
                WHERE wa.is_active = 1
            """)).fetchall()
        
        kpi_data = []
        for row in result:
            employee_id = row[0]
            employee_name = row[1]
            
            # Get KPI score for this employee
            score_result = db.execute(text("""
                SELECT SUM(wa.weightage_percentage * COALESCE(ast.completion_percentage, 0) / 100) as total_score
                FROM work_assignments wa
                LEFT JOIN assignment_status ast ON wa.id = ast.assignment_id AND ast.employee_id = wa.assigned_employee_id
                WHERE wa.assigned_employee_id = :employee_id AND wa.is_active = 1
            """), {"employee_id": employee_id}).fetchone()
            
            score = score_result[0] if score_result[0] else 0.0
            status = "On Track" if score >= 75 else "Needs Improvement"
            
            # Get assignment count
            assignment_count = db.execute(text("""
                SELECT COUNT(*) FROM work_assignments 
                WHERE assigned_employee_id = :employee_id AND is_active = 1
            """), {"employee_id": employee_id}).scalar()
            
            kpi_data.append({
                "employee_id": employee_id,
                "employee_name": employee_name,
                "target_value": 100,  # Always locked at 100
                "current_value": round(score, 2),
                "progress": f"{round(score, 1)}%",
                "status": status,
                "assignment_count": assignment_count
            })
        
        return {"data": kpi_data}
    except Exception as e:
        print(f"Error fetching KPI dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching KPI dashboard: {str(e)}")

@router.get("/test-response")
async def test_response(db: Session = Depends(get_tenant_db)):
    try:
        goals = db.query(PMSGoal).limit(1).all()
        if goals:
            goal = goals[0]
            employee = db.query(User).filter(User.id == goal.employee_id).first() if goal.employee_id is not None else None
            employee_name = employee.name if employee else "Unknown"
            
            test_data = {
                "id": goal.id,
                "title": goal.title or "",
                "employee_id": goal.employee_id,
                "employee_name": employee_name,
                "employee": employee_name,
                "category": goal.goal_type or "",
                "priority": "Medium",
                "start_date": goal.start_date.strftime('%Y-%m-%d') if goal.start_date is not None else None,
                "end_date": goal.end_date.strftime('%Y-%m-%d') if goal.end_date is not None else None,
                "due_date": goal.end_date.strftime('%d-%m-%Y') if goal.end_date is not None else "No Due Date",
                "dueDate": goal.end_date.strftime('%d-%m-%Y') if goal.end_date is not None else "No Due Date",
                "Due Date": goal.end_date.strftime('%d-%m-%Y') if goal.end_date is not None else "No Due Date",
                "target_value": goal.target or "",
                "unit": goal.measurement_method or "",
                "status": goal.status or "Active",
                "progress": "0%"
            }
            return {"sample_goal": test_data}
        return {"message": "No goals found"}
    except Exception as e:
        return {"error": str(e)}

@router.post("/goals")
async def create_goal(goal: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("add_goal_kpi"))):
    try:
        print(f"Received goal data: {goal}")
        
        # Extract employee ID - handle both string and integer formats
        employee_id = None
        if goal.get('employee_id'):
            emp_id = goal['employee_id']
            if isinstance(emp_id, str) and emp_id.startswith('user_'):
                try:
                    employee_id = int(emp_id.replace('user_', ''))
                except ValueError:
                    print(f"Invalid employee_id format: {emp_id}")
            elif isinstance(emp_id, int):
                employee_id = emp_id
            else:
                print(f"Unexpected employee_id format: {emp_id}")
        
        # Parse dates safely
        start_date = None
        end_date = None
        try:
            from datetime import datetime
            if goal.get('start_date'):
                start_date = datetime.strptime(goal['start_date'], '%Y-%m-%d').date()
            if goal.get('end_date'):
                end_date = datetime.strptime(goal['end_date'], '%Y-%m-%d').date()
        except ValueError as date_error:
            print(f"Date parsing error: {date_error}")
        
        # Create new goal with mapped fields
        new_goal = PMSGoal(
            title=goal.get('title', ''),
            employee_id=employee_id,
            goal_type=goal.get('category', ''),
            start_date=start_date,
            end_date=end_date,
            target=goal.get('target_value', ''),
            current_value=goal.get('current_value', '0'),
            measurement_method=goal.get('unit', ''),
            status=goal.get('status', 'Active'),
            weightage=0,
            department=None,
            description=goal.get('description', ''),
            priority=goal.get('priority', 'Medium'),
            unit=goal.get('unit', '')
        )
        
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)
        
        # Audit log
        audit_crud(request, db, user, "CREATE_GOAL", "pms_goals", str(new_goal.id), {}, goal)
        
        print(f"Goal created successfully with ID: {new_goal.id}")
        return {"message": "Goal created successfully", "id": new_goal.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating goal: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=422, detail=f"Error creating goal: {str(e)}")

@router.get("/goals")
async def get_goals(include_deleted: bool = False, db: Session = Depends(get_tenant_db), user = Depends(require_permission("view_goals_kpi"))):
    try:
        print("Starting to fetch goals...")
        
        # Check permissions: if user has view_self, show only own records regardless of other permissions
        user_permissions = user.get('permissions', [])
        current_user_id = user.get('user_id')
        
        if include_deleted:
            # Show goals including deleted ones
            if 'view_self' in user_permissions and current_user_id:
                goals = db.query(PMSGoal).filter(PMSGoal.employee_id == current_user_id).all()
            else:
                goals = db.query(PMSGoal).all()
            print(f"Found {len(goals)} total goals (including deleted)")
        else:
            # Filter out deleted goals using is_active
            if 'view_self' in user_permissions and current_user_id:
                goals = db.query(PMSGoal).filter(PMSGoal.is_active == True, PMSGoal.employee_id == current_user_id).all()
            else:
                goals = db.query(PMSGoal).filter(PMSGoal.is_active == True).all()
            print(f"Found {len(goals)} active goals")
        
        goals_data = []
        for goal in goals:
            try:
                # Get employee name safely
                employee = None
                employee_name = "Unknown"
                if goal.employee_id is not None:
                    employee = db.query(User).filter(User.id == goal.employee_id).first()
                    if employee:
                        employee_name = employee.name
                
                # Calculate progress percentage
                progress_percentage = 0
                if goal.target is not None and goal.current_value is not None:
                    try:
                        target_val = float(str(goal.target))
                        current_val = float(str(goal.current_value))
                        if target_val > 0:
                            progress_percentage = min(100, (current_val / target_val) * 100)
                    except (ValueError, TypeError):
                        progress_percentage = 0
                
                goals_data.append({
                    "id": goal.id,
                    "title": goal.title or "",
                    "employee_id": goal.employee_id,
                    "employee_name": employee_name,
                    "employee": employee_name,
                    "category": goal.goal_type or "",
                    "priority": "Medium",
                    "start_date": goal.start_date.strftime('%Y-%m-%d') if goal.start_date is not None else None,
                    "end_date": goal.end_date.strftime('%d-%m-%Y') if goal.end_date is not None else "No Due Date",
                    "due_date": goal.end_date.strftime('%d-%m-%Y') if goal.end_date is not None else "No Due Date",
                    "dueDate": goal.end_date.strftime('%d-%m-%Y') if goal.end_date is not None else "No Due Date",
                    "Due Date": goal.end_date.strftime('%d-%m-%Y') if goal.end_date is not None else "No Due Date",
                    "deadline": goal.end_date.strftime('%d-%m-%Y') if goal.end_date is not None else "No Due Date",
                    "target_date": goal.end_date.strftime('%d-%m-%Y') if goal.end_date is not None else "No Due Date",
                    "target_value": goal.target or "",
                    "current_value": goal.current_value or "0",
                    "unit": goal.measurement_method or "",
                    "status": goal.status or "Active",
                    "weightage": goal.weightage or 0,
                    "department": goal.department or "",
                    "progress": f"{int(progress_percentage)}%",
                    "progress_percentage": int(progress_percentage),
                    "is_active": goal.is_active,
                    "created_at": goal.created_at.strftime('%Y-%m-%d %H:%M:%S') if goal.created_at is not None else None
                })
            except Exception as goal_error:
                print(f"Error processing goal {goal.id}: {str(goal_error)}")
                continue
        
        print(f"Returning {len(goals_data)} processed goals")
        return {"data": goals_data}
    except Exception as e:
        print(f"Error fetching goals: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching goals: {str(e)}")

@router.put("/goals/{goal_id}")
async def update_goal(goal_id: int, goal: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        db_goal = db.query(PMSGoal).filter(PMSGoal.id == goal_id, PMSGoal.is_active == True).first()
        if not db_goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Store old values for audit
        old_values = {"title": db_goal.title, "goal_type": db_goal.goal_type, "target": db_goal.target, "status": db_goal.status}
        
        # Extract employee ID - handle both string and integer formats
        employee_id = None
        if goal.get('employee_id'):
            emp_id = goal['employee_id']
            if isinstance(emp_id, str) and emp_id.startswith('user_'):
                try:
                    employee_id = int(emp_id.replace('user_', ''))
                except ValueError:
                    employee_id = db_goal.employee_id
            elif isinstance(emp_id, int):
                employee_id = emp_id
            else:
                employee_id = db_goal.employee_id
        
        # Parse dates safely
        new_start_date = None
        new_end_date = None
        try:
            from datetime import datetime
            if goal.get('start_date'):
                new_start_date = datetime.strptime(goal['start_date'], '%Y-%m-%d').date()
            if goal.get('end_date'):
                new_end_date = datetime.strptime(goal['end_date'], '%Y-%m-%d').date()
        except ValueError:
            pass
        
        # Update goal fields
        if goal.get('title') is not None:
            db_goal.title = goal['title']
        if goal.get('employee_id') is not None and employee_id is not None:
            setattr(db_goal, 'employee_id', employee_id)
        if goal.get('category') is not None:
            db_goal.goal_type = goal['category']
        if goal.get('start_date') is not None and new_start_date is not None:
            setattr(db_goal, 'start_date', new_start_date)
        if goal.get('end_date') is not None and new_end_date is not None:
            setattr(db_goal, 'end_date', new_end_date)
        if goal.get('target_value') is not None:
            db_goal.target = goal['target_value']
        if goal.get('current_value') is not None:
            db_goal.current_value = goal['current_value']
        if goal.get('unit') is not None:
            db_goal.measurement_method = goal['unit']
        if goal.get('status') is not None:
            db_goal.status = goal['status']
        
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "UPDATE_GOAL", "pms_goals", str(goal_id), old_values, goal)
        
        return {"message": "Goal updated successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error updating goal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error updating goal: {str(e)}")

@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        db_goal = db.query(PMSGoal).filter(PMSGoal.id == goal_id, PMSGoal.is_active == True).first()
        if not db_goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Store old values for audit
        old_values = {"title": db_goal.title, "goal_type": db_goal.goal_type, "target": db_goal.target, "is_active": db_goal.is_active}
        
        # Soft delete - set is_active to False
        db_goal.is_active = False
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "DELETE_GOAL", "pms_goals", str(goal_id), old_values, {"is_active": False})
        
        return {"message": "Goal deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting goal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error deleting goal: {str(e)}")

@router.put("/goals/{goal_id}/restore")
async def restore_goal(goal_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        db_goal = db.query(PMSGoal).filter(PMSGoal.id == goal_id, PMSGoal.is_active == False).first()
        if not db_goal:
            raise HTTPException(status_code=404, detail="Deleted goal not found")
        
        # Store old values for audit
        old_values = {"title": db_goal.title, "goal_type": db_goal.goal_type, "target": db_goal.target, "is_active": db_goal.is_active}
        
        # Restore - set is_active to True
        db_goal.is_active = True
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "RESTORE_GOAL", "pms_goals", str(goal_id), old_values, {"is_active": True})
        
        return {"message": "Goal restored successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error restoring goal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error restoring goal: {str(e)}")

