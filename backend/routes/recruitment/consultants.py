from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from datetime import datetime
from database import get_tenant_db
from utils.audit_logger import audit_crud
from utils.pdf_format import PDFHeaderFooterTemplate
from routes.hospital import get_current_user
from models.models_tenant import VisitingConsultant, ConsultantAvailability, ConsultantPayout
from schemas.schemas_tenant import (
    VisitingConsultantCreate, VisitingConsultantOut,
    ConsultantAvailabilityCreate, ConsultantAvailabilityOut,
    ConsultantPayoutCreate, ConsultantPayoutOut
)
from utils.email import send_email
from routes.hospital import get_current_user, check_permission
import logging

logger = logging.getLogger("HRM")

router = APIRouter()

# Test endpoint
@router.get("/test")
def test_endpoint():
    return {"message": "Consultants API is working"}

# =====================================================
# VISITING CONSULTANTS
# =====================================================

@router.get("/consultants", response_model=List[VisitingConsultantOut])
def get_consultants(status: Optional[str] = None, consultant_type: Optional[str] = None, db: Session = Depends(get_tenant_db), user = Depends(check_permission("view_consultants"))):
    query = db.query(VisitingConsultant)
    
    if status:
        query = query.filter(VisitingConsultant.status == status)
    if consultant_type:
        query = query.filter(VisitingConsultant.consultant_type == consultant_type)
    
    return query.all()

@router.post("/consultants", response_model=VisitingConsultantOut)
def create_consultant(consultant: VisitingConsultantCreate, request: Request, db: Session = Depends(get_tenant_db), user = Depends(check_permission("add_consultant"))):
    db_consultant = VisitingConsultant(**consultant.model_dump())
    db.add(db_consultant)
    db.commit()
    db.refresh(db_consultant)
    
    # Audit log
    audit_crud(request, db, user, "CREATE_CONSULTANT", "visiting_consultants", str(db_consultant.id), {}, {"name": consultant.name, "specialization": consultant.specialization})
    
    return db_consultant

@router.put("/consultants/{consultant_id}", response_model=VisitingConsultantOut)
def update_consultant(consultant_id: int, consultant: VisitingConsultantCreate, request: Request, db: Session = Depends(get_tenant_db), user = Depends(check_permission("edit_consultant"))):
    db_consultant = db.query(VisitingConsultant).filter(VisitingConsultant.id == consultant_id).first()
    if not db_consultant:
        raise HTTPException(status_code=404, detail="Consultant not found")
    
    old_name = db_consultant.name
    for key, value in consultant.model_dump().items():
        setattr(db_consultant, key, value)
    
    db.commit()
    db.refresh(db_consultant)
    
    # Audit log
    audit_crud(request, db, user, "UPDATE_CONSULTANT", "visiting_consultants", str(consultant_id), {"name": old_name}, {"name": consultant.name})
    
    return db_consultant

@router.delete("/consultants/{consultant_id}")
def delete_consultant(consultant_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(check_permission("delete_consultant"))):
    db_consultant = db.query(VisitingConsultant).filter(VisitingConsultant.id == consultant_id).first()
    if not db_consultant:
        raise HTTPException(status_code=404, detail="Consultant not found")
    
    old_status = db_consultant.status
    # Soft delete - set status to Inactive instead of deleting
    setattr(db_consultant, 'status', 'Inactive')
    db.commit()
    db.refresh(db_consultant)
    
    # Audit log
    audit_crud(request, db, user, "DEACTIVATE_CONSULTANT", "visiting_consultants", str(consultant_id), {"status": old_status}, {"status": "Inactive"})
    
    return {"message": "Consultant deactivated successfully"}

# =====================================================
# CONSULTANT AVAILABILITY
# =====================================================

@router.get("/consultants/availability", response_model=List[ConsultantAvailabilityOut])
def get_all_availability(db: Session = Depends(get_tenant_db), user = Depends(check_permission("view_availability"))):
    return db.query(ConsultantAvailability).all()

