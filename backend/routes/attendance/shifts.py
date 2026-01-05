from fastapi import APIRouter, HTTPException, Depends, Request, Query
from sqlalchemy.orm import Session
from database import get_tenant_engine
from models.models_tenant import Shift
from utils.audit_logger import audit_crud
from utils.permission import get_current_user, require_permission

router = APIRouter(prefix="/shifts", tags=["Shifts"])

def get_tenant_session(tenant_db: str):
    engine = get_tenant_engine(tenant_db)
    return Session(bind=engine)

@router.get("/{tenant}/list")
def list_shifts(tenant: str, active_only: bool = Query(True), user = Depends(require_permission("VIEW_SHIFTS"))):
    db = get_tenant_session(tenant)
    try:
        query = db.query(Shift)
        if active_only:
            query = query.filter(Shift.is_active == True)
        shifts = query.all()
        return {"shifts": shifts}
    except Exception as e:
        raise HTTPException(500, f"Error fetching shifts: {str(e)}")
    finally:
        db.close()

@router.post("/{tenant}/create")
def create_shift(
    tenant: str, 
    payload: dict, 
    request: Request,
    user = Depends(require_permission("CREATE_SHIFTS"))
):
    db = get_tenant_session(tenant)
    try:
        shift = Shift(
            name=payload.get("name"),
            start_time=payload.get("start_time"),
            end_time=payload.get("end_time"),
            is_active=True
        )
        db.add(shift)
        db.commit()
        db.refresh(shift)
        audit_crud(request, db, user, "CREATE_SHIFT", "shifts", str(shift.id), {}, payload)
        return {"message": "Shift created successfully", "id": shift.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error creating shift: {str(e)}")
    finally:
        db.close()

@router.delete("/{tenant}/{shift_id}")
def delete_shift(
    tenant: str, 
    shift_id: int, 
    request: Request,
    user = Depends(require_permission("DELETE_SHIFTS"))
):
    db = get_tenant_session(tenant)
    try:
        shift = db.query(Shift).filter(Shift.id == shift_id).first()
        if not shift:
            raise HTTPException(404, "Shift not found")
        
        old_values = {"name": shift.name, "start_time": shift.start_time, "end_time": shift.end_time, "is_active": shift.is_active}
        setattr(shift, 'is_active', False)
        db.commit()
        audit_crud(request, db, user, "DELETE_SHIFT", "shifts", str(shift_id), old_values, {"is_active": False})
        return {"message": "Shift deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error deleting shift: {str(e)}")
    finally:
        db.close()