# routes/payroll/statutory_rules.py

from fastapi import APIRouter, Depends, HTTPException, Form, Request
from sqlalchemy.orm import Session
from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from models.models_tenant import StatutoryRule
from pydantic import BaseModel
from typing import Optional

# ---------------------- TENANT SESSION ----------------------
def get_tenant_session(user):
    from models.models_master import Hospital
    from database import get_master_db

    tenant_db = user.get("tenant_db")
    master = next(get_master_db())

    hospital = master.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(404, "Tenant not found")

    engine = get_tenant_engine(hospital.db_name)
    return Session(bind=engine)

router = APIRouter(prefix="/payroll/statutory", tags=["Statutory Rules"])

# -------------------------------------------------------------------------
# 1. GET STATUTORY RULES
# -------------------------------------------------------------------------
@router.get("/")
def get_statutory_rules(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        rules = db.query(StatutoryRule).first()
        if not rules:
            # Create default rules if none exist
            rules = StatutoryRule()
            db.add(rules)
            db.commit()
            db.refresh(rules)
        return rules
    finally:
        db.close()

# -------------------------------------------------------------------------
# 2. UPDATE STATUTORY RULES
# -------------------------------------------------------------------------
@router.post("/update")
def update_statutory_rules(
    pf_enabled: str = Form("true"),
    pf_percent: str = Form("12"),
    pf_apply_on: str = Form("Basic"),
    esi_enabled: str = Form("true"),
    esi_threshold: str = Form("21000"),
    esi_percent: str = Form("1.75"),
    pt_enabled: str = Form("true"),
    pt_amount: str = Form("200"),
    tds_enabled: str = Form("true"),
    tds_percent: str = Form("10"),
    request: Request = None,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    try:
        # Get existing rules or create new
        rules = db.query(StatutoryRule).first()
        if not rules:
            rules = StatutoryRule()
            db.add(rules)

        # Update values
        setattr(rules, 'pf_enabled', pf_enabled.lower() == 'true')
        setattr(rules, 'pf_percent', float(pf_percent))
        setattr(rules, 'pf_apply_on', pf_apply_on)
        setattr(rules, 'esi_enabled', esi_enabled.lower() == 'true')
        setattr(rules, 'esi_threshold', float(esi_threshold))
        setattr(rules, 'esi_percent', float(esi_percent))
        setattr(rules, 'pt_enabled', pt_enabled.lower() == 'true')
        setattr(rules, 'pt_amount', float(pt_amount))
        setattr(rules, 'tds_enabled', tds_enabled.lower() == 'true')
        setattr(rules, 'tds_percent', float(tds_percent))

        db.commit()
        db.refresh(rules)
        if request:
            audit_crud(request, user.get("tenant_db"), user, "UPDATE", "statutory_rules", getattr(rules, 'id', None), None, rules.__dict__)
        
        return {"message": "Statutory rules updated successfully", "rules": rules}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Failed to update rules: {str(e)}")
    finally:
        db.close()