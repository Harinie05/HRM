from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user
from utils.permission import require_permission

from models.models_tenant import LeaveBalance
from schemas.schemas_tenant import (
    LeaveBalanceCreate,
    LeaveBalanceUpdate,
    LeaveBalanceOut
)

router = APIRouter(
    prefix="/leave/balances",
    tags=["Leave - Balances"]
)

@router.post("/", response_model=LeaveBalanceOut)
def create_balance(
    data: LeaveBalanceCreate, 
    request: Request, 
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    balance = LeaveBalance(
        employee_id=data.employee_id,
        leave_type_id=data.leave_type_id,
        total_allocated=data.total_allocated,
        used=0,
        balance=data.total_allocated
    )
    db.add(balance)
    db.commit()
    db.refresh(balance)
    audit_crud(request, db, user, "CREATE_LEAVE_BALANCE", "leave_balances", str(balance.id), {}, data.dict())
    return balance

@router.get("/{employee_id}", response_model=list[LeaveBalanceOut])
def get_employee_balances(
    employee_id: int, 
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("view_leave_balance"))
):
    return db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id
    ).all()

@router.post("/initialize/{employee_id}/{policy_id}")
def initialize_employee_balances(
    employee_id: int, 
    policy_id: str, 
    request: Request, 
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Initialize leave balances for an employee with selected policy"""
    from models.models_tenant import LeaveType, LeavePolicy
    
    # Handle "undefined" from frontend
    actual_policy_id = None
    if policy_id != "undefined":
        try:
            actual_policy_id = int(policy_id)
        except ValueError:
            pass
    
    # Delete existing balances
    db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee_id).delete()
    
    # Get policy if valid ID provided, otherwise get any active policy
    policy = None
    if actual_policy_id:
        policy = db.query(LeavePolicy).filter(LeavePolicy.id == actual_policy_id).first()
    else:
        policy = db.query(LeavePolicy).filter(LeavePolicy.status == "Active").first()
    
    leave_types = db.query(LeaveType).filter(LeaveType.status == "Active").all()
    
    for leave_type in leave_types:
        allocated_days = 0
        
        # Use policy allocation if available
        if policy is not None and hasattr(leave_type, 'code') and leave_type.code is not None:
            code = str(leave_type.code).upper()
            if code == 'AL':
                allocated_days = getattr(policy, 'annual', 0) or 0
            elif code == 'SL':
                allocated_days = getattr(policy, 'sick', 0) or 0
            elif code == 'CL':
                allocated_days = getattr(policy, 'casual', 0) or 0
        
        # Fallback to leave type's annual_limit
        if allocated_days == 0:
            allocated_days = getattr(leave_type, 'annual_limit', 0) or 0
        
        balance = LeaveBalance(
            employee_id=employee_id,
            leave_type_id=leave_type.id,
            total_allocated=allocated_days,
            used=0,
            balance=allocated_days
        )
        db.add(balance)
    
    db.commit()
    audit_crud(request, db, user, "INITIALIZE_LEAVE_BALANCES", "leave_balances", str(employee_id), {}, {"policy_id": policy_id})
    
    return {"message": f"Leave balances initialized successfully for employee {employee_id}"}
