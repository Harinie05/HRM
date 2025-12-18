from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_tenant_db

from models.models_tenant import LeaveApplication

router = APIRouter(
    prefix="/leave/reports",
    tags=["Leave - Reports"]
)

@router.get("/summary")
def leave_summary(db: Session = Depends(get_tenant_db)):
    results = (
        db.query(
            LeaveApplication.employee_id,
            LeaveApplication.status,
            func.count(LeaveApplication.id).label("count")
        )
        .group_by(LeaveApplication.employee_id, LeaveApplication.status)
        .all()
    )
    
    return [
        {
            "employee_id": result.employee_id,
            "status": result.status,
            "count": result.count
        }
        for result in results
    ]
