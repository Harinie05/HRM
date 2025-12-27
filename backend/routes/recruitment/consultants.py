from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_tenant_db
from models.models_tenant import VisitingConsultant, ConsultantAvailability, ConsultantPayout
from schemas.schemas_tenant import (
    VisitingConsultantCreate, VisitingConsultantOut,
    ConsultantAvailabilityCreate, ConsultantAvailabilityOut,
    ConsultantPayoutCreate, ConsultantPayoutOut
)

router = APIRouter()

# Test endpoint
@router.get("/test")
def test_endpoint():
    return {"message": "Consultants API is working"}

# =====================================================
# VISITING CONSULTANTS
# =====================================================

@router.get("/consultants", response_model=List[VisitingConsultantOut])
def get_consultants(db: Session = Depends(get_tenant_db)):
    return db.query(VisitingConsultant).all()

@router.post("/consultants", response_model=VisitingConsultantOut)
def create_consultant(consultant: VisitingConsultantCreate, db: Session = Depends(get_tenant_db)):
    db_consultant = VisitingConsultant(**consultant.model_dump())
    db.add(db_consultant)
    db.commit()
    db.refresh(db_consultant)
    return db_consultant

@router.put("/consultants/{consultant_id}", response_model=VisitingConsultantOut)
def update_consultant(consultant_id: int, consultant: VisitingConsultantCreate, db: Session = Depends(get_tenant_db)):
    db_consultant = db.query(VisitingConsultant).filter(VisitingConsultant.id == consultant_id).first()
    if not db_consultant:
        raise HTTPException(status_code=404, detail="Consultant not found")
    
    for key, value in consultant.model_dump().items():
        setattr(db_consultant, key, value)
    
    db.commit()
    db.refresh(db_consultant)
    return db_consultant

@router.delete("/consultants/{consultant_id}")
def delete_consultant(consultant_id: int, db: Session = Depends(get_tenant_db)):
    db_consultant = db.query(VisitingConsultant).filter(VisitingConsultant.id == consultant_id).first()
    if not db_consultant:
        raise HTTPException(status_code=404, detail="Consultant not found")
    
    db.delete(db_consultant)
    db.commit()
    return {"message": "Consultant deleted successfully"}

# =====================================================
# CONSULTANT AVAILABILITY
# =====================================================

@router.get("/consultants/availability", response_model=List[ConsultantAvailabilityOut])
def get_all_availability(db: Session = Depends(get_tenant_db)):
    return db.query(ConsultantAvailability).all()

@router.post("/consultants/availability", response_model=ConsultantAvailabilityOut)
def create_availability_general(availability: ConsultantAvailabilityCreate, db: Session = Depends(get_tenant_db)):
    db_availability = ConsultantAvailability(**availability.model_dump())
    db.add(db_availability)
    db.commit()
    db.refresh(db_availability)
    return db_availability

@router.get("/consultants/{consultant_id}/availability", response_model=List[ConsultantAvailabilityOut])
def get_consultant_availability(consultant_id: int, db: Session = Depends(get_tenant_db)):
    return db.query(ConsultantAvailability).filter(ConsultantAvailability.consultant_id == consultant_id).all()

@router.post("/consultants/{consultant_id}/availability", response_model=ConsultantAvailabilityOut)
def create_availability(consultant_id: int, availability: ConsultantAvailabilityCreate, db: Session = Depends(get_tenant_db)):
    availability_data = availability.model_dump()
    availability_data["consultant_id"] = consultant_id
    db_availability = ConsultantAvailability(**availability_data)
    db.add(db_availability)
    db.commit()
    db.refresh(db_availability)
    return db_availability

# =====================================================
# CONSULTANT PAYOUTS
# =====================================================

@router.get("/consultants/payouts", response_model=List[ConsultantPayoutOut])
def get_all_payouts(db: Session = Depends(get_tenant_db)):
    return db.query(ConsultantPayout).all()

@router.post("/consultants/payouts", response_model=ConsultantPayoutOut)
def create_payout_general(payout: ConsultantPayoutCreate, db: Session = Depends(get_tenant_db)):
    db_payout = ConsultantPayout(**payout.model_dump())
    db.add(db_payout)
    db.commit()
    db.refresh(db_payout)
    return db_payout

@router.get("/consultants/{consultant_id}/payouts", response_model=List[ConsultantPayoutOut])
def get_consultant_payouts(consultant_id: int, db: Session = Depends(get_tenant_db)):
    return db.query(ConsultantPayout).filter(ConsultantPayout.consultant_id == consultant_id).all()

@router.post("/consultants/{consultant_id}/payouts", response_model=ConsultantPayoutOut)
def create_payout(consultant_id: int, payout: ConsultantPayoutCreate, db: Session = Depends(get_tenant_db)):
    payout_data = payout.model_dump()
    payout_data["consultant_id"] = consultant_id
    db_payout = ConsultantPayout(**payout_data)
    db.add(db_payout)
    db.commit()
    db.refresh(db_payout)
    return db_payout

@router.put("/consultants/payouts/{payout_id}/process", response_model=ConsultantPayoutOut)
def process_payroll(payout_id: int, db: Session = Depends(get_tenant_db)):
    db_payout = db.query(ConsultantPayout).filter(ConsultantPayout.id == payout_id).first()
    if not db_payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    db_payout.payout_status = "Processed"
    db.commit()
    db.refresh(db_payout)
    return db_payout

@router.put("/payouts/{payout_id}", response_model=ConsultantPayoutOut)
def update_payout(payout_id: int, payout: ConsultantPayoutCreate, db: Session = Depends(get_tenant_db)):
    db_payout = db.query(ConsultantPayout).filter(ConsultantPayout.id == payout_id).first()
    if not db_payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    for key, value in payout.model_dump().items():
        if key != "consultant_id":  # Don't update consultant_id
            setattr(db_payout, key, value)
    
    db.commit()
    db.refresh(db_payout)
    return db_payout