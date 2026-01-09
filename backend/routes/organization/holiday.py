from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from database import get_master_db, get_tenant_engine, logger
from utils.audit_logger import audit_crud

from models.models_master import Hospital
from models.models_tenant import Holiday
from schemas.schemas_tenant import HolidayCreate, HolidayOut
from utils.permission import require_permission
from typing import List

router = APIRouter(prefix="/holidays", tags=["Holiday Calendar"])

def get_tenant_session(user):
    tenant_db = user.get("tenant_db")
    master_db = next(get_master_db())
    hospital = master_db.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(404, "Hospital not found")
    engine = get_tenant_engine(str(hospital.db_name))
    return Session(bind=engine)

# ---------------- CREATE ----------------
@router.post("/create", response_model=HolidayOut)
def create_holiday(data: HolidayCreate, request: Request, user = Depends(require_permission("add_holiday"))):
    db = get_tenant_session(user)
    try:
        logger.info(f"[HOLIDAY CREATE] User:{user.get('email')} - {data.name}")

        # Duplicate same day check
        exists = db.query(Holiday).filter(Holiday.date == data.date).first()
        if exists:
            logger.warning("Holiday already exists for this date")
            raise HTTPException(status_code=400, detail="Holiday already exists for this date")

        holiday = Holiday(**data.dict())
        db.add(holiday)
        db.commit()
        db.refresh(holiday)
        
        # Create response dict to avoid DetachedInstanceError
        response_data = {
            "id": holiday.id,
            "name": holiday.name,
            "date": holiday.date,
            "type": holiday.type,
            "description": holiday.description,
            "repeat_yearly": holiday.repeat_yearly,
            "status": holiday.status
        }
        
        audit_crud(request, db, user, "CREATE_HOLIDAY", "holidays", str(holiday.id), {}, {"name": data.name, "date": str(data.date), "type": data.type})
        return response_data
    finally:
        db.close()

# ---------------- LIST ----------------
@router.get("/list", response_model=List[HolidayOut])
def list_holidays(user = Depends(require_permission("view_holiday"))):
    db = get_tenant_session(user)
    try:
        logger.info(f"[HOLIDAY LIST] User:{user.get('email')}")
        holidays = db.query(Holiday).order_by(Holiday.date.asc()).all()
        return [{
            "id": h.id,
            "name": h.name,
            "date": h.date,
            "type": h.type,
            "description": h.description,
            "repeat_yearly": h.repeat_yearly,
            "status": h.status
        } for h in holidays]
    finally:
        db.close()

# ---------------- DELETE ----------------
@router.delete("/delete/{id}")
def delete_holiday(id: int, request: Request, user = Depends(require_permission("delete_holiday"))):
    db = get_tenant_session(user)
    try:
        logger.info(f"[HOLIDAY DELETE] ID:{id} User:{user.get('email')}")

        holiday = db.query(Holiday).filter(Holiday.id == id).first()
        if not holiday:
            raise HTTPException(status_code=404, detail="Holiday not found")

        # Store values before deletion
        name = holiday.name
        date = holiday.date
        type_val = holiday.type
        
        db.delete(holiday)
        db.commit()
        audit_crud(request, db, user, "DELETE_HOLIDAY", "holidays", str(id), {"name": name, "date": str(date), "type": type_val}, {})
        return {"message": "Holiday deleted successfully"}
    finally:
        db.close()

# ---------------- UPDATE (For Edit Later) ----------------
@router.put("/update/{id}", response_model=HolidayOut)
def update_holiday(id: int, data: HolidayCreate, request: Request, user = Depends(require_permission("edit_holiday"))):
    db = get_tenant_session(user)
    try:
        logger.info(f"[HOLIDAY UPDATE] ID:{id} User:{user.get('email')}")

        holiday = db.query(Holiday).filter(Holiday.id == id).first()
        if not holiday:
            raise HTTPException(status_code=404, detail="Holiday not found")

        # Store old values
        old_name = holiday.name
        old_date = holiday.date
        old_type = holiday.type
        
        for key, value in data.dict().items():
            setattr(holiday, key, value)

        db.commit()
        db.refresh(holiday)
        
        # Create response dict
        response_data = {
            "id": holiday.id,
            "name": holiday.name,
            "date": holiday.date,
            "type": holiday.type,
            "description": holiday.description,
            "repeat_yearly": holiday.repeat_yearly,
            "status": holiday.status
        }
        
        audit_crud(request, db, user, "UPDATE_HOLIDAY", "holidays", str(id), {"name": old_name, "date": str(old_date), "type": old_type}, {"name": data.name, "date": str(data.date), "type": data.type})
        return response_data
    finally:
        db.close()
