from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import PMSAppraisal, User
from pydantic import BaseModel
from typing import Optional
from datetime import date

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
async def create_appraisal(appraisal: dict, db: Session = Depends(get_tenant_db)):
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
        return {"message": "Appraisal created successfully", "id": db_appraisal.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating appraisal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error creating appraisal: {str(e)}")

@router.get("/appraisals")
async def get_appraisals(db: Session = Depends(get_tenant_db)):
    try:
        appraisals = db.query(PMSAppraisal).all()
        
        # Process appraisal data with progress tracking
        appraisal_data = []
        for appraisal in appraisals:
            # Get employee name
            employee_name = "Unknown"
            if appraisal.employee_id is not None:
                employee = db.query(User).filter(User.id == appraisal.employee_id).first()
                if employee is not None:
                    employee_name = employee.name
            
            # Calculate completion progress based on status
            completion_percentage = 0
            status_value = str(appraisal.status) if appraisal.status is not None else ""
            
            if status_value == "Draft":
                completion_percentage = 10
            elif status_value == "Proposed":
                completion_percentage = 25
            elif status_value == "In Progress":
                completion_percentage = 50
            elif status_value == "Completed":
                completion_percentage = 75
            elif status_value == "Approved":
                completion_percentage = 100
            else:
                # Fallback to field-based calculation
                completed_fields = 0
                total_fields = 4
                if appraisal.kpi_score is not None:
                    completed_fields += 1
                if appraisal.feedback_score is not None:
                    completed_fields += 1
                if appraisal.final_rating is not None:
                    completed_fields += 1
                
                # Check recommendation field safely
                recommendation_value = appraisal.recommendation
                has_recommendation = False
                if recommendation_value is not None:
                    try:
                        rec_str = str(recommendation_value).strip()
                        has_recommendation = bool(rec_str and rec_str != '')
                    except:
                        has_recommendation = False
                
                if has_recommendation:
                    completed_fields += 1
                    
                completion_percentage = int((completed_fields / total_fields) * 100)
            
            appraisal_data.append({
                "id": appraisal.id,
                "employee_id": appraisal.employee_id,
                "employee_name": employee_name,
                "cycle": appraisal.cycle,
                "kpi_score": appraisal.kpi_score,
                "feedback_score": appraisal.feedback_score,
                "final_rating": appraisal.final_rating,
                "recommendation": appraisal.recommendation,
                "increment_percent": appraisal.increment_percent,
                "recommended_role": appraisal.recommended_role,
                "strengths": appraisal.strengths,
                "improvements": appraisal.improvements,
                "development_plan": appraisal.development_plan,
                "comments": appraisal.comments,
                "effective_from": appraisal.effective_from.strftime('%Y-%m-%d') if appraisal.effective_from is not None else None,
                "status": appraisal.status,
                "progress": f"{int(completion_percentage)}%",
                "progress_percentage": int(completion_percentage),
                "created_at": appraisal.created_at.strftime('%Y-%m-%d %H:%M:%S') if appraisal.created_at is not None else None
            })
        
        return {"data": appraisal_data}
    except Exception as e:
        print(f"Error fetching appraisals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching appraisals: {str(e)}")

@router.put("/appraisals/{appraisal_id}")
async def update_appraisal(appraisal_id: int, appraisal: dict, db: Session = Depends(get_tenant_db)):
    try:
        db_appraisal = db.query(PMSAppraisal).filter(PMSAppraisal.id == appraisal_id).first()
        if not db_appraisal:
            raise HTTPException(status_code=404, detail="Appraisal not found")
        
        for field, value in appraisal.items():
            if hasattr(db_appraisal, field):
                setattr(db_appraisal, field, value)
        
        db.commit()
        return {"message": "Appraisal updated successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error updating appraisal: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error updating appraisal: {str(e)}")

@router.delete("/appraisals/{appraisal_id}")
async def delete_appraisal(appraisal_id: int, db: Session = Depends(get_tenant_db)):
    db_appraisal = db.query(PMSAppraisal).filter(PMSAppraisal.id == appraisal_id).first()
    if not db_appraisal:
        raise HTTPException(status_code=404, detail="Appraisal not found")
    
    db.delete(db_appraisal)
    db.commit()
    return {"message": "Appraisal deleted successfully"}