# routes/EIS/employee.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from utils.audit_logger import audit_crud
from utils.permission import require_permission

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
def get_employee_profile(employee_id: int, user=Depends(require_permission("view_employee_profile"))):
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
def add_exit_details(data: ExitCreate, request: Request, user=Depends(get_current_user)):
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
        last_working_day=getattr(data, 'last_working_day', None),
        reason=data.reason,
        notice_period=getattr(data, 'notice_period', "30"),
        exit_interview_date=getattr(data, 'exit_interview_date', None),
        handover_status=getattr(data, 'handover_status', "Pending"),
        asset_return_status=getattr(data, 'asset_return_status', "Pending"),
        final_settlement=getattr(data, 'final_settlement', "Pending"),
        clearance_status=getattr(data, 'clearance_status', "Pending"),
        notes=data.notes
    )
    
    db.add(exit_record)
    db.commit()
    db.refresh(exit_record)
    
    # Audit log
    audit_crud(request, db, user, "CREATE_EXIT_RECORD", "employee_exits", str(exit_record.id), {}, {"employee_id": data.employee_id, "reason": data.reason})
    
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
# 5. VALIDATE EMPLOYEE CODE
# -------------------------------------------------------------------------
@router.get("/validate/{employee_code}")
def validate_employee_code(employee_code: str, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    from models.models_tenant import User, OnboardingCandidate
    
    # Check in user management
    user_exists = db.query(User).filter(
        User.employee_code == employee_code
    ).first()
    
    # Check in onboarding records
    onboarding_exists = db.query(OnboardingCandidate).filter(
        OnboardingCandidate.employee_id == employee_code
    ).first()
    
    exists = user_exists is not None or onboarding_exists is not None
    
    return {
        "exists": exists,
        "employee_code": employee_code
    }
@router.put("/convert-user-to-employee/{user_id}")
def convert_user_to_employee(
    user_id: int,
    payload: dict,
    request: Request,
    user=Depends(require_permission("create_employee_code"))
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
        setattr(existing_user, 'employee_code', payload['employee_code'])
    elif existing_user.employee_code is None:
        # Generate employee code if not provided
        from datetime import datetime
        year = datetime.now().year
        last_emp = db.query(User).filter(User.employee_code.isnot(None)).order_by(User.id.desc()).first()
        seq_num = 1
        if last_emp and last_emp.employee_code is not None:
            try:
                seq_num = int(last_emp.employee_code.split(str(year))[-1]) + 1
            except:
                seq_num = 1
        setattr(existing_user, 'employee_code', f"EMP{year}{seq_num:03d}")

    # Update employee fields
    setattr(existing_user, 'employee_type', payload.get('employee_type', 'Permanent'))
    designation = payload.get('designation')
    if designation is not None:
        setattr(existing_user, 'designation', str(designation))
    joining_date = payload.get('joining_date')
    if joining_date is not None:
        setattr(existing_user, 'joining_date', joining_date)
    setattr(existing_user, 'status', payload.get('status', 'Active'))

    db.commit()
    
    # Audit log
    audit_crud(request, db, user, "CONVERT_USER_TO_EMPLOYEE", "users", str(user_id), {}, {"employee_code": existing_user.employee_code, "employee_type": payload.get('employee_type')})
    
    return {
        "message": "User converted to employee successfully", 
        "employee_code": existing_user.employee_code
    }

# -------------------------------------------------------------------------
# 6. CREATE EMPLOYEE FROM ONBOARDING
# -------------------------------------------------------------------------
@router.post("/create-from-onboarding/{onboarding_id}")
def create_employee_from_onboarding(
    onboarding_id: int,
    request: Request,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    
    from models.models_tenant import OnboardingCandidate
    
    # Get onboarding record
    onboarding = db.query(OnboardingCandidate).filter(
        OnboardingCandidate.id == onboarding_id
    ).first()
    
    if not onboarding:
        raise HTTPException(404, "Onboarding record not found")
    
    # Audit log
    audit_crud(request, db, user, "CREATE_EMPLOYEE_FROM_ONBOARDING", "onboarding_candidates", str(onboarding_id), {}, {"employee_id": onboarding.employee_id, "candidate_name": onboarding.candidate_name})
    
# -------------------------------------------------------------------------
# 7. CREATE EMPLOYEE CODE  
# -------------------------------------------------------------------------
@router.post("/create-employee-code")
def create_employee_code(
    request: Request,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    
    from models.models_tenant import User
    from datetime import datetime
    
    # Generate employee code
    year = datetime.now().year
    last_emp = db.query(User).filter(User.employee_code.isnot(None)).order_by(User.id.desc()).first()
    seq_num = 1
    if last_emp and last_emp.employee_code is not None:
        try:
            seq_num = int(last_emp.employee_code.split(str(year))[-1]) + 1
        except:
            seq_num = 1
    
    employee_code = f"EMP{year}{seq_num:03d}"
    
    # Audit log
    audit_crud(request, db, user, "GENERATE_EMPLOYEE_CODE", "system", "0", {}, {"employee_code": employee_code})
    
    return {
        "employee_code": employee_code,
        "message": "Employee code generated successfully"
    }

# -------------------------------------------------------------------------
# 8. SOFT DELETE EMPLOYEE
# -------------------------------------------------------------------------
@router.delete("/delete/{employee_id}")
def soft_delete_employee(
    employee_id: str,
    request: Request,
    user=Depends(require_permission("delete_employee"))
):
    db = get_tenant_session(user)
    
    from models.models_tenant import User, OnboardingCandidate
    
    # Check if it's a user employee (from user management)
    if employee_id.startswith('user_'):
        actual_user_id = employee_id.replace('user_', '')
        user_employee = db.query(User).filter(User.id == int(actual_user_id)).first()
        if user_employee:
            # Soft delete by setting status to Inactive
            setattr(user_employee, 'status', "Inactive")
            db.commit()
            
            # Audit log
            audit_crud(request, db, user, "SOFT_DELETE_EMPLOYEE", "users", str(actual_user_id), 
                      {"status": "Active"}, {"status": "Inactive"})
            
            return {"message": "Employee soft deleted successfully"}
    
    # Check if it's an onboarding employee
    onboarding_employee = db.query(OnboardingCandidate).filter(
        OnboardingCandidate.application_id == int(employee_id)
    ).first()
    
    if onboarding_employee:
        # Soft delete by setting status to Inactive
        setattr(onboarding_employee, 'status', "Inactive")
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "SOFT_DELETE_EMPLOYEE", "onboarding_candidates", str(employee_id), 
                  {"status": onboarding_employee.status}, {"status": "Inactive"})
        
        return {"message": "Employee soft deleted successfully"}
    
    raise HTTPException(404, "Employee not found")