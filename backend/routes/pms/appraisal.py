from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db, logger
from models.models_tenant import PMSAppraisal, User
from pydantic import BaseModel
from typing import Optional
from datetime import date
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user, require_permission

router = APIRouter()

class AppraisalCreate(BaseModel):
    employee_id: int
    cycle: str
    kpi_score: float
    feedback_score: float
    final_rating: float
    recommendation: str
    increment_percent: Optional[float] = None
    recommended_role: Optional[str] = None
    effective_from: Optional[date] = None
    status: str = "Proposed"

@router.post("/appraisals")
async def create_appraisal(appraisal: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("add_appraisal"))):
    try:
        # Parse date if provided
        effective_from = None
        if appraisal.get('effective_from'):
            from datetime import datetime
            effective_from = datetime.strptime(appraisal['effective_from'], '%Y-%m-%d').date()
        
        db_appraisal = PMSAppraisal(
            employee_id=appraisal.get('employee_id'),
            cycle=appraisal.get('cycle'),
            kpi_score=appraisal.get('kpi_score'),
            feedback_score=appraisal.get('feedback_score'),
            final_rating=appraisal.get('final_rating'),
            recommendation=appraisal.get('recommendation'),
            increment_percent=appraisal.get('increment_percent'),
            recommended_role=appraisal.get('recommended_role'),
            strengths=appraisal.get('strengths'),
            improvements=appraisal.get('improvements'),
            development_plan=appraisal.get('development_plan'),
            comments=appraisal.get('comments'),
            effective_from=effective_from,
            status=appraisal.get('status', 'Draft')
        )
        db.add(db_appraisal)
        db.commit()
        db.refresh(db_appraisal)
        
        # Audit log
        audit_crud(request, db, user, "CREATE_APPRAISAL", "pms_appraisals", str(db_appraisal.id), {}, appraisal)
        
        return {"message": "Appraisal created successfully", "id": db_appraisal.id}
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating appraisal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error creating appraisal: {str(e)}")

@router.get("/appraisals")
async def get_appraisals(include_deleted: bool = False, db: Session = Depends(get_tenant_db), user = Depends(require_permission("view_appraisals"))):
    # Check for show deleted permission if requesting deleted items
    if include_deleted:
        # Simple permission check - if user can view appraisals, they can view deleted ones
        pass
    
    try:
        from sqlalchemy import text
        
        # Get employees based on whether we want deleted or active appraisals
        if include_deleted:
            employees_result = db.execute(text("""
                SELECT DISTINCT wa.assigned_employee_id, u.name as employee_name, u.employee_code
                FROM work_assignments wa
                LEFT JOIN users u ON wa.assigned_employee_id = u.id
                WHERE wa.is_active = 0 AND u.name IS NOT NULL
            """)).fetchall()
            logger.debug(f"Found {len(employees_result)} deleted work assignments")
        else:
            employees_result = db.execute(text("""
                SELECT DISTINCT wa.assigned_employee_id, u.name as employee_name, u.employee_code
                FROM work_assignments wa
                LEFT JOIN users u ON wa.assigned_employee_id = u.id
                WHERE wa.is_active = 1 AND u.name IS NOT NULL
            """)).fetchall()
            logger.debug(f"Found {len(employees_result)} active work assignments")
        
        # If no employees found, return empty data
        if not employees_result:
            logger.debug(f"No employees found for include_deleted={include_deleted}")
            return {"data": []}
        
        appraisal_data = []
        current_year = "2025"
        
        for row in employees_result:
            employee_id = row[0]
            employee_name = row[1]
            employee_code = row[2]
            
            # Get employee identifier
            employee_identifier = employee_code
            if not employee_identifier:
                onboarded_result = db.execute(text("""
                    SELECT employee_id FROM onboarding_candidates 
                    WHERE candidate_name = :name AND employee_id IS NOT NULL
                    LIMIT 1
                """), {"name": employee_name}).fetchone()
                if onboarded_result:
                    employee_identifier = onboarded_result[0]
            
            # Calculate KPI score - only for active work assignments when showing deleted
            if include_deleted:
                kpi_result = db.execute(text("""
                    SELECT SUM(CASE WHEN ast.completion_status = 'Completed' THEN wa.weightage_percentage ELSE 0 END) as completed_score
                    FROM work_assignments wa
                    LEFT JOIN assignment_status ast ON wa.id = ast.assignment_id AND ast.employee_id = :employee_identifier
                    WHERE wa.assigned_employee_id = :employee_id AND wa.is_active = 0
                """), {"employee_id": employee_id, "employee_identifier": employee_identifier}).fetchone()
            else:
                kpi_result = db.execute(text("""
                    SELECT SUM(CASE WHEN ast.completion_status = 'Completed' THEN wa.weightage_percentage ELSE 0 END) as completed_score
                    FROM work_assignments wa
                    LEFT JOIN assignment_status ast ON wa.id = ast.assignment_id AND ast.employee_id = :employee_identifier
                    WHERE wa.assigned_employee_id = :employee_id AND wa.is_active = 1
                """), {"employee_id": employee_id, "employee_identifier": employee_identifier}).fetchone()
            
            kpi_score = kpi_result[0] if kpi_result and kpi_result[0] else 0.0
            
            # Auto-calculate rating
            if kpi_score >= 90:
                final_rating = 5.0
                status = "Excellent"
            elif kpi_score >= 75:
                final_rating = 4.0
                status = "Good"
            elif kpi_score >= 60:
                final_rating = 3.0
                status = "Satisfactory"
            else:
                final_rating = 2.0
                status = "Needs Improvement"
            appraisal_data.append({
                "id": employee_id,
                "employee_id": employee_identifier or employee_id,
                "employee_name": employee_name,
                "cycle": current_year,
                "kpi_score": round(kpi_score, 1),
                "final_rating": final_rating,
                "status": status,
                "rating_display": f"{final_rating}/5",
                "is_active": not include_deleted  # Mark as inactive if showing deleted
            })
        
        return {"data": appraisal_data}
    except Exception as e:
        logger.error(f"Error fetching appraisals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching appraisals: {str(e)}")

