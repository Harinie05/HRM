from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud
from utils.permission import require_permission
from routes.hospital import get_current_user

from models.models_tenant import AttendanceRegularization, AttendancePunch, PayrollRun, User
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

@router.get("/current-user")
def get_current_user_info(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("view_regularization"))
):
    """Get current user's employee information"""
    current_user_id = user.get('user_id')
    if not current_user_id:
        raise HTTPException(status_code=400, detail="User ID not found")
    
    user_info = db.query(User).filter(User.id == current_user_id).first()
    if not user_info:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user_info.id,
        "name": user_info.name,
        "employee_code": user_info.employee_code or f"EMP{user_info.id}"
    }

@router.post("/", response_model=AttendanceRegularizationOut)
def create_regularization(
    data: AttendanceRegularizationCreate,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("apply_regularization"))
):
    # Check if user has view_self permission and restrict to own records
    user_permissions = user.get('permissions', [])
    if 'view_self' in user_permissions:
        current_user_id = user.get('user_id')
        if current_user_id and data.employee_id != current_user_id:
            raise HTTPException(status_code=403, detail="You can only create regularization requests for yourself")
    
    req = AttendanceRegularization(**data.dict())
    db.add(req)
    db.commit()
    db.refresh(req)
    audit_crud(request, db, user, "CREATE_REGULARIZATION", "attendance_regularizations", str(req.id), {}, req.__dict__)
    return req

@router.get("/", response_model=list[AttendanceRegularizationOut])
def list_regularizations(
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("view_regularization"))
):
    query = db.query(AttendanceRegularization)
    
    # Check if user has view_self permission (can only view own records)
    user_permissions = user.get('permissions', [])
    if 'view_self' in user_permissions:
        # User can only view their own records
        current_user_id = user.get('user_id')
        if current_user_id:
            query = query.filter(AttendanceRegularization.employee_id == current_user_id)
    
    return query.all()

@router.patch("/{reg_id}/approve", response_model=AttendanceRegularizationOut)
def approve_regularization(
    reg_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("approve_regularization"))
):
    req = db.query(AttendanceRegularization).filter_by(id=reg_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Regularization not found")

    setattr(req, 'status', "Approved")
    
    # Auto sync to payroll when approved
    sync_attendance_to_payroll(db, getattr(req, 'employee_id'), getattr(req, 'punch_date'))
    
    db.commit()
    db.refresh(req)
    audit_crud(request, db, user, "APPROVE_REGULARIZATION", "attendance_regularizations", str(reg_id), {"status": "Pending"}, {"status": "Approved"})
    return req

@router.patch("/{reg_id}/reject", response_model=AttendanceRegularizationOut)
def reject_regularization(
    reg_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("reject_regularization"))
):
    req = db.query(AttendanceRegularization).filter_by(id=reg_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Regularization not found")

    setattr(req, 'status', "Rejected")
    db.commit()
    db.refresh(req)
    audit_crud(request, db, user, "REJECT_REGULARIZATION", "attendance_regularizations", str(reg_id), {"status": "Pending"}, {"status": "Rejected"})
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
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("smart_regularization"))
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
        audit_crud(request, db, user, "SYNC_PAYROLL", "payroll_sync", str(employee_id), {}, data)
        
        return {"message": "Payroll sync completed"}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Sync failed: {str(e)}")
