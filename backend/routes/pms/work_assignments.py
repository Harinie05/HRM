from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_tenant_db
from models.models_tenant import User, PMSReview, WorkAssignment, AssignmentStatus
from pydantic import BaseModel
from typing import Optional
from datetime import date
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user
from utils.permission import require_permission

router = APIRouter()

# Create sample data for testing
@router.post("/work-assignments/create-sample-data")
async def create_sample_data(db: Session = Depends(get_tenant_db)):
    try:
        existing_review = db.query(PMSReview).first()
        if not existing_review:
            sample_review = PMSReview(
                employee_id=1,
                cycle="Sample Review Cycle",
                review_type="Annual",
                status="Draft"
            )
            db.add(sample_review)
            db.commit()
            return {"message": "Sample review created"}
        return {"message": "Sample data already exists"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Get review cycles with automated progress
@router.get("/work-assignments/review-cycles")
async def get_review_cycles(include_deleted: bool = False, db: Session = Depends(get_tenant_db)):
    try:
        if include_deleted:
            reviews = db.query(PMSReview).all()
        else:
            reviews = db.query(PMSReview).filter(PMSReview.deleted_at.is_(None)).all()
        cycles_data = []
        for review in reviews:
            # Calculate progress automatically
            progress_result = db.execute(text("""
                SELECT 
                    COUNT(wa.id) as total_assignments,
                    COUNT(CASE WHEN ast.completion_status = 'Completed' THEN 1 END) as completed_assignments
                FROM work_assignments wa
                LEFT JOIN assignment_status ast ON wa.id = ast.assignment_id
                WHERE wa.review_cycle_id = :cycle_id AND wa.is_active = 1
            """), {"cycle_id": review.id}).fetchone()
            
            total = progress_result[0] if progress_result else 0
            completed = progress_result[1] if progress_result else 0
            progress = round((completed / total * 100) if total > 0 else 0, 1)
            
            cycles_data.append({
                "id": review.id,
                "cycle_name": review.cycle,
                "start_date": None,
                "end_date": None,
                "status": review.status,
                "progress": progress,
                "total_assignments": total,
                "completed_assignments": completed,
                "participants": db.execute(text("SELECT COUNT(DISTINCT assigned_employee_id) FROM work_assignments WHERE review_cycle_id = :cycle_id"), {"cycle_id": review.id}).scalar() or 0
            })
        return {"data": cycles_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delete review cycle (soft delete)
@router.delete("/work-assignments/review-cycles/{cycle_id}")
async def delete_review_cycle(cycle_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("delete_review_cycle"))):
    try:
        cycle = db.query(PMSReviewCycle).filter(PMSReviewCycle.id == cycle_id, PMSReviewCycle.deleted_at.is_(None)).first()
        if not cycle:
            raise HTTPException(status_code=404, detail="Review cycle not found")
        
        # Store old values for audit
        old_values = {"is_active": cycle.is_active, "deleted_at": cycle.deleted_at}
        
        # Soft delete
        from datetime import datetime
        cycle.is_active = False
        cycle.deleted_at = datetime.now()
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "DELETE_REVIEW_CYCLE", "pms_review_cycles", str(cycle_id), old_values, {"is_active": False, "deleted_at": cycle.deleted_at})
        return {"message": "Review cycle deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting review cycle: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error deleting review cycle: {str(e)}")

# Restore review cycle
@router.put("/work-assignments/review-cycles/{cycle_id}/restore")
async def restore_review_cycle(cycle_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("restore_review_cycle"))):
    try:
        cycle = db.query(PMSReviewCycle).filter(PMSReviewCycle.id == cycle_id, PMSReviewCycle.deleted_at.isnot(None)).first()
        if not cycle:
            raise HTTPException(status_code=404, detail="Deleted review cycle not found")
        
        # Store old values for audit
        old_values = {"is_active": cycle.is_active, "deleted_at": cycle.deleted_at}
        
        # Restore
        cycle.is_active = True
        cycle.deleted_at = None
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "RESTORE_REVIEW_CYCLE", "pms_review_cycles", str(cycle_id), old_values, {"is_active": True, "deleted_at": None})
        return {"message": "Review cycle restored successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error restoring review cycle: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error restoring review cycle: {str(e)}")

