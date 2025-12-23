# routes/EIS/resignation_tracking.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import date

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from models.models_tenant import EmployeeExit, User
from schemas.schemas_tenant import ExitOut, ExitCreate

# ---------------------- TENANT SESSION ----------------------
def get_tenant_session(user):
    from models.models_master import Hospital
    from database import get_master_db

    tenant_db = user.get("tenant_db")
    master = next(get_master_db())

    hospital = master.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(404, "Tenant not found")

    engine = get_tenant_engine(hospital.db_name)
    return Session(bind=engine)

router = APIRouter(prefix="/resignation", tags=["Resignation Tracking"])

# -------------------------------------------------------------------------
# 1. LIST ALL RESIGNATIONS
# -------------------------------------------------------------------------
@router.get("/list")
def list_resignations(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    try:
        resignations = db.query(EmployeeExit).all()
        
        result = []
        for resignation in resignations:
            employee = db.query(User).filter(User.id == resignation.employee_id).first()
            
            result.append({
                "id": resignation.id,
                "employee_id": resignation.employee_id,
                "employee_name": employee.name if employee else "Unknown",
                "employee_code": getattr(employee, 'employee_code', None) if employee else None,
                "resignation_date": resignation.resignation_date,
                "last_working_day": resignation.last_working_day,
                "notice_period": resignation.notice_period,
                "notice_served": getattr(resignation, 'notice_served', False),
                "reason": resignation.reason,
                "overall_status": "Initiated",  # Default status since model doesn't have this field
                "handover_status": getattr(resignation, 'handover_status', 'Pending'),
                "asset_return_status": getattr(resignation, 'asset_return_status', 'Pending'),
                "clearance_status": getattr(resignation, 'clearance_status', 'Pending'),
                "final_settlement_status": getattr(resignation, 'final_settlement', 'Pending'),
                "exit_interview_completed": "Exit Interview Completed" in (resignation.notes or ""),
                "exit_interview_date": resignation.updated_at if "Exit Interview Completed" in (resignation.notes or "") else None,
                "updated_at": getattr(resignation, 'updated_at', None)
            })
        
        print(f"DEBUG: Found {len(result)} resignations")
        return {"resignations": result}
        
    except Exception as e:
        print(f"DEBUG: Error in list_resignations: {str(e)}")
        return {"resignations": []}

# -------------------------------------------------------------------------
# 2. APPLY RESIGNATION
# -------------------------------------------------------------------------
@router.post("/apply")
def apply_resignation(data: ExitCreate, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    try:
        print(f"DEBUG: Received resignation data: {data.dict()}")
        
        # Check if employee exists
        emp = db.query(User).filter(User.id == data.employee_id).first()
        if not emp:
            raise HTTPException(404, "Employee not found")

        # Check if resignation already exists
        existing = db.query(EmployeeExit).filter(EmployeeExit.employee_id == data.employee_id).first()
        if existing:
            raise HTTPException(400, "Resignation already exists for this employee")

        # Create resignation record with only required fields
        resignation = EmployeeExit(
            employee_id=data.employee_id,
            resignation_date=data.resignation_date,
            last_working_day=data.last_working_day,
            reason=data.reason,
            notice_period=data.notice_period or "30",
            notes=data.notes
        )
        
        # Add exit interview date to notes if provided
        if data.exit_interview_date:
            interview_note = f"Exit Interview Scheduled: {data.exit_interview_date}"
            if resignation.notes:
                resignation.notes += f"\n\n{interview_note}"
            else:
                resignation.notes = interview_note

        # Update employee status
        if hasattr(emp, 'status'):
            emp.status = "Resigned"

        db.add(resignation)
        db.commit()
        db.refresh(resignation)
        audit_crud(request, user.get("tenant_db"), user, "CREATE", "employee_exit", resignation.id, None, resignation.__dict__)

        return {"message": "Resignation applied successfully", "id": resignation.id}
        
    except Exception as e:
        print(f"DEBUG: Error in apply_resignation: {str(e)}")
        print(f"DEBUG: Error type: {type(e)}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# -------------------------------------------------------------------------
# 3. UPDATE RESIGNATION STATUS
# -------------------------------------------------------------------------
@router.put("/update/{resignation_id}")
def update_resignation_status(
    resignation_id: int,
    status_field: str,
    status_value: str,
    request: Request,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    
    resignation = db.query(EmployeeExit).filter(EmployeeExit.id == resignation_id).first()
    if not resignation:
        raise HTTPException(404, "Resignation not found")
    
    # Update specific status field
    if hasattr(resignation, status_field):
        setattr(resignation, status_field, status_value)
        
        # Update overall status based on individual statuses
        if all([
            resignation.handover_status == "Completed",
            resignation.asset_return_status == "Completed", 
            resignation.clearance_status == "Completed",
            resignation.final_settlement == "Completed"
        ]):
            # Update employee status to Inactive
            emp = db.query(User).filter(User.id == resignation.employee_id).first()
            if emp and hasattr(emp, 'status'):
                emp.status = "Inactive"
    
    db.commit()
    audit_crud(request, user.get("tenant_db"), user, "UPDATE", "employee_exit", resignation_id, None, {status_field: status_value})
    return {"message": f"{status_field} updated to {status_value}"}

# -------------------------------------------------------------------------
# 4. EXIT INTERVIEW
# -------------------------------------------------------------------------
@router.put("/interview/{resignation_id}")
def conduct_exit_interview(
    resignation_id: int,
    interview_data: dict,
    request: Request,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    
    resignation = db.query(EmployeeExit).filter(EmployeeExit.id == resignation_id).first()
    if not resignation:
        raise HTTPException(404, "Resignation not found")
    
    # Add to notes since exit interview fields don't exist in model
    interview_notes = f"Exit Interview Completed - Rating: {interview_data.get('rating')}, Feedback: {interview_data.get('feedback')}, Suggestions: {interview_data.get('suggestions')}"
    if resignation.notes:
        resignation.notes += f"\n\n{interview_notes}"
    else:
        resignation.notes = interview_notes
    
    db.commit()
    audit_crud(request, user.get("tenant_db"), user, "UPDATE", "employee_exit", resignation_id, None, {"interview_completed": True})
    return {"message": "Exit interview completed successfully"}