@router.put("/appraisals/{appraisal_id}")
async def update_appraisal(appraisal_id: int, appraisal: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("edit_appraisal"))):
    try:
        db_appraisal = db.query(PMSAppraisal).filter(PMSAppraisal.id == appraisal_id).first()
        if not db_appraisal:
            raise HTTPException(status_code=404, detail="Appraisal not found")
        
        # Store old values for audit
        old_values = {field: getattr(db_appraisal, field) for field in appraisal.keys() if hasattr(db_appraisal, field)}
        
        for field, value in appraisal.items():
            if hasattr(db_appraisal, field):
                setattr(db_appraisal, field, value)
        
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "UPDATE_APPRAISAL", "pms_appraisals", str(appraisal_id), old_values, appraisal)
        return {"message": "Appraisal updated successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating appraisal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error updating appraisal: {str(e)}")

@router.delete("/appraisals/{appraisal_id}")
async def delete_appraisal(appraisal_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("delete_appraisal"))):
    try:
        # Since appraisals are auto-generated from work assignments, we can't actually delete them
        # Instead, we'll mark the corresponding work assignment as deleted
        from sqlalchemy import text
        
        # Find the work assignment that corresponds to this appraisal ID (employee_id)
        result = db.execute(text("""
            SELECT wa.id FROM work_assignments wa
            WHERE wa.assigned_employee_id = :employee_id AND wa.is_active = 1
            LIMIT 1
        """), {"employee_id": appraisal_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Appraisal not found")
        
        # Soft delete the work assignment
        from datetime import datetime
        db.execute(text("""
            UPDATE work_assignments 
            SET is_active = 0, deleted_at = NOW(), updated_at = NOW()
            WHERE assigned_employee_id = :employee_id
        """), {"employee_id": appraisal_id})
        
        # Audit log
        audit_crud(request, db, user, "DELETE_APPRAISAL", "work_assignments", str(appraisal_id), {"is_active": 1}, {"is_active": 0, "deleted_at": datetime.now()})
        
        db.commit()
        return {"message": "Appraisal deleted successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting appraisal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error deleting appraisal: {str(e)}")

@router.put("/appraisals/{appraisal_id}/restore")
async def restore_appraisal(appraisal_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("restore_appraisal"))):
    try:
        # Since appraisals are auto-generated from work assignments, restore the work assignments
        from sqlalchemy import text
        
        # Find deleted work assignments for this employee
        result = db.execute(text("""
            SELECT wa.id FROM work_assignments wa
            WHERE wa.assigned_employee_id = :employee_id AND wa.is_active = 0
            LIMIT 1
        """), {"employee_id": appraisal_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Deleted appraisal not found")
        
        # Restore the work assignments
        db.execute(text("""
            UPDATE work_assignments 
            SET is_active = 1, deleted_at = NULL, updated_at = NOW()
            WHERE assigned_employee_id = :employee_id
        """), {"employee_id": appraisal_id})
        
        # Audit log
        audit_crud(request, db, user, "RESTORE_APPRAISAL", "work_assignments", str(appraisal_id), {"is_active": 0}, {"is_active": 1, "deleted_at": None})
        
        db.commit()
        return {"message": "Appraisal restored successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error restoring appraisal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error restoring appraisal: {str(e)}")

@router.get("/appraisals/deleted-count")
async def get_deleted_appraisals_count(
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("view_appraisals"))
):
    try:
        from sqlalchemy import text
        
        # Count employees who have deleted work assignments (deleted appraisals)
        count = db.execute(text("""
            SELECT COUNT(DISTINCT wa.assigned_employee_id) 
            FROM work_assignments wa
            WHERE wa.is_active = 0
        """)).scalar()
        
        logger.debug(f"Deleted appraisals count: {count}")
        return {"count": count or 0}
    except Exception as e:
        logger.error(f"Error getting deleted appraisals count: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))