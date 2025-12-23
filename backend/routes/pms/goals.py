from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_db
from models.models_tenant import PMSGoal, User
from pydantic import BaseModel, validator
from typing import Optional
from datetime import date
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

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
async def create_goal(goal: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
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
            department=None
        )
        
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)
        
        # Audit log
        audit_crud(request, "tenant", user, "CREATE_GOAL", "pms_goals", str(new_goal.id), None, goal)
        
        print(f"Goal created successfully with ID: {new_goal.id}")
        return {"message": "Goal created successfully", "id": new_goal.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating goal: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=422, detail=f"Error creating goal: {str(e)}")

@router.get("/goals")
async def get_goals(db: Session = Depends(get_tenant_db)):
    try:
        print("Starting to fetch goals...")
        goals = db.query(PMSGoal).all()
        print(f"Found {len(goals)} goals")
        
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
        db_goal = db.query(PMSGoal).filter(PMSGoal.id == goal_id).first()
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
        audit_crud(request, "tenant", user, "UPDATE_GOAL", "pms_goals", str(goal_id), old_values, goal)
        
        return {"message": "Goal updated successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error updating goal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error updating goal: {str(e)}")

@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        db_goal = db.query(PMSGoal).filter(PMSGoal.id == goal_id).first()
        if not db_goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Store old values for audit
        old_values = {"title": db_goal.title, "goal_type": db_goal.goal_type, "target": db_goal.target}
        
        db.delete(db_goal)
        db.commit()
        
        # Audit log
        audit_crud(request, "tenant", user, "DELETE_GOAL", "pms_goals", str(goal_id), old_values, None)
        
        return {"message": "Goal deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting goal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error deleting goal: {str(e)}")

