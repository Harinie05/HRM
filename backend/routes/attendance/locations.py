from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

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
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    location = AttendanceLocation(**data.dict())
    db.add(location)
    db.commit()
    db.refresh(location)
    audit_crud(request, db, user, "CREATE_ATTENDANCE_LOCATION", "attendance_locations", str(location.id), {}, data.dict())
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
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    location = db.query(AttendanceLocation).filter_by(id=location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    old_status = location.is_active
    new_status = not bool(location.is_active) if location.is_active is not None else True
    setattr(location, 'is_active', new_status)
    db.commit()
    db.refresh(location)
    audit_crud(request, db, user, "TOGGLE_ATTENDANCE_LOCATION", "attendance_locations", str(location_id), {"is_active": old_status}, {"is_active": location.is_active})
    return location

@router.delete("/{location_id}/")
def delete_location(
    location_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    location = db.query(AttendanceLocation).filter_by(id=location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    old_values = {"name": location.name, "grace_time": location.grace_time, "is_active": location.is_active}
    db.delete(location)
    db.commit()
    audit_crud(request, db, user, "DELETE_ATTENDANCE_LOCATION", "attendance_locations", str(location_id), old_values, {})
    return {"message": "Location deleted"}
