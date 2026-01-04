# routes/exit/settlement_documents.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
from pydantic import BaseModel, validator
from utils.audit_logger import audit_crud
from utils.permission import require_permission
from database import get_tenant_db, get_tenant_engine

from routes.hospital import get_current_user
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
    joining_date: str
    last_working_day: str
    place: str = "Bangalore"
    issued_by: str = "HR Department"
    authorized_signatory: str = "HR Manager"

# -------------------------------------------------------------------------
# 1. CALCULATE & SAVE SETTLEMENT
# -------------------------------------------------------------------------
@router.post("/calculate")
def calculate_settlement(data: SettlementCreate, request: Request, user=Depends(require_permission("calculate_settlements"))):
    db = get_tenant_session(user)
    
    try:
        # Check if settlement already exists
        existing = db.query(EmployeeSettlement).filter(
            EmployeeSettlement.resignation_id == data.resignation_id
        ).first()
        
        if existing:
            # Update existing settlement
            old_values = {"net_payable": existing.net_payable, "payment_status": existing.payment_status}
            for field, value in data.dict().items():
                if field != 'resignation_id':
                    setattr(existing, field, value)
            existing.calculated_on = date.today()
            existing.updated_at = datetime.now()
            db.commit()
            db.refresh(existing)
            
            audit_crud(request, db, user, "UPDATE_SETTLEMENT", "employee_settlements", str(existing.id), old_values, data.dict())
            
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
            
            audit_crud(request, db, user, "CREATE_SETTLEMENT", "employee_settlements", str(settlement.id), {}, data.dict())
            
            return {"message": "Settlement calculated successfully", "id": settlement.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# -------------------------------------------------------------------------
# 2. APPROVE SETTLEMENT
# -------------------------------------------------------------------------
@router.put("/approve/{settlement_id}")
def approve_settlement(settlement_id: int, request: Request, user=Depends(require_permission("approve_settlements"))):
    db = get_tenant_session(user)
    
    settlement = db.query(EmployeeSettlement).filter(EmployeeSettlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(404, "Settlement not found")
    
    old_status = settlement.payment_status
    settlement.payment_status = "Approved"
    settlement.paid_on = date.today()
    settlement.updated_at = datetime.now()
    
    db.commit()
    
    audit_crud(request, db, user, "APPROVE_SETTLEMENT", "employee_settlements", str(settlement_id), {"payment_status": old_status}, {"payment_status": "Approved"})
    
    return {"message": "Settlement approved successfully"}

# -------------------------------------------------------------------------
# 3. GENERATE & SAVE EXPERIENCE LETTER
# -------------------------------------------------------------------------
@router.post("/experience-letter")
def generate_experience_letter(data: dict, request: Request, user=Depends(get_current_user)):
    print(f"Received data: {data}")
    
    try:
        db = get_tenant_session(user)
        print("Database session created")
        
        joining_date = datetime.strptime(data["joining_date"], "%Y-%m-%d").date()
        
        # Handle None value for last_working_day
        if data["last_working_day"] is None:
            last_working_day = date.today()  # Use today's date as default
        else:
            last_working_day = datetime.strptime(data["last_working_day"], "%Y-%m-%d").date()
        print(f"Dates parsed: {joining_date}, {last_working_day}")
        
        existing = db.query(ExperienceLetter).filter(
            ExperienceLetter.resignation_id == data["resignation_id"]
        ).first()
        print(f"Existing letter check: {existing}")
        
        if existing:
            return {"message": "Experience letter already exists", "id": existing.id}
        
        letter = ExperienceLetter(
            employee_id=data["employee_id"],
            resignation_id=data["resignation_id"],
            employee_name=data["employee_name"],
            employee_code=data["employee_code"],
            company_name=data["company_name"],
            designation=data["designation"],
            department=data["department"],
            joining_date=joining_date,
            last_working_day=last_working_day,
            place=data.get("place", "Bangalore"),
            issued_by=data.get("issued_by", "HR Department"),
            authorized_signatory=data.get("authorized_signatory", "HR Manager"),
            issued_date=date.today()
        )
        print("Letter object created")
        
        db.add(letter)
        print("Letter added to session")
        
        db.commit()
        print("Database committed")
        
        db.refresh(letter)
        print(f"Letter saved with ID: {letter.id}")
        
        return {"message": "Experience letter generated successfully", "id": letter.id}
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        if 'db' in locals():
            db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# -------------------------------------------------------------------------
# 4. UPDATE EXPERIENCE LETTER
# -------------------------------------------------------------------------
@router.put("/experience-letter/{letter_id}")
def update_experience_letter(letter_id: int, data: dict, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    
    try:
        letter = db.query(ExperienceLetter).filter(ExperienceLetter.id == letter_id).first()
        if not letter:
            raise HTTPException(404, "Experience letter not found")
        
        joining_date = datetime.strptime(data["joining_date"], "%Y-%m-%d").date()
        
        if data["last_working_day"] is None:
            last_working_day = date.today()
        else:
            last_working_day = datetime.strptime(data["last_working_day"], "%Y-%m-%d").date()
        
        letter.employee_name = data["employee_name"]
        letter.employee_code = data["employee_code"]
        letter.company_name = data["company_name"]
        letter.designation = data["designation"]
        letter.department = data["department"]
        letter.joining_date = joining_date
        letter.last_working_day = last_working_day
        letter.place = data.get("place", "Bangalore")
        letter.issued_by = data.get("issued_by", "HR Department")
        letter.authorized_signatory = data.get("authorized_signatory", "HR Manager")
        letter.updated_at = datetime.now()
        
        db.commit()
        db.refresh(letter)
        
        return {"message": "Experience letter updated successfully", "id": letter.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# -------------------------------------------------------------------------
# 5. UPDATE EMAIL STATUS
# -------------------------------------------------------------------------
@router.put("/experience-letter/{letter_id}/email")
def update_email_status(letter_id: int, email_to: str, request: Request, user=Depends(require_permission("email_settlement_docs"))):
    db = get_tenant_session(user)
    
    letter = db.query(ExperienceLetter).filter(ExperienceLetter.id == letter_id).first()
    if not letter:
        raise HTTPException(404, "Experience letter not found")
    
    old_values = {"email_sent": letter.email_sent, "email_sent_to": letter.email_sent_to}
    letter.email_sent = True
    letter.email_sent_to = email_to
    letter.email_sent_at = datetime.now()
    letter.updated_at = datetime.now()
    
    db.commit()
    
    audit_crud(request, db, user, "SEND_EXPERIENCE_LETTER_EMAIL", "experience_letters", str(letter_id), old_values, {"email_sent_to": email_to})
    
    return {"message": "Email status updated successfully"}

# -------------------------------------------------------------------------
# 5. GET SETTLEMENT BY RESIGNATION ID
# -------------------------------------------------------------------------
@router.get("/by-resignation/{resignation_id}")
def get_settlement_by_resignation(resignation_id: int, request: Request, user=Depends(require_permission("view_settlements"))):
    db = get_tenant_session(user)
    
    audit_crud(request, db, user, "VIEW_SETTLEMENT_BY_RESIGNATION", "employee_settlements", str(resignation_id), {}, {"resignation_id": resignation_id})
    
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