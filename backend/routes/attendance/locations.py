from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud

from models.models_tenant import AttendanceLocation
from schemas.schemas_tenant import AttendanceLocationCreate, AttendanceLocationOut

router = APIRouter(
    prefix="/attendance/locations",
    tags=["Attendance - Locations"]
)


@router.post("/", response_model=AttendanceLocationOut)
def create_location(
    data: AttendanceLocationCreate,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    location = AttendanceLocation(**data.dict())
    db.add(location)
    db.commit()
    db.refresh(location)
    audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "attendance_locations", location.id, None, location.__dict__)
    return location


@router.get("/", response_model=list[AttendanceLocationOut])
def list_locations(
    db: Session = Depends(get_tenant_db)
):
    return db.query(AttendanceLocation).all()


@router.patch("/{location_id}/toggle", response_model=AttendanceLocationOut)
def toggle_location(
    location_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    location = db.query(AttendanceLocation).filter_by(id=location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    setattr(location, 'is_active', not location.is_active)
    db.commit()
    db.refresh(location)
    audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "attendance_locations", location_id, None, location.__dict__)
    return location


@router.delete("/{location_id}/")
def delete_location(
    location_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    location = db.query(AttendanceLocation).filter_by(id=location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    old_values = location.__dict__.copy()
    db.delete(location)
    db.commit()
    audit_crud(request, "tenant_db", {"email": "system"}, "DELETE", "attendance_locations", location_id, old_values, None)
    return {"message": "Location deleted"}
