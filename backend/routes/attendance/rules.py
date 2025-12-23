from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud

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
    db: Session = Depends(get_tenant_db)
):
    rule = AttendanceRule(**data.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "attendance_rules", rule.id, None, rule.__dict__)
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
    db: Session = Depends(get_tenant_db)
):
    rule = db.query(AttendanceRule).filter_by(id=rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    setattr(rule, 'is_active', not getattr(rule, 'is_active'))
    db.commit()
    db.refresh(rule)
    audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "attendance_rules", rule_id, None, rule.__dict__)
    return rule


@router.delete("/{rule_id}/")
def delete_rule(
    rule_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    rule = db.query(AttendanceRule).filter_by(id=rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    old_values = rule.__dict__.copy()
    db.delete(rule)
    db.commit()
    audit_crud(request, "tenant_db", {"email": "system"}, "DELETE", "attendance_rules", rule_id, old_values, None)
    return {"message": "Rule deleted"}

