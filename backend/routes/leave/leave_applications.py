from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from datetime import datetime, date
from utils.audit_logger import audit_crud

from models.models_tenant import LeaveApplication, LeavePolicy, LeaveType, LeaveBalance, User
from schemas.schemas_tenant import (
    LeaveApply,
    LeaveApplicationUpdate,
    LeaveApproval,
    LeaveApplicationOut
)

router = APIRouter(
    prefix="/leave/applications",
    tags=["Leave - Applications & Approvals"]
)

@router.post("/", response_model=LeaveApplicationOut)
def apply_leave(
    data: LeaveApply,
    request: Request,
    employee_id: int = Query(...),
    db: Session = Depends(get_tenant_db)
):
    try:
        print(f"DEBUG: Received data: {data.dict()}")
        print(f"DEBUG: Employee ID: {employee_id}")
        
        # Get employee details
        employee = db.query(User).filter(User.id == employee_id).first()  # type: ignore
        if not employee:
            raise HTTPException(status_code=400, detail="Employee not found")
        
        # Get leave type
        leave_type = db.query(LeaveType).filter(LeaveType.id == data.leave_type_id).first()  # type: ignore
        if not leave_type:
            raise HTTPException(status_code=404, detail="Leave type not found")
        
        # Get leave policy - prioritize form selection, then employee assignment, then active policy
        leave_policy = None
        if data.policy_id:
            leave_policy = db.query(LeavePolicy).filter(LeavePolicy.id == data.policy_id).first()  # type: ignore
        elif employee.leave_policy_id is not None:
            leave_policy = db.query(LeavePolicy).filter(LeavePolicy.id == employee.leave_policy_id).first()  # type: ignore
        else:
            leave_policy = db.query(LeavePolicy).filter(LeavePolicy.status == "Active").first()  # type: ignore
        
        # If no leave policy is found, raise an error
        if not leave_policy:
            raise HTTPException(
                status_code=400,
                detail="No leave policy found. Please select a policy or assign one to the employee."
            )
        
        # Check leave balance based on leave type
        leave_balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type_id == data.leave_type_id
        ).first()  # type: ignore
        
        # Validate leave application against policy
        if leave_balance is not None:
            if leave_balance.balance < data.total_days:  # type: ignore
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient leave balance. Available: {leave_balance.balance} days"
                )
        
        # Check annual limits based on leave type and policy
        current_year = datetime.now().year
        year_start = date(current_year, 1, 1)
        year_end = date(current_year, 12, 31)
        
        used_leaves = db.query(LeaveApplication).filter(
            LeaveApplication.employee_id == employee_id,
            LeaveApplication.leave_type_id == data.leave_type_id,
            LeaveApplication.from_date >= year_start,
            LeaveApplication.to_date <= year_end,
            LeaveApplication.status == "Approved"  # type: ignore
        ).all()
        
        total_used = sum(app.total_days for app in used_leaves)
        
        # Get policy limit based on leave type
        policy_limit = 0
        if leave_type.code.upper() in ['AL', 'ANNUAL']:
            policy_limit = leave_policy.annual
        elif leave_type.code.upper() in ['SL', 'SICK']:
            policy_limit = leave_policy.sick
        elif leave_type.code.upper() in ['CL', 'CASUAL']:
            policy_limit = leave_policy.casual
        elif leave_policy.leave_allocations is not None and leave_type.code.upper() in leave_policy.leave_allocations:
            policy_limit = leave_policy.leave_allocations[leave_type.code.upper()]
        else:
            policy_limit = leave_type.annual_limit
        
        if total_used + data.total_days > policy_limit:  # type: ignore
            raise HTTPException(
                status_code=400,
                detail=f"Exceeds annual limit of {policy_limit} days for {leave_type.name}"
            )
        
        # Create leave application
        leave_data = data.dict()
        print(f"DEBUG: Creating leave with data: {leave_data}")
        
        leave = LeaveApplication(
            employee_id=employee_id,
            **leave_data
        )
        db.add(leave)
        
        # Update leave balance if exists
        if leave_balance is not None:
            leave_balance.used += data.total_days  # type: ignore
            leave_balance.balance -= data.total_days  # type: ignore
        
        db.commit()
        db.refresh(leave)
        
        # Audit log
        audit_crud(request, "nutryah", {"id": employee_id}, "CREATE_LEAVE_APPLICATION", "leave_applications", str(leave.id), None, leave_data)
        
        return leave
    
    except Exception as e:
        print(f"DEBUG: Error in apply_leave: {str(e)}")
        print(f"DEBUG: Error type: {type(e)}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[LeaveApplicationOut])
def list_leave_applications(db: Session = Depends(get_tenant_db)):
    return db.query(LeaveApplication).all()


@router.put("/{leave_id}", response_model=LeaveApplicationOut)
def update_leave_application(
    leave_id: int,
    data: LeaveApplicationUpdate,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()  # type: ignore
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
    
    # Store old values for audit
    old_values = {"status": leave.status, "from_date": str(leave.from_date), "to_date": str(leave.to_date)}
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(leave, key, value)

    db.commit()
    db.refresh(leave)
    
    # Audit log
    audit_crud(request, "nutryah", {"id": 1}, "UPDATE_LEAVE_APPLICATION", "leave_applications", str(leave_id), old_values, data.dict(exclude_unset=True))
    
    return leave


@router.post("/{leave_id}/approve", response_model=LeaveApplicationOut)
def approve_or_reject_leave(
    leave_id: int,
    data: LeaveApproval,
    request: Request,
    approver_id: int = Query(...),
    db: Session = Depends(get_tenant_db)
):
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()  # type: ignore
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
    
    old_status = leave.status
    leave.status = data.status  # type: ignore
    leave.approver_id = approver_id  # type: ignore
    leave.approver_comment = data.approver_comment  # type: ignore

    # Auto leave deduction when approved
    if data.status == "Approved" and old_status != "Approved":
        auto_deduct_leave(db, leave.employee_id, leave.leave_type_id, leave.total_days)
    
    # Restore balance if rejecting approved leave
    elif data.status == "Rejected" and old_status == "Approved":
        auto_restore_leave(db, leave.employee_id, leave.leave_type_id, leave.total_days)

    db.commit()
    db.refresh(leave)
    
    # Audit log
    audit_crud(request, "nutryah", {"id": approver_id}, "APPROVE_LEAVE_APPLICATION", "leave_applications", str(leave_id), {"old_status": old_status}, {"status": data.status, "approver_comment": data.approver_comment})
    
    return leave

@router.post("/initialize-balances/{employee_id}")
def initialize_leave_balances(
    employee_id: int,
    db: Session = Depends(get_tenant_db)
):
    """Initialize leave balances for an employee based on active leave policy"""
    employee = db.query(User).filter(User.id == employee_id).first()  # type: ignore
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get employee's assigned leave policy or fallback to active policy
    leave_policy = None
    if employee.leave_policy_id is not None:
        leave_policy = db.query(LeavePolicy).filter(LeavePolicy.id == employee.leave_policy_id).first()  # type: ignore
    if not leave_policy:
        leave_policy = db.query(LeavePolicy).filter(LeavePolicy.status == "Active").first()  # type: ignore
    if not leave_policy:
        raise HTTPException(status_code=404, detail="No leave policy assigned or active")
    
    leave_types = db.query(LeaveType).filter(LeaveType.status == "Active").all()  # type: ignore
    balances_created = []
    
    for leave_type in leave_types:
        existing_balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type_id == leave_type.id
        ).first()  # type: ignore
        
        if not existing_balance:
            allocation = 0
            # Only create balance if leave type is defined in policy
            if leave_type.code.upper() in ['AL', 'ANNUAL'] and hasattr(leave_policy, 'annual') and leave_policy.annual > 0:  # type: ignore
                allocation = leave_policy.annual
            elif leave_type.code.upper() in ['SL', 'SICK'] and hasattr(leave_policy, 'sick') and leave_policy.sick > 0:  # type: ignore
                allocation = leave_policy.sick
            elif leave_type.code.upper() in ['CL', 'CASUAL'] and hasattr(leave_policy, 'casual') and leave_policy.casual > 0:  # type: ignore
                allocation = leave_policy.casual
            elif leave_policy.leave_allocations is not None and leave_type.code.upper() in leave_policy.leave_allocations:
                allocation = leave_policy.leave_allocations[leave_type.code.upper()]
            else:
                # Skip this leave type if not defined in policy
                continue
            
            current_year = datetime.now().year
            year_start = date(current_year, 1, 1)
            year_end = date(current_year, 12, 31)
            
            used_leaves = db.query(LeaveApplication).filter(
                LeaveApplication.employee_id == employee_id,
                LeaveApplication.leave_type_id == leave_type.id,
                LeaveApplication.from_date >= year_start,
                LeaveApplication.to_date <= year_end,
                LeaveApplication.status == "Approved"  # type: ignore
            ).all()
            
            total_used = sum(app.total_days for app in used_leaves)
            
            # Handle negative balance (overused leaves)
            if total_used > allocation:
                remaining_balance = 0
                overused_days = total_used - allocation
                status_note = f"Overused by {overused_days} days"
            else:
                remaining_balance = allocation - total_used
                status_note = "Normal"
            
            leave_balance = LeaveBalance(
                employee_id=employee_id,
                leave_type_id=leave_type.id,
                total_allocated=allocation,
                used=total_used,
                balance=remaining_balance
            )
            db.add(leave_balance)
            balances_created.append({
                "leave_type": leave_type.name,
                "allocated": allocation,
                "used": total_used,
                "balance": remaining_balance,
                "status": status_note
            })
    
    db.commit()
    return {
        "message": f"Leave balances initialized for {employee.name}",
        "balances_created": balances_created
    }


@router.get("/balances/{employee_id}")
def get_leave_balances(
    employee_id: int,
    db: Session = Depends(get_tenant_db)
):
    """Get all leave balances for an employee regardless of policy"""
    employee = db.query(User).filter(User.id == employee_id).first()  # type: ignore
    if not employee:
        return []
    
    # Get all balances for the employee without policy filtering
    balances = db.query(LeaveBalance, LeaveType).join(
        LeaveType, LeaveBalance.leave_type_id == LeaveType.id
    ).filter(LeaveBalance.employee_id == employee_id).all()  # type: ignore
    
    result = []
    for balance, leave_type in balances:
        is_overused = bool(balance.used > balance.total_allocated)
        overused_days = max(0, balance.used - balance.total_allocated)
        
        result.append({
            "leave_type_id": leave_type.id,
            "leave_type_name": leave_type.name,
            "leave_type_code": leave_type.code,
            "total_allocated": balance.total_allocated,
            "used": balance.used,
            "balance": balance.balance,
            "is_overused": is_overused,
            "overused_days": overused_days,
            "status": "Overused" if is_overused else "Normal"
        })
    
    return result

def auto_deduct_leave(db: Session, employee_id: int, leave_type_id: int, days: float):
    """Auto deduct leave days from employee balance"""
    leave_balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id,
        LeaveBalance.leave_type_id == leave_type_id
    ).first()  # type: ignore
    
    if leave_balance:
        leave_balance.used += days  # type: ignore
        leave_balance.balance -= days  # type: ignore

def auto_restore_leave(db: Session, employee_id: int, leave_type_id: int, days: float):
    """Auto restore leave days to employee balance"""
    leave_balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id,
        LeaveBalance.leave_type_id == leave_type_id
    ).first()  # type: ignore
    
    if leave_balance:
        leave_balance.used -= days  # type: ignore
        leave_balance.balance += days  # type: ignore

@router.get("/policies")
def get_available_policies(db: Session = Depends(get_tenant_db)):
    """Get all available leave policies for dropdown selection"""
    policies = db.query(LeavePolicy).filter(LeavePolicy.status == "Active").all()  # type: ignore
    return [{"id": p.id, "name": p.name} for p in policies]