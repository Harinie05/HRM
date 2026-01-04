from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user
from utils.permission import require_permission

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
    user = Depends(require_permission("add_leave_rule"))
):
    rule = LeaveRule(**data.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    audit_crud(request, db, user, "CREATE_LEAVE_RULE", "leave_rules", str(rule.id), {}, data.dict())
    return rule

@router.get("/", response_model=list[LeaveRuleOut])
def list_leave_rules(
    status: str = Query("active", description="Filter by status: active, inactive, or all"),
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("view_leave_rules"))
):
    query = db.query(LeaveRule)
    if status != "all":
        query = query.filter(LeaveRule.status == status.title())
    return query.all()

@router.put("/{rule_id}", response_model=LeaveRuleOut)
def update_leave_rule(
    rule_id: int,
    data: LeaveRuleUpdate,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("edit_leave_rule"))
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

@router.delete("/{rule_id}")
def delete_leave_rule(
    rule_id: int, 
    request: Request, 
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("delete_leave_rule"))
):
    rule = db.query(LeaveRule).filter(LeaveRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Leave rule not found")

    old_values = {"accrual_frequency": rule.accrual_frequency, "status": rule.status}
    # Soft delete - set status to Inactive instead of deleting
    rule.status = "Inactive"
    db.commit()
    audit_crud(request, db, user, "DELETE_LEAVE_RULE", "leave_rules", str(rule_id), old_values, {"status": "Inactive"})
    return {"message": "Leave rule deactivated"}
