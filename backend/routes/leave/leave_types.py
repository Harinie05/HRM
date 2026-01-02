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

# ======================= LEAVE POLICIES =======================

@router.post("/policies/create")
def create_leave_policy(
    payload: dict,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Create a new leave policy"""
    try:
        policy = LeavePolicy(
            name=payload.get("name", "Default Policy"),
            annual=payload.get("annual", 0),
            sick=payload.get("sick", 0),
            casual=payload.get("casual", 0),
            carry_forward=payload.get("carry_forward", False),
            max_carry=payload.get("max_carry", 0),
            encashment=payload.get("encashment", False),
            rule=payload.get("rule", ""),
            status="Active"
        )
        
        db.add(policy)
        db.commit()
        db.refresh(policy)
        
        audit_crud(request, db, user, "CREATE", "leave_policies", str(policy.id), {}, payload)
        
        return {
            "message": "Leave policy created successfully",
            "id": policy.id,
            "name": policy.name
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Create a separate router for policies with the expected prefix
policies_router = APIRouter(
    prefix="/policies/leave",
    tags=["Leave Policies"]
)

@policies_router.post("/create")
def create_leave_policy_alt(
    payload: dict,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Create a new leave policy - alternative route"""
    return create_leave_policy(payload, request, db, user)

@policies_router.get("/")
def list_leave_policies_alt(db: Session = Depends(get_tenant_db)):
    """Get all leave policies - alternative route"""
    policies = db.query(LeavePolicy).all()
    return [{
        "id": p.id,
        "name": p.name,
        "annual": p.annual,
        "sick": p.sick,
        "casual": p.casual,
        "carry_forward": p.carry_forward,
        "max_carry": p.max_carry,
        "encashment": p.encashment,
        "status": p.status,
        "created_at": p.created_at.isoformat() if p.created_at is not None else None
    } for p in policies]

@policies_router.get("/list")
def list_leave_policies_list(db: Session = Depends(get_tenant_db)):
    """Get all leave policies - /list endpoint"""
    policies = db.query(LeavePolicy).all()
    return [{
        "id": p.id,
        "name": p.name,
        "annual": p.annual,
        "sick": p.sick,
        "casual": p.casual,
        "carry_forward": p.carry_forward,
        "max_carry": p.max_carry,
        "encashment": p.encashment,
        "status": p.status,
        "created_at": p.created_at.isoformat() if p.created_at is not None else None
    } for p in policies]

@policies_router.put("/update/{policy_id}")
def update_leave_policy(
    policy_id: int,
    payload: dict,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Update a leave policy"""
    try:
        policy = db.query(LeavePolicy).filter(LeavePolicy.id == policy_id).first()
        if not policy:
            raise HTTPException(status_code=404, detail="Leave policy not found")
        
        old_values = {
            "name": policy.name,
            "annual": policy.annual,
            "sick": policy.sick,
            "casual": policy.casual
        }
        
        # Update fields
        policy.name = payload.get("name", policy.name)
        policy.annual = payload.get("annual", policy.annual)
        policy.sick = payload.get("sick", policy.sick)
        policy.casual = payload.get("casual", policy.casual)
        policy.carry_forward = payload.get("carry_forward", policy.carry_forward)
        policy.max_carry = payload.get("max_carry", policy.max_carry)
        policy.encashment = payload.get("encashment", policy.encashment)
        policy.rule = payload.get("rule", policy.rule)
        
        db.commit()
        audit_crud(request, db, user, "UPDATE", "leave_policies", str(policy_id), old_values, payload)
        
        return {
            "message": "Leave policy updated successfully",
            "id": policy.id,
            "name": policy.name
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@policies_router.delete("/delete/{policy_id}")
def delete_leave_policy(
    policy_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Delete a leave policy"""
    try:
        policy = db.query(LeavePolicy).filter(LeavePolicy.id == policy_id).first()
        if not policy:
            raise HTTPException(status_code=404, detail="Leave policy not found")
        
        old_values = {
            "name": policy.name,
            "annual": policy.annual,
            "sick": policy.sick,
            "casual": policy.casual
        }
        
        db.delete(policy)
        db.commit()
        audit_crud(request, db, user, "DELETE", "leave_policies", str(policy_id), old_values, {})
        
        return {"message": "Leave policy deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/policies")
def list_leave_policies(db: Session = Depends(get_tenant_db)):
    """Get all leave policies"""
    policies = db.query(LeavePolicy).all()
    return [{
        "id": p.id,
        "name": p.name,
        "annual": p.annual,
        "sick": p.sick,
        "casual": p.casual,
        "carry_forward": p.carry_forward,
        "max_carry": p.max_carry,
        "encashment": p.encashment,
        "status": p.status
    } for p in policies]

# ======================= LEAVE TYPES =======================

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
                # Check if policy-controlled by leave type code
                if hasattr(leave_type, 'code') and leave_type.code is not None:
                    code = str(leave_type.code).upper()
                    if code == 'AL':
                        allocated_days = getattr(policy, 'annual', 0) or 0
                    elif code == 'SL':
                        allocated_days = getattr(policy, 'sick', 0) or 0
                    elif code == 'CL':
                        allocated_days = getattr(policy, 'casual', 0) or 0
            
            # If no policy allocation, use leave type's own annual_limit
            if allocated_days == 0:
                allocated_days = getattr(leave_type, 'annual_limit', 0) or 0
            
            if balance:
                setattr(balance, 'total_allocated', allocated_days)
                setattr(balance, 'balance', allocated_days - balance.used)
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
