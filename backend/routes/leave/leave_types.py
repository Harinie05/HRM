from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud

from models.models_tenant import LeaveType, User, LeaveBalance
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
def create_leave_type(data: LeaveTypeCreate, request: Request, db: Session = Depends(get_tenant_db)):
    leave = LeaveType(**data.dict())
    db.add(leave)
    db.commit()
    db.refresh(leave)
    audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "leave_types", leave.id, None, leave.__dict__)
    
    # Auto-create balances for all existing employees
    employees = db.query(User).filter(User.status == "Active").all()
    for employee in employees:
        # Check if balance already exists
        existing_balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee.id,
            LeaveBalance.leave_type_id == leave.id
        ).first()
        
        if not existing_balance:
            # For policy-controlled types, get allocation from active policy
            allocated_days = 0
            
            # Check if this leave type is policy-controlled
            policy = db.query(LeavePolicy).filter(LeavePolicy.status == "Active").first()
            if policy:
                # Check standard policy fields
                if leave.code and leave.code.upper() in ['AL', 'ANNUAL']:
                    allocated_days = policy.annual
                elif leave.code and leave.code.upper() in ['SL', 'SICK']:
                    allocated_days = policy.sick
                elif leave.code and leave.code.upper() in ['CL', 'CASUAL']:
                    allocated_days = policy.casual
                # Check dynamic allocations
                elif policy.leave_allocations and leave.code:
                    allocated_days = policy.leave_allocations.get(leave.code.upper(), 0)
            
            # If not policy-controlled, use annual_limit
            if allocated_days == 0:
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
    db: Session = Depends(get_tenant_db)
):
    leave = db.query(LeaveType).filter(LeaveType.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave type not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(leave, key, value)

    db.commit()
    db.refresh(leave)
    audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "leave_types", leave_id, None, leave.__dict__)
    return leave


@router.delete("/{leave_id}")
def delete_leave_type(leave_id: int, request: Request, db: Session = Depends(get_tenant_db)):
    leave = db.query(LeaveType).filter(LeaveType.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave type not found")

    old_values = leave.__dict__.copy()
    db.delete(leave)
    db.commit()
    audit_crud(request, "tenant_db", {"email": "system"}, "DELETE", "leave_types", leave_id, old_values, None)
    return {"message": "Leave type deleted"}


@router.post("/sync-balances")
def sync_leave_type_balances(request: Request, db: Session = Depends(get_tenant_db)):
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
                if leave_type.code and leave_type.code.upper() in ['AL', 'ANNUAL']:
                    allocated_days = policy.annual
                elif leave_type.code and leave_type.code.upper() in ['SL', 'SICK']:
                    allocated_days = policy.sick
                elif leave_type.code and leave_type.code.upper() in ['CL', 'CASUAL']:
                    allocated_days = policy.casual
                elif policy.leave_allocations and leave_type.code:
                    allocated_days = policy.leave_allocations.get(leave_type.code.upper(), 0)
            
            # If not policy-controlled, use annual_limit
            if allocated_days == 0:
                allocated_days = leave_type.annual_limit or 0
            
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
    audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "leave_balances", 0, None, {"action": "sync_all"})
    
    return {"message": f"Synced {updated_count} leave balance records"}
