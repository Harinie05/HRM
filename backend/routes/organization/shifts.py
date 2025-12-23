from fastapi import APIRouter, Header, HTTPException, Depends, Request
from sqlalchemy.orm import Session

from database import get_tenant_engine, logger
from utils.audit_logger import audit_crud
from models.models_tenant import Shift
from schemas.schemas_tenant import ShiftCreate, ShiftResponse

# 🔐 added for login protection
from routes.hospital import get_current_user

router = APIRouter(prefix="/shifts", tags=["Shifts"])


# ------------------------------
# CREATE SHIFT 🔒 Protected
# ------------------------------
@router.post("/{tenant}/create", response_model=ShiftResponse)
def create_shift(
    tenant: str,
    payload: ShiftCreate,
    request: Request,
    user = Depends(get_current_user)  # 🔐 Token required
):
    try:
        logger.info(f"Creating shift '{payload.name}' for tenant {tenant} by user {user.get('email')}")
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)

        new_shift = Shift(
            name=payload.name,
            start_time=payload.start_time,
            end_time=payload.end_time
        )

        db.add(new_shift)
        db.commit()
        db.refresh(new_shift)
        audit_crud(request, user.get("tenant_db"), user, "CREATE", "shifts", new_shift.id, None, new_shift.__dict__)
        logger.info(f"Shift '{payload.name}' created successfully with ID {new_shift.id}")
        return new_shift

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------
# LIST SHIFTS 🔒 Protected
# ------------------------------
@router.get("/{tenant}/list")
def list_shifts(
    tenant: str,
    user = Depends(get_current_user)  # 🔐 Token required
):
    try:
        logger.info(f"Listing shifts for tenant {tenant} by user {user.get('email')}")
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)

        shifts = db.query(Shift).all()
        return {"shifts": shifts}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------
# DELETE SHIFT 🔒 Protected
# ------------------------------
@router.delete("/{tenant}/{shift_id}")
def delete_shift(
    tenant: str,
    shift_id: int,
    request: Request,
    user = Depends(get_current_user)  # 🔐 Token required
):
    try:
        logger.info(f"Deleting shift {shift_id} for tenant {tenant} by user {user.get('email')}")
        engine = get_tenant_engine(tenant)
        db = Session(bind=engine)

        shift = db.query(Shift).filter(Shift.id == shift_id).first()
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")

        old_values = shift.__dict__.copy()
        db.delete(shift)
        db.commit()
        audit_crud(request, user.get("tenant_db"), user, "DELETE", "shifts", shift_id, old_values, None)
        logger.info(f"Shift {shift_id} deleted successfully")
        return {"message": "Shift deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
