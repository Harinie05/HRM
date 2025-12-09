from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_master_db, get_tenant_engine, logger

from models.models_master import Hospital
from models.models_tenant import Holiday
from schemas.schemas_tenant import HolidayCreate, HolidayOut
from routes.hospital import get_current_user
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
def create_holiday(data: HolidayCreate, user = Depends(get_current_user)):
    db = get_tenant_session(user)
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
    return holiday


# ---------------- LIST ----------------
@router.get("/list", response_model=List[HolidayOut])
def list_holidays(user = Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[HOLIDAY LIST] User:{user.get('email')}")
    return db.query(Holiday).order_by(Holiday.date.asc()).all()


# ---------------- DELETE ----------------
@router.delete("/delete/{id}")
def delete_holiday(id: int, user = Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[HOLIDAY DELETE] ID:{id} User:{user.get('email')}")

    holiday = db.query(Holiday).filter(Holiday.id == id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    db.delete(holiday)
    db.commit()
    return {"message": "Holiday deleted successfully"}


# ---------------- UPDATE (For Edit Later) ----------------
@router.put("/update/{id}", response_model=HolidayOut)
def update_holiday(id: int, data: HolidayCreate, user = Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[HOLIDAY UPDATE] ID:{id} User:{user.get('email')}")

    holiday = db.query(Holiday).filter(Holiday.id == id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    for key, value in data.dict().items():
        setattr(holiday, key, value)

    db.commit()
    db.refresh(holiday)
    return holiday
