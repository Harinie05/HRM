from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

from models.models_tenant import AttendancePunch

router = APIRouter(
    prefix="/attendance/reports",
    tags=["Attendance - Reports"]
)


@router.get("/daily")
def daily_report(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    punches = db.query(AttendancePunch).all()
    
    # Audit log
    audit_crud(request, db, user, "VIEW_DAILY_ATTENDANCE_REPORT", "attendance_reports", "daily", {}, {"total_records": len(punches)})
    
    return [{
        "id": p.id,
        "employee_id": p.employee_id,
        "date": p.date.isoformat() if p.date is not None else None,
        "in_time": p.in_time.strftime("%H:%M:%S") if p.in_time is not None else None,
        "out_time": p.out_time.strftime("%H:%M:%S") if p.out_time is not None else None,
        "location": p.location,
        "source": p.source,
        "status": p.status
    } for p in punches]


@router.get("/monthly")
def monthly_summary(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    results = (
        db.query(
            AttendancePunch.employee_id,
            func.count(AttendancePunch.id).label("total_days")
        )
        .group_by(AttendancePunch.employee_id)
        .all()
    )
    
    # Audit log
    audit_crud(request, db, user, "VIEW_MONTHLY_ATTENDANCE_REPORT", "attendance_reports", "monthly", {}, {"total_employees": len(results)})
    
    return [{
        "employee_id": r.employee_id,
        "total_days": r.total_days
    } for r in results]
