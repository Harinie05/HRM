from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db

from models.models_tenant import AttendanceRegularization
from schemas.schemas_tenant import (
    AttendanceRegularizationCreate,
    AttendanceRegularizationOut
)

router = APIRouter(
    prefix="/attendance/regularizations",
    tags=["Attendance - Regularization"]
)


@router.post("/", response_model=AttendanceRegularizationOut)
def create_regularization(
    data: AttendanceRegularizationCreate,
    db: Session = Depends(get_tenant_db)
):
    req = AttendanceRegularization(**data.dict())
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/", response_model=list[AttendanceRegularizationOut])
def list_regularizations(
    db: Session = Depends(get_tenant_db)
):
    return db.query(AttendanceRegularization).all()


@router.patch("/{reg_id}/approve", response_model=AttendanceRegularizationOut)
def approve_regularization(
    reg_id: int,
    db: Session = Depends(get_tenant_db)
):
    req = db.query(AttendanceRegularization).filter_by(id=reg_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Regularization not found")

    setattr(req, 'status', "Approved")
    db.commit()
    db.refresh(req)
    return req


@router.patch("/{reg_id}/reject", response_model=AttendanceRegularizationOut)
def reject_regularization(
    reg_id: int,
    db: Session = Depends(get_tenant_db)
):
    req = db.query(AttendanceRegularization).filter_by(id=reg_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Regularization not found")

    setattr(req, 'status', "Rejected")
    db.commit()
    db.refresh(req)
    return req
