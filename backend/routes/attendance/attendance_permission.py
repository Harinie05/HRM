from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.permission import require_permission
from utils.audit_logger import audit_crud

from models.models_tenant import AttendancePermissionRequest
from schemas.schemas_tenant import (
    AttendancePermissionCreate,
    AttendancePermissionOut
)

router = APIRouter(
    prefix="/attendance/permissions",
    tags=["Attendance - Permission"]
)


@router.post("/", response_model=AttendancePermissionOut)
def create_permission(
    data: AttendancePermissionCreate,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user=Depends(require_permission("apply_attendance_permission"))
):
    if "view_self" in user.get("permissions", []):
        if data.employee_id != user.get("user_id"):
            raise HTTPException(403, "You can apply only for yourself")

    req = AttendancePermissionRequest(**data.dict())
    db.add(req)
    db.commit()
    db.refresh(req)

    audit_crud(
        request, db, user,
        "CREATE_ATTENDANCE_PERMISSION",
        "attendance_permission_requests",
        str(req.id), {}, req.__dict__
    )

    return req


@router.get("/", response_model=list[AttendancePermissionOut])
def list_permissions(
    db: Session = Depends(get_tenant_db),
    user=Depends(require_permission("view_attendance_permission"))
):
    query = db.query(AttendancePermissionRequest)

    if "view_self" in user.get("permissions", []):
        query = query.filter(
            AttendancePermissionRequest.employee_id == user.get("user_id")
        )

    return query.order_by(
        AttendancePermissionRequest.date.desc()
    ).all()


@router.patch("/{req_id}/approve", response_model=AttendancePermissionOut)
def approve_permission(
    req_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user=Depends(require_permission("approve_attendance_permission"))
):
    req = db.query(AttendancePermissionRequest).filter_by(id=req_id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    req.status = "Approved"
    db.commit()
    db.refresh(req)

    audit_crud(
        request, db, user,
        "APPROVE_ATTENDANCE_PERMISSION",
        "attendance_permission_requests",
        str(req_id),
        {"status": "Pending"},
        {"status": "Approved"}
    )

    return req


@router.patch("/{req_id}/reject", response_model=AttendancePermissionOut)
def reject_permission(
    req_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user=Depends(require_permission("reject_attendance_permission"))
):
    req = db.query(AttendancePermissionRequest).filter_by(id=req_id).first()
    if not req:
        raise HTTPException(404, "Request not found")

    req.status = "Rejected"
    db.commit()
    db.refresh(req)

    audit_crud(
        request, db, user,
        "REJECT_ATTENDANCE_PERMISSION",
        "attendance_permission_requests",
        str(req_id),
        {"status": "Pending"},
        {"status": "Rejected"}
    )

    return req
