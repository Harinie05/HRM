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
            # Create balance with annual_limit from leave type
            balance = LeaveBalance(
                employee_id=employee.id,
                leave_type_id=leave.id,
                total_allocated=leave.annual_limit or 0,
                used=0,
                balance=leave.annual_limit or 0
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
