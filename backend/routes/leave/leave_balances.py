from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud

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
def create_balance(data: LeaveBalanceCreate, request: Request, db: Session = Depends(get_tenant_db)):
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
    audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "leave_balances", balance.id, None, balance.__dict__)
    return balance


@router.get("/{employee_id}", response_model=list[LeaveBalanceOut])
def get_employee_balances(employee_id: int, db: Session = Depends(get_tenant_db)):
    return db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id
    ).all()
