# routes/EIS/exit.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeExit, User
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


router = APIRouter(prefix="/employee/exit", tags=["Employee Exit & Separation"])


# -------------------------------------------------------------------------
# 1. ADD EXIT DETAILS
# -------------------------------------------------------------------------
@router.post("/add", response_model=ExitOut)
def add_exit(data: ExitCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    emp = db.query(User).filter(User.id == data.employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    # Change employee status to Resigned
    setattr(emp, 'status', "Resigned")

    exit_record = EmployeeExit(
        employee_id=data.employee_id,
        resignation_date=data.resignation_date,
        last_working_day=data.last_working_day,
        reason=data.reason,
        notice_period=data.notice_period or "30",
        exit_interview_date=data.exit_interview_date,
        handover_status=data.handover_status or "Pending",
        asset_return_status=data.asset_return_status or "Pending",
        final_settlement=data.final_settlement or "Pending",
        clearance_status=data.clearance_status or "Pending",
        notes=data.notes
    )

    db.add(exit_record)
    db.commit()
    db.refresh(exit_record)

    return exit_record


# -------------------------------------------------------------------------
# 2. GET EXIT DETAILS
# -------------------------------------------------------------------------
@router.get("/{employee_id}", response_model=ExitOut)
def get_exit(employee_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    exit_data = db.query(EmployeeExit).filter(EmployeeExit.employee_id == employee_id).first()
    if not exit_data:
        raise HTTPException(404, "No exit data found")

    return exit_data


# -------------------------------------------------------------------------
# 3. UPDATE EXIT DETAILS
# -------------------------------------------------------------------------
@router.put("/{employee_id}", response_model=ExitOut)
def update_exit(employee_id: int, data: ExitCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    exit_data = db.query(EmployeeExit).filter(EmployeeExit.employee_id == employee_id).first()
    if not exit_data:
        raise HTTPException(404, "Exit record not found")

    setattr(exit_data, 'resignation_date', data.resignation_date)
    setattr(exit_data, 'last_working_day', data.last_working_day)
    setattr(exit_data, 'reason', data.reason)
    setattr(exit_data, 'notice_period', data.notice_period)
    setattr(exit_data, 'exit_interview_date', data.exit_interview_date)
    setattr(exit_data, 'handover_status', data.handover_status)
    setattr(exit_data, 'asset_return_status', data.asset_return_status)
    setattr(exit_data, 'final_settlement', data.final_settlement)
    setattr(exit_data, 'clearance_status', data.clearance_status)
    setattr(exit_data, 'notes', data.notes)

    # Update employee status based on clearance
    emp = db.query(User).filter(User.id == employee_id).first()
    if emp:
        if data.clearance_status == "Completed":
            setattr(emp, 'status', "Inactive")
        else:
            setattr(emp, 'status', "Resigned")

    db.commit()
    db.refresh(exit_data)

    return exit_data


# -------------------------------------------------------------------------
# 4. CHANGE CLEARANCE STATUS ONLY
# -------------------------------------------------------------------------
@router.post("/clearance/{employee_id}")
def update_clearance(employee_id: int, status: str, user=Depends(get_current_user)):
    db = get_tenant_session(user)

    exit_data = db.query(EmployeeExit).filter(EmployeeExit.employee_id == employee_id).first()
    if not exit_data:
        raise HTTPException(404, "Exit record not found")

    setattr(exit_data, 'clearance_status', status)

    emp = db.query(User).filter(User.id == employee_id).first()
    if emp:
        setattr(emp, 'status', "Inactive" if status == "Completed" else "Resigned")

    db.commit()

    return {"message": f"Clearance updated to {status}"}
