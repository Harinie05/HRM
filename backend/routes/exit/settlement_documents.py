# routes/exit/settlement_documents.py

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
from pydantic import BaseModel, validator
from utils.audit_logger import audit_crud
from utils.permission import require_permission
from database import get_tenant_db, get_tenant_engine
from utils.pdf_format import PDFHeaderFooterTemplate, get_organization_data
import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
import logging

logger = logging.getLogger("HRM")

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
            setattr(existing, 'calculated_on', date.today())
            setattr(existing, 'updated_at', datetime.now())
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
    setattr(settlement, 'payment_status', "Approved")
    setattr(settlement, 'paid_on', date.today())
    setattr(settlement, 'updated_at', datetime.now())
    
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
        
        setattr(letter, 'employee_name', data["employee_name"])
        setattr(letter, 'employee_code', data["employee_code"])
        setattr(letter, 'company_name', data["company_name"])
        setattr(letter, 'designation', data["designation"])
        setattr(letter, 'department', data["department"])
        setattr(letter, 'joining_date', joining_date)
        setattr(letter, 'last_working_day', last_working_day)
        setattr(letter, 'place', data.get("place", "Bangalore"))
        setattr(letter, 'issued_by', data.get("issued_by", "HR Department"))
        setattr(letter, 'authorized_signatory', data.get("authorized_signatory", "HR Manager"))
        setattr(letter, 'updated_at', datetime.now())
        
        db.commit()
        db.refresh(letter)
        
        return {"message": "Experience letter updated successfully", "id": letter.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# -------------------------------------------------------------------------
# 5. DOWNLOAD EXPERIENCE LETTER PDF
# -------------------------------------------------------------------------
@router.get("/experience-letter/{letter_id}/download")
def download_experience_letter(
    letter_id: int, 
    request: Request, 
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Generate and download experience letter PDF with organization header"""
    try:
        logger.info(f"✅ Starting experience letter PDF generation for letter_id: {letter_id}")
        
        # Get experience letter details
        letter = db.query(ExperienceLetter).filter(
            ExperienceLetter.id == letter_id
        ).first()
        
        if not letter:
            raise HTTPException(status_code=404, detail="Experience letter not found")
        
        logger.info(f"✅ Found experience letter: {letter.employee_name} ({letter.employee_code})")
        
        # Generate PDF
        pdf_buffer = generate_experience_letter_pdf(letter, db)
        
        # Return as streaming response
        filename = f"experience_letter_{letter.employee_code}_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        audit_crud(request, db, user, "DOWNLOAD", "experience_letters", str(letter_id), {}, {"action": "download_pdf"})
        
        logger.info(f"✅ Experience letter PDF generated successfully: {filename}")
        
        return StreamingResponse(
            io.BytesIO(pdf_buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating experience letter PDF: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

def generate_experience_letter_pdf(letter, db: Session):
    """Generate PDF for experience letter using organization header"""
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
        
        # Create header/footer template with letter type as title
        template = PDFHeaderFooterTemplate(db, "EXPERIENCE CERTIFICATE")
        logger.info(f"✅ PDFHeaderFooterTemplate created successfully")
        
        # Test organization data fetch
        org_data = get_organization_data(db)
        logger.info(f"✅ Organization data: {org_data['name']}, Logo: {bool(org_data.get('logo'))}")
        
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
        story.append(Paragraph(f"<b>Date:</b> {letter.issued_date.strftime('%B %d, %Y') if letter.issued_date else datetime.now().strftime('%B %d, %Y')}", letter_info_style))
        
        # To field
        story.append(Paragraph(f"<b>To:</b> {letter.employee_name} ({letter.employee_code})", letter_info_style))
        
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
        story.append(Paragraph("<b>Subject: Experience Certificate</b>", subject_style))
        
        # Content
        content_style = ParagraphStyle(
            'Content',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=12,
            leading=16,
            alignment=TA_LEFT
        )
        
        # Experience letter content
        content_text = f"""TO WHOM IT MAY CONCERN

This is to certify that <b>{letter.employee_name}</b> (Employee Code: <b>{letter.employee_code}</b>) was employed with <b>{letter.company_name}</b> as <b>{letter.designation}</b> in the <b>{letter.department}</b> department.

The period of employment was from <b>{letter.joining_date.strftime('%B %d, %Y')}</b> to <b>{letter.last_working_day.strftime('%B %d, %Y')}</b>.

During the tenure, the employee has shown dedication and professionalism in their work. We wish them all the best for their future endeavors.

This certificate is issued upon request for official purposes."""
        
        # Handle different line break formats
        if '\n\n' in content_text:
            content_paragraphs = content_text.split('\n\n')
        else:
            content_paragraphs = [content_text]
        
        for para in content_paragraphs:
            if para.strip():
                # Replace single line breaks with <br/> for proper formatting
                formatted_para = para.strip().replace('\n', '<br/>')
                story.append(Paragraph(formatted_para, content_style))
                story.append(Spacer(1, 12))
        
        story.append(Spacer(1, 40))
        
        # Signature section
        signature_style = ParagraphStyle(
            'Signature',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=8,
            alignment=TA_LEFT
        )
        
        story.append(Paragraph(f"Place: {letter.place}", signature_style))
        story.append(Spacer(1, 40))
        story.append(Paragraph("_________________________", signature_style))
        story.append(Paragraph(f"<b>{letter.authorized_signatory}</b>", signature_style))
        story.append(Paragraph(f"{letter.issued_by}", signature_style))
        
        # Build PDF with header and footer
        logger.info(f"✅ Building PDF with header and footer")
        try:
            doc.build(story, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
            logger.info(f"✅ PDF built successfully with header/footer")
        except Exception as build_error:
            logger.error(f"❌ Error building PDF: {build_error}")
            raise
        
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        logger.error(f"❌ Error generating experience letter PDF: {e}")
        raise Exception(f"Failed to generate PDF: {str(e)}")

# -------------------------------------------------------------------------
# 6. UPDATE EMAIL STATUS
# -------------------------------------------------------------------------
@router.put("/experience-letter/{letter_id}/email")
def update_email_status(letter_id: int, data: dict, request: Request, user=Depends(require_permission("email_settlement_docs"))):
    db = get_tenant_session(user)
    
    letter = db.query(ExperienceLetter).filter(ExperienceLetter.id == letter_id).first()
    if not letter:
        raise HTTPException(404, "Experience letter not found")
    
    email_to = data.get("email_to")
    if not email_to:
        raise HTTPException(400, "email_to is required")
    
    old_values = {"email_sent": letter.email_sent, "email_sent_to": letter.email_sent_to}
    setattr(letter, 'email_sent', True)
    setattr(letter, 'email_sent_to', email_to)
    setattr(letter, 'email_sent_at', datetime.now())
    setattr(letter, 'updated_at', datetime.now())
    
    db.commit()
    
    audit_crud(request, db, user, "SEND_EXPERIENCE_LETTER_EMAIL", "experience_letters", str(letter_id), old_values, {"email_sent_to": email_to})
    
    return {"message": "Email status updated successfully"}

# -------------------------------------------------------------------------
# 6. GET SETTLEMENT BY RESIGNATION ID
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
