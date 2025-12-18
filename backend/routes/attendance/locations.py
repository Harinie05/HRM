from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db

from models.models_tenant import AttendanceLocation
from schemas.schemas_tenant import AttendanceLocationCreate, AttendanceLocationOut

router = APIRouter(
    prefix="/attendance/locations",
    tags=["Attendance - Locations"]
)


@router.post("/", response_model=AttendanceLocationOut)
def create_location(
    data: AttendanceLocationCreate,
    db: Session = Depends(get_tenant_db)
):
    location = AttendanceLocation(**data.dict())
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


@router.get("/", response_model=list[AttendanceLocationOut])
def list_locations(
    db: Session = Depends(get_tenant_db)
):
    return db.query(AttendanceLocation).all()


@router.patch("/{location_id}/toggle", response_model=AttendanceLocationOut)
def toggle_location(
    location_id: int,
    db: Session = Depends(get_tenant_db)
):
    location = db.query(AttendanceLocation).filter_by(id=location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    setattr(location, 'is_active', not location.is_active)
    db.commit()
    db.refresh(location)
    return location


@router.delete("/{location_id}/")
def delete_location(
    location_id: int,
    db: Session = Depends(get_tenant_db)
):
    location = db.query(AttendanceLocation).filter_by(id=location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    db.delete(location)
    db.commit()
    return {"message": "Location deleted"}
