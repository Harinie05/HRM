# routes/exit/settlement_documents.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
from pydantic import BaseModel

from routes.hospital import get_current_user
from database import get_tenant_engine
from models.models_tenant import EmployeeSettlement, ExperienceLetter, EmployeeExit, User

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

router = APIRouter(prefix="/settlement", tags=["Settlement & Documents"])

# ---------------------- SCHEMAS ----------------------
class SettlementCreate(BaseModel):
    employee_id: int
    resignation_id: int
    pending_salary: float
    leave_encashment: float
    bonus: float
    tds: float
    pf: float
    professional_tax: float
    advance_recovery: float = 0.0
    loan_recovery: float = 0.0
    gross_amount: float
    total_deductions: float
    net_payable: float
    calculated_by: str

class ExperienceLetterCreate(BaseModel):
    employee_id: int
    resignation_id: int
    employee_name: str
    employee_code: str
    company_name: str
    designation: str
    department: str
    joining_date: date
    last_working_day: date
    place: str = "Bangalore"
    issued_by: str = "HR Department"
    authorized_signatory: str = "HR Manager"

# -------------------------------------------------------------------------
# 1. CALCULATE & SAVE SETTLEMENT
# -------------------------------------------------------------------------
@router.post("/calculate")
def calculate_settlement(data: SettlementCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    try:
        # Check if settlement already exists
        existing = db.query(EmployeeSettlement).filter(
            EmployeeSettlement.resignation_id == data.resignation_id
        ).first()
        
        if existing:
            # Update existing settlement
            for field, value in data.dict().items():
                if field != 'resignation_id':
                    setattr(existing, field, value)
            existing.calculated_on = date.today()
            existing.updated_at = datetime.now()
            db.commit()
            db.refresh(existing)
            return {"message": "Settlement updated successfully", "id": existing.id}
        else:
            # Create new settlement
            settlement = EmployeeSettlement(
                **data.dict(),
                calculated_on=date.today()
            )
            db.add(settlement)
            db.commit()
            db.refresh(settlement)
            return {"message": "Settlement calculated successfully", "id": settlement.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# -------------------------------------------------------------------------
# 2. APPROVE SETTLEMENT
# -------------------------------------------------------------------------
@router.put("/approve/{settlement_id}")
def approve_settlement(settlement_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    settlement = db.query(EmployeeSettlement).filter(EmployeeSettlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(404, "Settlement not found")
    
    settlement.payment_status = "Approved"
    settlement.paid_on = date.today()
    settlement.updated_at = datetime.now()
    
    db.commit()
    return {"message": "Settlement approved successfully"}

# -------------------------------------------------------------------------
# 3. GENERATE & SAVE EXPERIENCE LETTER
# -------------------------------------------------------------------------
@router.post("/experience-letter")
def generate_experience_letter(data: ExperienceLetterCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    try:
        # Check if experience letter already exists
        existing = db.query(ExperienceLetter).filter(
            ExperienceLetter.resignation_id == data.resignation_id
        ).first()
        
        if existing:
            # Update existing letter
            for field, value in data.dict().items():
                if field != 'resignation_id':
                    setattr(existing, field, value)
            existing.issued_date = date.today()
            existing.updated_at = datetime.now()
            db.commit()
            db.refresh(existing)
            return {"message": "Experience letter updated successfully", "id": existing.id}
        else:
            # Create new experience letter
            letter = ExperienceLetter(
                **data.dict(),
                issued_date=date.today()
            )
            db.add(letter)
            db.commit()
            db.refresh(letter)
            return {"message": "Experience letter generated successfully", "id": letter.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# -------------------------------------------------------------------------
# 4. UPDATE EMAIL STATUS
# -------------------------------------------------------------------------
@router.put("/experience-letter/{letter_id}/email")
def update_email_status(letter_id: int, email_to: str, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    letter = db.query(ExperienceLetter).filter(ExperienceLetter.id == letter_id).first()
    if not letter:
        raise HTTPException(404, "Experience letter not found")
    
    letter.email_sent = True
    letter.email_sent_to = email_to
    letter.email_sent_at = datetime.now()
    letter.updated_at = datetime.now()
    
    db.commit()
    return {"message": "Email status updated successfully"}

# -------------------------------------------------------------------------
# 5. GET SETTLEMENT BY RESIGNATION ID
# -------------------------------------------------------------------------
@router.get("/by-resignation/{resignation_id}")
def get_settlement_by_resignation(resignation_id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    settlement = db.query(EmployeeSettlement).filter(
        EmployeeSettlement.resignation_id == resignation_id
    ).first()
    
    letter = db.query(ExperienceLetter).filter(
        ExperienceLetter.resignation_id == resignation_id
    ).first()
    
    return {
        "settlement": settlement,
        "experience_letter": letter
    }