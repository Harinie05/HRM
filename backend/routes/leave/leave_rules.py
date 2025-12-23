from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud

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
def create_leave_rule(data: LeaveRuleCreate, request: Request, db: Session = Depends(get_tenant_db)):
    rule = LeaveRule(**data.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "leave_rules", rule.id, None, rule.__dict__)
    return rule


@router.get("/", response_model=list[LeaveRuleOut])
def list_leave_rules(db: Session = Depends(get_tenant_db)):
    return db.query(LeaveRule).all()


@router.put("/{rule_id}", response_model=LeaveRuleOut)
def update_leave_rule(
    rule_id: int,
    data: LeaveRuleUpdate,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    rule = db.query(LeaveRule).filter(LeaveRule.id == rule_id).first()
    if not rule:
        return {"detail": "Rule not found"}

    for key, value in data.dict(exclude_unset=True).items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)
    audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "leave_rules", rule_id, None, rule.__dict__)
    return rule
