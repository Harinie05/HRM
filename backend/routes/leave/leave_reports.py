from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

from models.models_tenant import LeaveApplication

router = APIRouter(
    prefix="/leave/reports",
    tags=["Leave - Reports"]
)

@router.get("/summary")
def leave_summary(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    results = (
        db.query(
            LeaveApplication.employee_id,
            LeaveApplication.status,
            func.count(LeaveApplication.id).label("count")
        )
        .group_by(LeaveApplication.employee_id, LeaveApplication.status)
        .all()
    )
    
    # Audit log
    audit_crud(request, db, user, "VIEW_LEAVE_SUMMARY_REPORT", "leave_reports", "summary", {}, {"total_records": len(results)})
    
    return [
        {
            "employee_id": result.employee_id,
            "status": result.status,
            "count": result.count
        }
        for result in results
    ]
