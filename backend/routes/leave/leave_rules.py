from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

from models.models_tenant import LeaveRule
from schemas.schemas_tenant import (
    LeaveRuleCreate,
    LeaveRuleUpdate,
    LeaveRuleOut
)

router = APIRouter(
    prefix="/leave/rules",
    tags=["Leave - Rules"]
)

@router.post("/", response_model=LeaveRuleOut)
def create_leave_rule(
    data: LeaveRuleCreate, 
    request: Request, 
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    rule = LeaveRule(**data.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    audit_crud(request, db, user, "CREATE_LEAVE_RULE", "leave_rules", str(rule.id), {}, data.dict())
    return rule


@router.get("/", response_model=list[LeaveRuleOut])
def list_leave_rules(db: Session = Depends(get_tenant_db)):
    return db.query(LeaveRule).all()


@router.put("/{rule_id}", response_model=LeaveRuleOut)
def update_leave_rule(
    rule_id: int,
    data: LeaveRuleUpdate,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    rule = db.query(LeaveRule).filter(LeaveRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    old_values = {"rule_type": rule.rule_type, "value": rule.value}
    for key, value in data.dict(exclude_unset=True).items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)
    audit_crud(request, db, user, "UPDATE_LEAVE_RULE", "leave_rules", str(rule_id), old_values, data.dict(exclude_unset=True))
    return rule
