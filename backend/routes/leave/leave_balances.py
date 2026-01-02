from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

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
def get_employee_balances(employee_id: int, db: Session = Depends(get_tenant_db)):
    return db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id
    ).all()


@router.post("/initialize/{employee_id}/{policy_id}")
def initialize_employee_balances(
    employee_id: int, 
    policy_id: int, 
    request: Request, 
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Initialize leave balances for an employee with selected policy"""
    from models.models_tenant import LeaveType
    
    # Delete existing balances
    db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee_id).delete()
    
    leave_types = db.query(LeaveType).filter(LeaveType.status == "Active").all()
    
    for leave_type in leave_types:
        allocated_days = leave_type.annual_limit or 0
        
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
    
    return {"message": f"Leave balances initialized for employee {employee_id}"}
