from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import get_tenant_db
from models.models_tenant import DailyWorkUpdate, User
from schemas.schemas_tenant import DailyWorkUpdateCreateFixed as DailyWorkUpdateCreate, DailyWorkUpdateUpdate, DailyWorkUpdateOut
from utils.audit_logger import audit_crud
from utils.permission import require_permission
from routes.hospital import get_current_user
from datetime import date
from typing import List, Optional

router = APIRouter(prefix="/daily-updates", tags=["Daily Updates"])

@router.post("/", response_model=DailyWorkUpdateOut)
def create_or_update_daily_update(
    update_data: DailyWorkUpdateCreate,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("add_daily_update"))
):
    """Create or update daily work update for current user"""
    # Get employee_id from the request data
    employee_id = update_data.employee_id
    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee ID is required")
    
    # Check if update already exists for this date
    existing_update = db.query(DailyWorkUpdate).filter(
        and_(
            DailyWorkUpdate.employee_id == employee_id,
            DailyWorkUpdate.date == update_data.date
        )
    ).first()
    
    if existing_update:
        # Update existing record
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(existing_update, field, value)
        
        db.commit()
        db.refresh(existing_update)
        
        audit_crud(request, db, user, "UPDATE_DAILY_WORK_UPDATE", "daily_work_updates", str(existing_update.id), {}, update_data.dict())
        return existing_update
    else:
        # Create new record
        new_update = DailyWorkUpdate(
            **update_data.dict()
        )
        
        db.add(new_update)
        db.commit()
        db.refresh(new_update)
        
        audit_crud(request, db, user, "CREATE_DAILY_WORK_UPDATE", "daily_work_updates", str(new_update.id), {}, update_data.dict())
        return new_update

@router.get("/my-updates", response_model=List[DailyWorkUpdateOut])
def get_my_daily_updates(
    employee_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    limit: Optional[int] = 30,
    user = Depends(require_permission("view_daily_updates"))
):
    """Get employee's daily updates"""
    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee ID is required")
    
    updates = db.query(DailyWorkUpdate).filter(
        DailyWorkUpdate.employee_id == employee_id
    ).order_by(DailyWorkUpdate.date.desc()).limit(limit).all()
    
    return updates

@router.get("/team-updates", response_model=List[DailyWorkUpdateOut])
def get_team_daily_updates(
    request: Request,
    db: Session = Depends(get_tenant_db),
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user = Depends(require_permission("view_attendance_reports"))
):
    """Get team daily updates (for managers/HR)"""
    
    # Build query
    query = db.query(DailyWorkUpdate)
    
    if employee_id:
        query = query.filter(DailyWorkUpdate.employee_id == employee_id)
    
    if start_date:
        query = query.filter(DailyWorkUpdate.date >= start_date)
    
    if end_date:
        query = query.filter(DailyWorkUpdate.date <= end_date)
    
    updates = query.order_by(DailyWorkUpdate.date.desc()).limit(100).all()
    return updates

@router.get("/{update_id}", response_model=DailyWorkUpdateOut)
def get_daily_update(
    update_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("view_daily_updates"))
):
    """Get specific daily update"""
    
    update = db.query(DailyWorkUpdate).filter(DailyWorkUpdate.id == update_id).first()
    if not update:
        raise HTTPException(status_code=404, detail="Update not found")
    
    return update

@router.put("/{update_id}", response_model=DailyWorkUpdateOut)
def update_daily_update(
    update_id: int,
    update_data: DailyWorkUpdateUpdate,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("edit_daily_update"))
):
    """Update specific daily update"""
    
    update = db.query(DailyWorkUpdate).filter(DailyWorkUpdate.id == update_id).first()
    if not update:
        raise HTTPException(status_code=404, detail="Update not found")
    
    # Check if update is for today (only allow editing same-day updates)
    if update.date != date.today():
        raise HTTPException(status_code=400, detail="Can only edit today's updates")
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(update, field, value)
    
    db.commit()
    db.refresh(update)
    
    audit_crud(request, db, user, "UPDATE_DAILY_WORK_UPDATE", "daily_work_updates", str(update.id), {}, update_data.dict())
    return update