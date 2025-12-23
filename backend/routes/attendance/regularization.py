from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud

from models.models_tenant import AttendanceRegularization, AttendancePunch, PayrollRun
from schemas.schemas_tenant import (
    AttendanceRegularizationCreate,
    AttendanceRegularizationOut
)
from datetime import datetime
from sqlalchemy import func

router = APIRouter(
    prefix="/attendance/regularizations",
    tags=["Attendance - Regularization"]
)


@router.post("/", response_model=AttendanceRegularizationOut)
def create_regularization(
    data: AttendanceRegularizationCreate,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    req = AttendanceRegularization(**data.dict())
    db.add(req)
    db.commit()
    db.refresh(req)
    audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "attendance_regularizations", req.id, None, req.__dict__)
    return req


@router.get("/", response_model=list[AttendanceRegularizationOut])
def list_regularizations(
    db: Session = Depends(get_tenant_db)
):
    return db.query(AttendanceRegularization).all()


@router.patch("/{reg_id}/approve", response_model=AttendanceRegularizationOut)
def approve_regularization(
    reg_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    req = db.query(AttendanceRegularization).filter_by(id=reg_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Regularization not found")

    setattr(req, 'status', "Approved")
    
    # Auto sync to payroll when approved
    sync_attendance_to_payroll(db, req.employee_id, req.punch_date)
    
    db.commit()
    db.refresh(req)
    audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "attendance_regularizations", reg_id, None, {"status": "Approved"})
    return req


@router.patch("/{reg_id}/reject", response_model=AttendanceRegularizationOut)
def reject_regularization(
    reg_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    req = db.query(AttendanceRegularization).filter_by(id=reg_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Regularization not found")

    setattr(req, 'status', "Rejected")
    db.commit()
    db.refresh(req)
    audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "attendance_regularizations", reg_id, None, {"status": "Rejected"})
    return req

def sync_attendance_to_payroll(db: Session, employee_id: int, date):
    """Auto sync attendance data to payroll"""
    month = f"{date.year}-{date.month:02d}"
    
    # Count present days for the month
    present_count = db.query(func.count(AttendancePunch.id)).filter(
        AttendancePunch.employee_id == employee_id,
        func.extract('year', AttendancePunch.date) == date.year,
        func.extract('month', AttendancePunch.date) == date.month,
        AttendancePunch.status.in_(['Present', 'Late'])
    ).scalar()
    
    # Update or create payroll run
    payroll = db.query(PayrollRun).filter(
        PayrollRun.employee_id == employee_id,
        PayrollRun.month == month
    ).first()
    
    if payroll:
        payroll.present_days = present_count
    else:
        payroll = PayrollRun(
            employee_id=employee_id,
            month=month,
            present_days=present_count,
            status="Pending"
        )
        db.add(payroll)

@router.post("/sync-payroll")
def sync_payroll_endpoint(
    data: dict,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    """Manual trigger for attendance-to-payroll sync"""
    try:
        employee_id = data.get('employee_id')
        date_str = data.get('date')
        
        if not employee_id or not date_str:
            raise HTTPException(400, "employee_id and date required")
        
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        sync_attendance_to_payroll(db, employee_id, date_obj)
        db.commit()
        audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "payroll_sync", employee_id, None, data)
        
        return {"message": "Payroll sync completed"}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Sync failed: {str(e)}")
