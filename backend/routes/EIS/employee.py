# routes/EIS/employee.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from routes.hospital import get_current_user
from database import get_tenant_engine
from schemas.schemas_tenant import ExitCreate, ExitOut

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

router = APIRouter(prefix="/employee", tags=["Employee Management"])

# -------------------------------------------------------------------------
# 1. GET EMPLOYEE PROFILE
# -------------------------------------------------------------------------
@router.get("/{employee_id}/profile")
def get_employee_profile(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    # Get employee from onboarding records
    from models.models_tenant import OnboardingCandidate, Candidate
    
    employee = db.query(OnboardingCandidate).filter(
        OnboardingCandidate.application_id == employee_id
    ).first()
    
    if not employee:
        raise HTTPException(404, "Employee not found")
    
    # Get candidate details
    candidate = db.query(Candidate).filter(Candidate.id == employee_id).first()
    
    return {
        "employee": {
            "id": employee.id,
            "application_id": employee.application_id,
            "name": employee.candidate_name,
            "email": candidate.email if candidate else None,
            "designation": employee.job_title,
            "department": employee.department,
            "employee_code": employee.employee_id,
            "joining_date": employee.joining_date,
            "work_location": employee.work_location,
            "reporting_manager": employee.reporting_manager,
            "status": employee.status or "Active"
        }
    }

# -------------------------------------------------------------------------
# 2. ADD EXIT DETAILS
# -------------------------------------------------------------------------
@router.post("/exit/add")
def add_exit_details(data: ExitCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    from models.models_tenant import EmployeeExit
    
    # Check if exit record already exists
    existing = db.query(EmployeeExit).filter(
        EmployeeExit.employee_id == data.employee_id
    ).first()
    
    if existing:
        raise HTTPException(400, "Exit record already exists for this employee")
    
    exit_record = EmployeeExit(
        employee_id=data.employee_id,
        resignation_date=data.resignation_date,
        last_working_day=data.last_working_day,
        reason=data.reason,
        notice_period=data.notice_period,
        exit_interview_date=data.exit_interview_date,
        handover_status=data.handover_status,
        asset_return_status=data.asset_return_status,
        final_settlement=data.final_settlement,
        clearance_status=data.clearance_status,
        notes=data.notes
    )
    
    db.add(exit_record)
    db.commit()
    db.refresh(exit_record)
    
    return {"message": "Exit process initiated successfully", "id": exit_record.id}

# -------------------------------------------------------------------------
# 3. GET EXIT DETAILS
# -------------------------------------------------------------------------
@router.get("/exit/{employee_id}", response_model=ExitOut)
def get_exit_details(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    from models.models_tenant import EmployeeExit
    
    exit_record = db.query(EmployeeExit).filter(
        EmployeeExit.employee_id == employee_id
    ).first()
    
    if not exit_record:
        raise HTTPException(404, "Exit record not found")
    
    return exit_record


# -------------------------------------------------------------------------
# 4. CONVERT USER TO EMPLOYEE
# -------------------------------------------------------------------------
@router.put("/convert-user-to-employee/{user_id}")
def convert_user_to_employee(
    user_id: int,
    payload: dict,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    
    from models.models_tenant import User
    
    existing_user = db.query(User).filter(User.id == user_id).first()
    if not existing_user:
        raise HTTPException(404, "User not found")

    # Use provided employee code or generate one
    if payload.get('employee_code'):
        # Check if employee code already exists in user management
        existing_code = db.query(User).filter(
            User.employee_code == payload['employee_code'],
            User.id != user_id
        ).first()
        
        # Also check in onboarding records
        from models.models_tenant import OnboardingCandidate
        existing_onboarding = db.query(OnboardingCandidate).filter(
            OnboardingCandidate.employee_id == payload['employee_code']
        ).first()
        
        if existing_code or existing_onboarding:
            raise HTTPException(400, "Employee code already exists")
        existing_user.employee_code = payload['employee_code']
    elif not existing_user.employee_code:
        # Generate employee code if not provided
        from datetime import datetime
        year = datetime.now().year
        last_emp = db.query(User).filter(User.employee_code.isnot(None)).order_by(User.id.desc()).first()
        seq_num = 1
        if last_emp and last_emp.employee_code:
            try:
                seq_num = int(last_emp.employee_code.split(str(year))[-1]) + 1
            except:
                seq_num = 1
        existing_user.employee_code = f"EMP{year}{seq_num:03d}"

    # Update employee fields
    existing_user.employee_type = payload.get('employee_type', 'Permanent')
    existing_user.designation = payload.get('designation')
    existing_user.joining_date = payload.get('joining_date')
    existing_user.status = payload.get('status', 'Active')

    db.commit()
    
    return {
        "message": "User converted to employee successfully", 
        "employee_code": existing_user.employee_code
    }