from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_tenant_db

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
def create_leave_rule(data: LeaveRuleCreate, db: Session = Depends(get_tenant_db)):
    rule = LeaveRule(**data.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/", response_model=list[LeaveRuleOut])
def list_leave_rules(db: Session = Depends(get_tenant_db)):
    return db.query(LeaveRule).all()


@router.put("/{rule_id}", response_model=LeaveRuleOut)
def update_leave_rule(
    rule_id: int,
    data: LeaveRuleUpdate,
    db: Session = Depends(get_tenant_db)
):
    rule = db.query(LeaveRule).filter(LeaveRule.id == rule_id).first()
    if not rule:
        return {"detail": "Rule not found"}

    for key, value in data.dict(exclude_unset=True).items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)
    return rule