# Update review cycle
@router.put("/work-assignments/review-cycles/{cycle_id}")
async def update_review_cycle(cycle_id: int, cycle: dict, db: Session = Depends(get_tenant_db)):
    try:
        existing_cycle = db.query(PMSReviewCycle).filter(PMSReviewCycle.id == cycle_id, PMSReviewCycle.deleted_at.is_(None)).first()
        if not existing_cycle:
            raise HTTPException(status_code=404, detail="Review cycle not found")
        
        existing_cycle.cycle_name = cycle.get("cycle_name", existing_cycle.cycle_name)
        existing_cycle.start_date = cycle.get("start_date", existing_cycle.start_date)
        existing_cycle.end_date = cycle.get("end_date", existing_cycle.end_date)
        existing_cycle.status = cycle.get("status", existing_cycle.status)
        
        db.commit()
        return {"message": "Review cycle updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Create review cycle
@router.post("/work-assignments/review-cycles")
async def create_review_cycle_for_assignments(cycle: dict, db: Session = Depends(get_tenant_db)):
    try:
        new_cycle = PMSReviewCycle(
            cycle_name=cycle["cycle_name"],
            start_date=cycle["start_date"],
            end_date=cycle["end_date"],
            status=cycle.get("status", "Open")
        )
        db.add(new_cycle)
        db.commit()
        return {"message": "Review cycle created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Get work assignments
@router.get("/work-assignments/assignments")
async def get_assignments(
    include_deleted: bool = False,
    db: Session = Depends(get_tenant_db), 
    user = Depends(require_permission("view_work_assignments"))
):
    try:
        where_clause = "WHERE wa.is_active = 1" if not include_deleted else "WHERE 1=1"
        
        # Check permissions: if user has view_self, show only own records regardless of other permissions
        user_permissions = user.get('permissions', [])
        if 'view_self' in user_permissions:
            current_user_id = user.get('user_id')
            if current_user_id:
                where_clause += f" AND wa.assigned_employee_id = {current_user_id}"
        
        result = db.execute(text(f"""
            SELECT wa.id, wa.title, wa.category, wa.weightage_percentage, wa.frequency, 
                   wa.review_cycle_id, wa.assigned_employee_id, wa.status, wa.is_active,
                   wa.deleted_at,
                   u.name as employee_name, rc.cycle
            FROM work_assignments wa
            LEFT JOIN users u ON wa.assigned_employee_id = u.id
            LEFT JOIN pms_reviews rc ON wa.review_cycle_id = rc.id
            {where_clause}
            ORDER BY wa.created_at DESC
        """)).fetchall()
        
        assignments = []
        for row in result:
            assignments.append({
                "id": row[0],
                "title": row[1],
                "category": row[2],
                "weightage_percentage": row[3],
                "frequency": row[4],
                "review_cycle_id": row[5],
                "assigned_employee_id": row[6],
                "status": row[7],
                "is_active": row[8],
                "deleted_at": row[9],
                "employee_name": row[10],
                "cycle_name": row[11]
            })
        return {"data": assignments}
    except Exception as e:
        print(f"Error fetching assignments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Delete work assignment (soft delete)
@router.delete("/work-assignments/assignments/{assignment_id}")
async def delete_assignment(
    request: Request,
    assignment_id: int,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("delete_work_assignment"))
):
    try:
        # Check if assignment exists
        result = db.execute(text("""
            SELECT id, title FROM work_assignments WHERE id = :assignment_id AND is_active = 1
        """), {"assignment_id": assignment_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        # Soft delete the assignment
        db.execute(text("""
            UPDATE work_assignments 
            SET is_active = 0, deleted_at = NOW(), updated_at = NOW()
            WHERE id = :assignment_id
        """), {"assignment_id": assignment_id})
        
        # Log the audit trail
        audit_crud(request, db, user, "DELETE_WORK_ASSIGNMENT", "work_assignments", str(assignment_id), 
                  {"title": result[1], "is_active": 1}, {"is_active": 0, "deleted_at": "NOW()"})
        
        db.commit()
        return {"message": "Assignment deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Restore work assignment
@router.put("/work-assignments/assignments/{assignment_id}/restore")
async def restore_assignment(
    request: Request,
    assignment_id: int,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("restore_work_assignment"))
):
    try:
        # Check if assignment exists and is deleted
        result = db.execute(text("""
            SELECT id, title FROM work_assignments WHERE id = :assignment_id AND is_active = 0
        """), {"assignment_id": assignment_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Deleted assignment not found")
        
        # Restore the assignment
        db.execute(text("""
            UPDATE work_assignments 
            SET is_active = 1, deleted_at = NULL, updated_at = NOW()
            WHERE id = :assignment_id
        """), {"assignment_id": assignment_id})
        
        # Log the audit trail
        audit_crud(request, db, user, "RESTORE_WORK_ASSIGNMENT", "work_assignments", str(assignment_id),
                  {"title": result[1], "is_active": 0}, {"is_active": 1, "deleted_at": None})
        
        db.commit()
        return {"message": "Assignment restored successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error restoring assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Get deleted count
@router.get("/work-assignments/deleted-count")
async def get_deleted_count(
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("view_work_assignments"))
):
    try:
        count = db.execute(text("""
            SELECT COUNT(*) FROM work_assignments WHERE is_active = 0
        """)).scalar()
        
        return {"count": count or 0}
    except Exception as e:
        print(f"Error getting deleted count: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/work-assignments/assignments")
async def create_assignment(
    request: Request,
    assignment: dict, 
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("add_work_assignment"))
):
    try:
        # First create the tables if they don't exist
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS work_assignments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(50) NOT NULL,
                weightage_percentage FLOAT NOT NULL,
                frequency VARCHAR(50) NOT NULL,
                review_cycle_id INT NOT NULL,
                assigned_employee_id INT NOT NULL,
                status VARCHAR(50) DEFAULT 'Active',
                is_active BOOLEAN DEFAULT 1,
                deleted_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """))
        
        # Add deleted_at column if it doesn't exist
        try:
            db.execute(text("""
                ALTER TABLE work_assignments ADD COLUMN deleted_at DATETIME NULL
            """))
        except:
            pass  # Column already exists
        
        # Fix any existing NULL records
        db.execute(text("""
            UPDATE work_assignments 
            SET status = 'Active', is_active = 1, created_at = NOW(), updated_at = NOW() 
            WHERE status IS NULL OR is_active IS NULL
        """))
        
        db.execute(text("""
            INSERT INTO work_assignments (title, category, weightage_percentage, frequency, review_cycle_id, assigned_employee_id, status, is_active, created_at, updated_at)
            VALUES (:title, :category, :weightage_percentage, :frequency, :review_cycle_id, :assigned_employee_id, 'Active', 1, NOW(), NOW())
        """), assignment)
        
        # Get the inserted ID
        result = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()
        
        # Log the audit trail
        audit_crud(request, db, user, "CREATE_WORK_ASSIGNMENT", "work_assignments", str(result), {}, assignment)
        
        db.commit()
        return {"message": "Assignment created successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error creating assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Get employee assignments with status
@router.get("/work-assignments/my-assignments")
async def get_my_assignments(db: Session = Depends(get_tenant_db), user = Depends(require_permission("view_my_assignments"))):
    try:
        current_user_id = user.get('user_id')
        print(f"Debug: Current user ID: {current_user_id}")
        
        if not current_user_id:
            return {"data": []}
        
        # First check if there are any assignments for this user
        check_result = db.execute(text("""
            SELECT COUNT(*) FROM work_assignments WHERE assigned_employee_id = :user_id AND is_active = 1
        """), {"user_id": current_user_id}).scalar()
        print(f"Debug: Found {check_result} assignments for user {current_user_id}")
        
        result = db.execute(text("""
            SELECT wa.id, wa.title, wa.category, wa.weightage_percentage, wa.frequency,
                   COALESCE(ast.completion_status, 'Not Started') as completion_status,
                   COALESCE(ast.completion_percentage, 0.0) as completion_percentage,
                   COALESCE(ast.remarks, '') as remarks,
                   COALESCE(rc.cycle, 'No Cycle') as cycle_name
            FROM work_assignments wa
            LEFT JOIN assignment_status ast ON wa.id = ast.assignment_id AND ast.employee_id = wa.assigned_employee_id
            LEFT JOIN pms_reviews rc ON wa.review_cycle_id = rc.id
            WHERE wa.assigned_employee_id = :user_id AND wa.is_active = 1
        """), {"user_id": current_user_id}).fetchall()
        
        print(f"Debug: Query returned {len(result)} rows")
        
        assignments = []
        for row in result:
            assignment = {
                "id": row[0],
                "title": row[1],
                "category": row[2],
                "weightage_percentage": row[3],
                "frequency": row[4],
                "completion_status": row[5],
                "completion_percentage": row[6],
                "remarks": row[7],
                "cycle_name": row[8],
                "can_update": True
            }
            assignments.append(assignment)
            print(f"Debug: Added assignment: {assignment}")
        
        return {"data": assignments}
        
    except Exception as e:
        print(f"Error in get_my_assignments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Quick complete assignment
@router.post("/work-assignments/assignments/{assignment_id}/complete")
async def complete_assignment(assignment_id: int, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        user_name = user.get('name') if isinstance(user, dict) else getattr(user, 'name', None)
        user_email = user.get('email') if isinstance(user, dict) else getattr(user, 'email', None)
        
        if not user_name and user_email:
            user_result = db.execute(text("SELECT name FROM users WHERE email = :email LIMIT 1"), {"email": user_email}).fetchone()
            if user_result:
                user_name = user_result[0]
        
        employee_identifier = user.get('employee_code')
        if not employee_identifier:
            onboarded_result = db.execute(text("SELECT employee_id FROM onboarding_candidates WHERE candidate_name = :name AND employee_id IS NOT NULL LIMIT 1"), {"name": user_name}).fetchone()
            if onboarded_result:
                employee_identifier = onboarded_result[0]
        
        db.execute(text("""
            INSERT INTO assignment_status (assignment_id, employee_id, completion_status, completion_percentage, remarks, updated_at)
            VALUES (:assignment_id, :employee_id, 'Completed', 100.0, 'Marked as completed', NOW())
            ON DUPLICATE KEY UPDATE 
            completion_status = 'Completed', completion_percentage = 100.0, remarks = 'Marked as completed', updated_at = NOW()
        """), {
            "assignment_id": assignment_id,
            "employee_id": employee_identifier
        })
        
        db.commit()
        return {"message": "Assignment marked as completed"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Update assignment status
@router.put("/work-assignments/assignments/{assignment_id}/status")
async def update_assignment_status(assignment_id: int, status_data: dict, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        user_name = user.get('name') if isinstance(user, dict) else getattr(user, 'name', None)
        user_email = user.get('email') if isinstance(user, dict) else getattr(user, 'email', None)
        
        if not user_name and user_email:
            user_result = db.execute(text("SELECT name FROM users WHERE email = :email LIMIT 1"), {"email": user_email}).fetchone()
            if user_result:
                user_name = user_result[0]
        
        employee_identifier = user.get('employee_code')
        if not employee_identifier:
            onboarded_result = db.execute(text("SELECT employee_id FROM onboarding_candidates WHERE candidate_name = :name AND employee_id IS NOT NULL LIMIT 1"), {"name": user_name}).fetchone()
            if onboarded_result:
                employee_identifier = onboarded_result[0]
        
        db.execute(text("""
            INSERT INTO assignment_status (assignment_id, employee_id, completion_status, completion_percentage, remarks, updated_at)
            VALUES (:assignment_id, :employee_id, :status, :percentage, :remarks, NOW())
            ON DUPLICATE KEY UPDATE 
            completion_status = :status, completion_percentage = :percentage, remarks = :remarks, updated_at = NOW()
        """), {
            "assignment_id": assignment_id,
            "employee_id": employee_identifier,
            "status": status_data.get("completion_status", "Completed"),
            "percentage": status_data.get("completion_percentage", 100.0),
            "remarks": status_data.get("remarks", "")
        })
        
        db.commit()
        return {"message": "Assignment status updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# KPI Dashboard
@router.get("/kpi-dashboard")
async def get_kpi_dashboard(db: Session = Depends(get_tenant_db)):
    try:
        result = db.execute(text("""
            SELECT 
                u.name as employee_name,
                u.id as employee_id,
                100.0 as target_value,
                COALESCE(SUM(CASE WHEN ast.completion_status = 'Completed' THEN wa.weightage_percentage ELSE 0 END), 0) as current_value,
                COUNT(wa.id) as total_assignments,
                COUNT(CASE WHEN ast.completion_status = 'Completed' THEN 1 END) as completed_assignments
            FROM users u
            LEFT JOIN work_assignments wa ON wa.assigned_employee_id = u.id AND wa.is_active = 1
            LEFT JOIN assignment_status ast ON wa.id = ast.assignment_id AND ast.employee_id = u.id
            GROUP BY u.id, u.name
            HAVING total_assignments > 0
        """)).fetchall()
        
        dashboard_data = []
        for row in result:
            progress = min(row[2], 100.0)  # Cap at 100%
            status = "On Track" if progress >= 80 else "Below Target" if progress >= 50 else "Needs Attention"
            
            dashboard_data.append({
                "employee_name": row[0],
                "employee_id": row[1],
                "target_value": row[2],
                "current_value": row[3],
                "progress": progress,
                "status": status,
                "total_assignments": row[4],
                "completed_assignments": row[5]
            })
        
        return {"data": dashboard_data}
        
    except Exception as e:
        print(f"Error in kpi_dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Employees endpoint for compatibility
@router.get("/goals/employees")
async def get_employees_compat(db: Session = Depends(get_tenant_db)):
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
        raise HTTPException(status_code=500, detail=str(e))

# KPI Dashboard endpoint for compatibility
@router.get("/goals/kpi-dashboard")
async def get_kpi_dashboard_compat(db: Session = Depends(get_tenant_db)):
    try:
        result = db.execute(text("""
            SELECT DISTINCT wa.assigned_employee_id, u.name as employee_name, u.employee_code
            FROM work_assignments wa
            LEFT JOIN users u ON wa.assigned_employee_id = u.id
            WHERE wa.is_active = 1 AND u.name IS NOT NULL
        """)).fetchall()
        
        kpi_data = []
        for row in result:
            employee_id = row[0]
            employee_name = row[1]
            employee_code = row[2]
            
            # Get employee identifier from onboarding if no employee_code
            employee_identifier = employee_code
            if not employee_identifier:
                onboarded_result = db.execute(text("""
                    SELECT employee_id FROM onboarding_candidates 
                    WHERE candidate_name = :name AND employee_id IS NOT NULL
                    LIMIT 1
                """), {"name": employee_name}).fetchone()
                if onboarded_result:
                    employee_identifier = onboarded_result[0]
            
            # Get scores using the correct employee identifier
            score_result = db.execute(text("""
                SELECT 
                    SUM(wa.weightage_percentage) as total_weightage,
                    SUM(CASE WHEN ast.completion_status = 'Completed' THEN wa.weightage_percentage ELSE 0 END) as completed_score
                FROM work_assignments wa
                LEFT JOIN assignment_status ast ON wa.id = ast.assignment_id AND ast.employee_id = :employee_identifier
                WHERE wa.assigned_employee_id = :employee_id AND wa.is_active = 1
            """), {"employee_id": employee_id, "employee_identifier": employee_identifier}).fetchone()
            
            total_weightage = score_result[0] if score_result and score_result[0] else 0.0
            completed_score = score_result[1] if score_result and score_result[1] else 0.0
            
            assignment_count = db.execute(text("""
                SELECT COUNT(*) FROM work_assignments 
                WHERE assigned_employee_id = :employee_id AND is_active = 1
            """), {"employee_id": employee_id}).scalar() or 0
            
            print(f"Employee {employee_name} (ID: {employee_id}): assignments={assignment_count}, score={completed_score}")
            
            kpi_data.append({
                "employee_id": employee_identifier or employee_id,
                "employee": employee_name or "Unknown",
                "employee_name": employee_name or "Unknown",
                "target_value": 100,
                "current_value": round(completed_score, 2),
                "progress": f"{round(completed_score, 1)}%",
                "status": "On Track" if completed_score >= 75 else "Needs Improvement",
                "total_assignments": assignment_count,
                "assignment_count": assignment_count
            })
        
        return {"data": kpi_data}
    except Exception as e:
        print(f"KPI Dashboard error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Debug endpoint
@router.get("/debug/user-info")
async def debug_user_info(db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        user_employee_code = user.get('employee_code') if isinstance(user, dict) else getattr(user, 'employee_code', None)
        user_name = user.get('name') if isinstance(user, dict) else getattr(user, 'name', None)
        user_email = user.get('email') if isinstance(user, dict) else getattr(user, 'email', None)
        user_id = user.get('user_id') if isinstance(user, dict) else getattr(user, 'user_id', None)
        
        # If name is null, try to get it from database
        if not user_name and user_email:
            try:
                user_result = db.execute(text("""
                    SELECT name FROM users WHERE email = :email LIMIT 1
                """), {"email": user_email}).fetchone()
                if user_result:
                    user_name = user_result[0]
            except Exception as e:
                print(f"Error getting user name from database: {e}")
        
        employee_identifier = None
        
        if user_employee_code:
            employee_identifier = user_employee_code
        else:
            try:
                onboarded_result = db.execute(text("""
                    SELECT employee_id FROM onboarding_candidates 
                    WHERE candidate_name = :name AND employee_id IS NOT NULL
                    LIMIT 1
                """), {"name": user_name}).fetchone()
                
                if onboarded_result:
                    employee_identifier = onboarded_result[0]
            except Exception as e:
                print(f"Error checking onboarding_candidates table: {e}")
        
        return {
            "user_employee_code": user_employee_code,
            "user_name": user_name,
            "user_email": user_email,
            "user_id": user_id,
            "employee_identifier": employee_identifier
        }
        
    except Exception as e:
        print(f"Error in debug_user_info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))