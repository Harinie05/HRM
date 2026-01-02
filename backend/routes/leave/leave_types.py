from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

from models.models_tenant import LeaveType, User, LeaveBalance, LeavePolicy
from schemas.schemas_tenant import (
    LeaveTypeCreate,
    LeaveTypeUpdate,
    LeaveTypeOut
)

router = APIRouter(
    prefix="/leave/types",
    tags=["Leave - Types & Policies"]
)

@router.post("/", response_model=LeaveTypeOut)
def create_leave_type(
    data: LeaveTypeCreate, 
    request: Request, 
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    leave = LeaveType(**data.dict())
    db.add(leave)
    db.commit()
    db.refresh(leave)
    audit_crud(request, db, user, "CREATE_LEAVE_TYPE", "leave_types", str(leave.id), {}, data.dict())
    
    # Auto-create balances for all existing employees
    employees = db.query(User).filter(User.status == "Active").all()
    for employee in employees:
        # Check if balance already exists
        existing_balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee.id,
            LeaveBalance.leave_type_id == leave.id
        ).first()
        
        if not existing_balance:
            # Use the leave type's own annual_limit
            allocated_days = leave.annual_limit or 0
            
            balance = LeaveBalance(
                employee_id=employee.id,
                leave_type_id=leave.id,
                total_allocated=allocated_days,
                used=0,
                balance=allocated_days
            )
            db.add(balance)
    
    db.commit()
    return leave


@router.get("/", response_model=list[LeaveTypeOut])
def list_leave_types(db: Session = Depends(get_tenant_db)):
    return db.query(LeaveType).all()


@router.get("/{leave_id}", response_model=LeaveTypeOut)
def get_leave_type(leave_id: int, db: Session = Depends(get_tenant_db)):
    leave = db.query(LeaveType).filter(LeaveType.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave type not found")
    return leave


@router.put("/{leave_id}", response_model=LeaveTypeOut)
def update_leave_type(
    leave_id: int,
    data: LeaveTypeUpdate,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    leave = db.query(LeaveType).filter(LeaveType.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave type not found")

    old_values = {"name": leave.name, "code": leave.code, "status": leave.status}
    for key, value in data.dict(exclude_unset=True).items():
        setattr(leave, key, value)

    db.commit()
    db.refresh(leave)
    audit_crud(request, db, user, "UPDATE_LEAVE_TYPE", "leave_types", str(leave_id), old_values, data.dict(exclude_unset=True))
    return leave


@router.delete("/{leave_id}")
def delete_leave_type(
    leave_id: int, 
    request: Request, 
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    leave = db.query(LeaveType).filter(LeaveType.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave type not found")

    old_values = {"name": leave.name, "code": leave.code, "status": leave.status}
    db.delete(leave)
    db.commit()
    audit_crud(request, db, user, "DELETE_LEAVE_TYPE", "leave_types", str(leave_id), old_values, {})
    return {"message": "Leave type deleted"}


@router.post("/sync-balances")
def sync_leave_type_balances(
    request: Request, 
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Sync all leave balances based on current policy and leave type settings"""
    
    # Get active policy
    policy = db.query(LeavePolicy).filter(LeavePolicy.status == "Active").first()
    
    # Get all active employees and leave types
    employees = db.query(User).filter(User.status == "Active").all()
    leave_types = db.query(LeaveType).filter(LeaveType.status == "Active").all()
    
    updated_count = 0
    
    for employee in employees:
        for leave_type in leave_types:
            # Get or create balance
            balance = db.query(LeaveBalance).filter(
                LeaveBalance.employee_id == employee.id,
                LeaveBalance.leave_type_id == leave_type.id
            ).first()
            
            # Determine allocation
            allocated_days = 0
            
            if policy:
                # Check if policy-controlled
                if hasattr(leave_type, 'code') and leave_type.code is not None and str(leave_type.code).upper() in ['AL', 'ANNUAL']:
                    allocated_days = getattr(policy, 'annual', 0) or 0
                elif hasattr(leave_type, 'code') and leave_type.code is not None and str(leave_type.code).upper() in ['SL', 'SICK']:
                    allocated_days = getattr(policy, 'sick', 0) or 0
                elif hasattr(leave_type, 'code') and leave_type.code is not None and str(leave_type.code).upper() in ['CL', 'CASUAL']:
                    allocated_days = getattr(policy, 'casual', 0) or 0
                elif hasattr(policy, 'leave_allocations') and policy.leave_allocations is not None and hasattr(leave_type, 'code') and leave_type.code is not None and str(leave_type.code).upper() in policy.leave_allocations:
                    allocated_days = policy.leave_allocations[str(leave_type.code).upper()] or 0
            
            # If not policy-controlled, don't allocate from policy
            if allocated_days == 0:
                allocated_days = 0  # Other leave types get 0 from policy
            
            if balance:
                balance.total_allocated = allocated_days
                balance.balance = allocated_days - balance.used
            else:
                balance = LeaveBalance(
                    employee_id=employee.id,
                    leave_type_id=leave_type.id,
                    total_allocated=allocated_days,
                    used=0,
                    balance=allocated_days
                )
                db.add(balance)
            
            updated_count += 1
    
    db.commit()
    audit_crud(request, db, user, "SYNC_LEAVE_BALANCES", "leave_balances", "bulk", {}, {"updated_count": updated_count})
    
    return {"message": f"Synced {updated_count} leave balance records"}
