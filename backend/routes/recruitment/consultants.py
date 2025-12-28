from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from datetime import datetime
from database import get_tenant_db
from models.models_tenant import VisitingConsultant, ConsultantAvailability, ConsultantPayout
from schemas.schemas_tenant import (
    VisitingConsultantCreate, VisitingConsultantOut,
    ConsultantAvailabilityCreate, ConsultantAvailabilityOut,
    ConsultantPayoutCreate, ConsultantPayoutOut
)
from utils.email import send_email

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

@router.get("/consultants/payouts/{payout_id}/payslip")
def generate_payslip(payout_id: int, db: Session = Depends(get_tenant_db)):
    # Get payout and consultant details
    db_payout = db.query(ConsultantPayout).filter(ConsultantPayout.id == payout_id).first()
    if not db_payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    db_consultant = db.query(VisitingConsultant).filter(VisitingConsultant.id == db_payout.consultant_id).first()
    if not db_consultant:
        raise HTTPException(status_code=404, detail="Consultant not found")
    
    # Create PDF
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Header
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, height - 50, "CONSULTANT PAYSLIP")
    
    # Hospital info (you can customize this)
    p.setFont("Helvetica", 10)
    p.drawString(50, height - 80, "Hospital Name")
    p.drawString(50, height - 95, "Address Line 1")
    p.drawString(50, height - 110, "City, State - PIN")
    
    # Date
    p.drawString(400, height - 80, f"Date: {datetime.now().strftime('%d/%m/%Y')}")
    
    # Consultant details
    y_pos = height - 150
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y_pos, "Consultant Details:")
    
    p.setFont("Helvetica", 10)
    y_pos -= 20
    p.drawString(50, y_pos, f"Name: {db_consultant.name}")
    y_pos -= 15
    p.drawString(50, y_pos, f"Specialization: {db_consultant.specialization}")
    y_pos -= 15
    p.drawString(50, y_pos, f"Registration No: {db_consultant.registration_number}")
    y_pos -= 15
    p.drawString(50, y_pos, f"Type: {db_consultant.consultant_type}")
    
    # Payout details
    y_pos -= 40
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y_pos, "Payout Details:")
    
    p.setFont("Helvetica", 10)
    y_pos -= 20
    p.drawString(50, y_pos, f"Period: {db_payout.period_start.strftime('%d/%m/%Y')} - {db_payout.period_end.strftime('%d/%m/%Y')}")
    y_pos -= 15
    p.drawString(50, y_pos, f"Total Cases: {db_payout.total_cases}")
    y_pos -= 15
    p.drawString(50, y_pos, f"Total Revenue: ₹{db_payout.total_revenue:,.2f}")
    y_pos -= 15
    p.drawString(50, y_pos, f"Hospital Share: ₹{db_payout.hospital_share:,.2f}")
    y_pos -= 15
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y_pos, f"Consultant Share: ₹{db_payout.consultant_share:,.2f}")
    
    # Footer
    p.setFont("Helvetica", 8)
    p.drawString(50, 50, "This is a computer-generated payslip.")
    
    p.save()
    buffer.seek(0)
    
    return StreamingResponse(
        io.BytesIO(buffer.read()),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=consultant-payslip-{payout_id}.pdf"}
    )

@router.post("/consultants/payouts/{payout_id}/email-payslip")
def email_payslip(payout_id: int, db: Session = Depends(get_tenant_db)):
    # Get payout and consultant details
    db_payout = db.query(ConsultantPayout).filter(ConsultantPayout.id == payout_id).first()
    if not db_payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    db_consultant = db.query(VisitingConsultant).filter(VisitingConsultant.id == db_payout.consultant_id).first()
    if not db_consultant:
        raise HTTPException(status_code=404, detail="Consultant not found")
    
    # Check if consultant has email
    if not db_consultant.contact_details or not db_consultant.contact_details.get('email'):
        raise HTTPException(status_code=400, detail="Consultant email not found")
    
    try:
        # Generate PDF in memory
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # PDF generation
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 50, "CONSULTANT PAYSLIP")
        
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 80, "Hospital Name")
        p.drawString(400, height - 80, f"Date: {datetime.now().strftime('%d/%m/%Y')}")
        
        y_pos = height - 150
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y_pos, "Consultant Details:")
        
        p.setFont("Helvetica", 10)
        y_pos -= 20
        p.drawString(50, y_pos, f"Name: {db_consultant.name}")
        y_pos -= 15
        p.drawString(50, y_pos, f"Specialization: {db_consultant.specialization}")
        
        y_pos -= 40
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y_pos, "Payout Details:")
        
        p.setFont("Helvetica", 10)
        y_pos -= 20
        p.drawString(50, y_pos, f"Period: {db_payout.period_start.strftime('%d/%m/%Y')} - {db_payout.period_end.strftime('%d/%m/%Y')}")
        y_pos -= 15
        p.drawString(50, y_pos, f"Total Cases: {db_payout.total_cases}")
        y_pos -= 15
        p.drawString(50, y_pos, f"Consultant Share: ₹{db_payout.consultant_share:,.2f}")
        
        p.save()
        buffer.seek(0)
        
        # Email content
        subject = f"Payslip for {db_payout.period_start.strftime('%B %Y')}"
        
        html_content = f"""
        <html>
        <body>
            <h2>Consultant Payslip</h2>
            <p>Dear {db_consultant.name},</p>
            
            <p>Please find attached your payslip for the period <strong>{db_payout.period_start.strftime('%d/%m/%Y')} - {db_payout.period_end.strftime('%d/%m/%Y')}</strong>.</p>
            
            <h3>Payout Summary:</h3>
            <ul>
                <li>Total Cases: {db_payout.total_cases}</li>
                <li>Total Revenue: ₹{db_payout.total_revenue:,.2f}</li>
                <li>Consultant Share: <strong>₹{db_payout.consultant_share:,.2f}</strong></li>
            </ul>
            
            <p>Best regards,<br>
            Hospital Administration</p>
        </body>
        </html>
        """
        
        # Prepare attachment
        attachments = [{
            'filename': f'consultant-payslip-{payout_id}.pdf',
            'content': buffer.getvalue()
        }]
        
        # Send email using existing utility
        success = send_email(
            to_email=db_consultant.contact_details['email'],
            subject=subject,
            html_content=html_content,
            attachments=attachments
        )
        
        if success:
            return {"message": "Payslip sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")