@router.post("/consultants/availability", response_model=ConsultantAvailabilityOut)
def create_availability_general(availability: ConsultantAvailabilityCreate, db: Session = Depends(get_tenant_db), user = Depends(check_permission("add_availability"))):
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
def get_all_payouts(db: Session = Depends(get_tenant_db), user = Depends(check_permission("view_payouts"))):
    return db.query(ConsultantPayout).all()

@router.post("/consultants/payouts", response_model=ConsultantPayoutOut)
def create_payout_general(payout: ConsultantPayoutCreate, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    db_payout = ConsultantPayout(**payout.model_dump())
    db.add(db_payout)
    db.commit()
    db.refresh(db_payout)
    
    # Audit log
    audit_crud(request, db, user, "CREATE_CONSULTANT_PAYOUT", "consultant_payouts", str(db_payout.id), {}, {"consultant_id": payout.consultant_id, "consultant_share": payout.consultant_share})
    
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
def process_payroll(payout_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(check_permission("process_payroll"))):
    db_payout = db.query(ConsultantPayout).filter(ConsultantPayout.id == payout_id).first()
    if not db_payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    old_status = str(db_payout.payout_status)
    setattr(db_payout, 'payout_status', "Processed")
    db.commit()
    db.refresh(db_payout)
    
    # Audit log
    audit_crud(request, db, user, "PROCESS_CONSULTANT_PAYOUT", "consultant_payouts", str(payout_id), {"status": old_status}, {"status": "Processed"})
    
    return db_payout

@router.get("/consultants/payouts/{payout_id}/payslip")
def generate_payslip(payout_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(check_permission("generate_payslip"))):
    """Generate consultant payslip PDF with organization header"""
    try:
        # Get payout and consultant details
        db_payout = db.query(ConsultantPayout).filter(ConsultantPayout.id == payout_id).first()
        if not db_payout:
            raise HTTPException(status_code=404, detail="Payout not found")
        
        db_consultant = db.query(VisitingConsultant).filter(VisitingConsultant.id == db_payout.consultant_id).first()
        if not db_consultant:
            raise HTTPException(status_code=404, detail="Consultant not found")
        
        # Generate PDF
        pdf_buffer = generate_consultant_payslip_pdf(db_payout, db_consultant, db)
        
        # Audit log
        audit_crud(request, db, user, "GENERATE_PAYSLIP", "consultant_payouts", str(payout_id), {}, {"action": "generate_pdf"})
        
        return StreamingResponse(
            io.BytesIO(pdf_buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=consultant-payslip-{payout_id}.pdf"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating consultant payslip: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

def generate_consultant_payslip_pdf(payout, consultant, db: Session):
    """Generate PDF for consultant payslip using organization header"""
    try:
        buffer = io.BytesIO()
        
        # Create document with proper margins for header
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=140,  # Space for header
            bottomMargin=60,  # Space for footer
            leftMargin=40,
            rightMargin=40
        )
        
        # Create header/footer template
        template = PDFHeaderFooterTemplate(db, "CONSULTANT PAYSLIP")
        
        styles = getSampleStyleSheet()
        story = []
        
        # Letter details section
        letter_info_style = ParagraphStyle(
            'LetterInfo',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            leftIndent=0
        )
        
        # Date
        story.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}", letter_info_style))
        
        # To field
        story.append(Paragraph(f"<b>To:</b> {consultant.name}", letter_info_style))
        
        story.append(Spacer(1, 20))
        
        # Subject
        subject_style = ParagraphStyle(
            'Subject',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=20,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER
        )
        story.append(Paragraph(f"<b>Subject: Consultant Payslip - {payout.period_start.strftime('%B %Y')}</b>", subject_style))
        
        # Content
        content_style = ParagraphStyle(
            'Content',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=12,
            leading=16,
            alignment=TA_LEFT
        )
        
        # Consultant Details Section
        story.append(Paragraph("<b>CONSULTANT DETAILS</b>", content_style))
        story.append(Spacer(1, 10))
        
        details_style = ParagraphStyle(
            'Details',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            leading=14
        )
        
        story.append(Paragraph(f"Name: <b>{consultant.name}</b>", details_style))
        story.append(Paragraph(f"Specialization: {consultant.specialization}", details_style))
        story.append(Paragraph(f"Registration Number: {consultant.registration_number}", details_style))
        story.append(Paragraph(f"Consultant Type: {consultant.consultant_type}", details_style))
        
        story.append(Spacer(1, 20))
        
        # Payout Details Section
        story.append(Paragraph("<b>PAYOUT DETAILS</b>", content_style))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph(f"Period: <b>{payout.period_start.strftime('%B %d, %Y')} - {payout.period_end.strftime('%B %d, %Y')}</b>", details_style))
        story.append(Paragraph(f"Total Cases Handled: {payout.total_cases}", details_style))
        story.append(Paragraph(f"Total Revenue Generated: ₹{payout.total_revenue:,.2f}", details_style))
        story.append(Paragraph(f"Hospital Share: ₹{payout.hospital_share:,.2f}", details_style))
        
        story.append(Spacer(1, 15))
        
        # Net Payable - highlighted
        net_style = ParagraphStyle(
            'NetPayable',
            parent=styles['Normal'],
            fontSize=14,
            spaceAfter=12,
            fontName='Helvetica-Bold',
            alignment=TA_LEFT
        )
        story.append(Paragraph(f"<b>CONSULTANT SHARE: ₹{payout.consultant_share:,.2f}</b>", net_style))
        
        story.append(Spacer(1, 30))
        
        # Footer note
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=9,
            spaceAfter=8,
            alignment=TA_LEFT
        )
        
        story.append(Paragraph("This is a computer-generated payslip and does not require a signature.", footer_style))
        story.append(Paragraph("For any queries, please contact the HR Department.", footer_style))
        
        story.append(Spacer(1, 40))
        
        # Signature section
        signature_style = ParagraphStyle(
            'Signature',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=8,
            alignment=TA_LEFT
        )
        
        story.append(Paragraph("Best regards,", signature_style))
        story.append(Spacer(1, 40))
        story.append(Paragraph("_________________________", signature_style))
        story.append(Paragraph("<b>Finance Department</b>", signature_style))
        
        # Build PDF with header and footer
        doc.build(story, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
        
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        logger.error(f"Error generating consultant payslip PDF: {e}")
        raise Exception(f"Failed to generate PDF: {str(e)}")

@router.post("/consultants/payouts/{payout_id}/email-payslip")
def email_payslip(payout_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(check_permission("send_payslip_email"))):
    # Get payout and consultant details
    db_payout = db.query(ConsultantPayout).filter(ConsultantPayout.id == payout_id).first()
    if not db_payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    db_consultant = db.query(VisitingConsultant).filter(VisitingConsultant.id == db_payout.consultant_id).first()
    if not db_consultant:
        raise HTTPException(status_code=404, detail="Consultant not found")
    
    # Check if consultant has email
    contact_details = getattr(db_consultant, 'contact_details', None)
    if not contact_details or not contact_details.get('email'):
        raise HTTPException(status_code=400, detail="Consultant email not found")
    
    try:
        # Generate PDF using the new header format
        pdf_buffer = generate_consultant_payslip_pdf(db_payout, db_consultant, db)
        
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
            'content': pdf_buffer.getvalue()
        }]
        
        # Send email using existing utility
        success = send_email(
            to_email=contact_details['email'],
            subject=subject,
            html_content=html_content,
            attachments=attachments
        )
        
        # Audit log for email sending
        audit_crud(request, db, user, "SEND_CONSULTANT_PAYSLIP_EMAIL", "email_communications", str(payout_id), {}, {
            "recipient": contact_details['email'],
            "consultant_name": db_consultant.name,
            "subject": subject,
            "status": "Success" if success else "Failed"
        })
        
        if success:
            return {"message": "Payslip sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
        
    except Exception as e:
        # Audit log for failed email
        contact_details = getattr(db_consultant, 'contact_details', None)
        audit_crud(request, db, user, "SEND_CONSULTANT_PAYSLIP_EMAIL", "email_communications", str(payout_id), {}, {
            "recipient": contact_details.get('email', 'Unknown') if contact_details else 'Unknown',
            "consultant_name": db_consultant.name,
            "status": "Failed",
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")