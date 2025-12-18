from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_tenant_db

from models.models_tenant import AttendancePunch

router = APIRouter(
    prefix="/attendance/reports",
    tags=["Attendance - Reports"]
)


@router.get("/daily")
def daily_report(
    db: Session = Depends(get_tenant_db)
):
    punches = db.query(AttendancePunch).all()
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
    db: Session = Depends(get_tenant_db)
):
    results = (
        db.query(
            AttendancePunch.employee_id,
            func.count(AttendancePunch.id).label("total_days")
        )
        .group_by(AttendancePunch.employee_id)
        .all()
    )
    return [{
        "employee_id": r.employee_id,
        "total_days": r.total_days
    } for r in results]
