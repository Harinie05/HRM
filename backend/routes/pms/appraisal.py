from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import PMSAppraisal, User
from pydantic import BaseModel
from typing import Optional
from datetime import date
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

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
async def create_appraisal(appraisal: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
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
        audit_crud(request, "tenant", user, "CREATE_APPRAISAL", "pms_appraisals", str(db_appraisal.id), None, appraisal)
        
        return {"message": "Appraisal created successfully", "id": db_appraisal.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating appraisal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error creating appraisal: {str(e)}")

@router.get("/appraisals")
async def get_appraisals(db: Session = Depends(get_tenant_db)):
    try:
        from sqlalchemy import text
        
        # Get all employees with work assignments and auto-generate appraisals
        employees_result = db.execute(text("""
            SELECT DISTINCT wa.assigned_employee_id, u.name as employee_name, u.employee_code
            FROM work_assignments wa
            LEFT JOIN users u ON wa.assigned_employee_id = u.id
            WHERE wa.is_active = 1 AND u.name IS NOT NULL
        """)).fetchall()
        
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
            
            # Calculate KPI score
            kpi_result = db.execute(text("""
                SELECT SUM(CASE WHEN ast.completion_status = 'Completed' THEN wa.weightage_percentage ELSE 0 END) as completed_score
                FROM work_assignments wa
                LEFT JOIN assignment_status ast ON wa.id = ast.assignment_id AND ast.employee_id = :employee_identifier
                WHERE wa.assigned_employee_id = :employee_id AND wa.is_active = 1
            """), {"employee_id": employee_id, "employee_identifier": employee_identifier}).fetchone()
            
            kpi_score = kpi_result[0] if kpi_result[0] else 0.0
            
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
                "rating_display": f"{final_rating}/5"
            })
        
        return {"data": appraisal_data}
    except Exception as e:
        print(f"Error fetching appraisals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching appraisals: {str(e)}")

@router.put("/appraisals/{appraisal_id}")
async def update_appraisal(appraisal_id: int, appraisal: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
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
        audit_crud(request, "tenant", user, "UPDATE_APPRAISAL", "pms_appraisals", str(appraisal_id), old_values, appraisal)
        return {"message": "Appraisal updated successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error updating appraisal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error updating appraisal: {str(e)}")

@router.delete("/appraisals/{appraisal_id}")
async def delete_appraisal(appraisal_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    db_appraisal = db.query(PMSAppraisal).filter(PMSAppraisal.id == appraisal_id).first()
    if not db_appraisal:
        raise HTTPException(status_code=404, detail="Appraisal not found")
    
    # Store old values for audit
    old_values = {"employee_id": db_appraisal.employee_id, "cycle": db_appraisal.cycle, "final_rating": db_appraisal.final_rating}
    
    db.delete(db_appraisal)
    db.commit()
    
    # Audit log
    audit_crud(request, "tenant", user, "DELETE_APPRAISAL", "pms_appraisals", str(appraisal_id), old_values, None)
    return {"message": "Appraisal deleted successfully"}