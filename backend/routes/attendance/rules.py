from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

from models.models_tenant import AttendanceRule
from schemas.schemas_tenant import AttendanceRuleCreate, AttendanceRuleOut

router = APIRouter(
    prefix="/attendance/rules",
    tags=["Attendance - Rules"]
)

@router.post("/", response_model=AttendanceRuleOut)
def create_rule(
    data: AttendanceRuleCreate,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    rule = AttendanceRule(**data.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    audit_crud(request, db, user, "CREATE_ATTENDANCE_RULE", "attendance_rules", str(rule.id), {}, data.dict())
    return rule

@router.get("/", response_model=list[AttendanceRuleOut])
def list_rules(
    db: Session = Depends(get_tenant_db)
):
    return db.query(AttendanceRule).all()

@router.patch("/{rule_id}/toggle", response_model=AttendanceRuleOut)
def toggle_rule(
    rule_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    rule = db.query(AttendanceRule).filter_by(id=rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    old_status = getattr(rule, 'is_active')
    setattr(rule, 'is_active', not getattr(rule, 'is_active'))
    db.commit()
    db.refresh(rule)
    audit_crud(request, db, user, "TOGGLE_ATTENDANCE_RULE", "attendance_rules", str(rule_id), {"is_active": old_status}, {"is_active": getattr(rule, 'is_active')})
    return rule

@router.delete("/{rule_id}/")
def delete_rule(
    rule_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    rule = db.query(AttendanceRule).filter_by(id=rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    old_values = {"rule_type": rule.rule_type, "value": rule.value, "is_active": getattr(rule, 'is_active')}
    db.delete(rule)
    db.commit()
    audit_crud(request, db, user, "DELETE_ATTENDANCE_RULE", "attendance_rules", str(rule_id), old_values, {})
    return {"message": "Rule deleted"}

