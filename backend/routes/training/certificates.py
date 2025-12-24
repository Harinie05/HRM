from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import TrainingCertificate, TrainingProgram, User
from schemas.schemas_tenant import TrainingCertificateCreate, TrainingCertificateOut
from datetime import datetime, timedelta
import uuid
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO

router = APIRouter(prefix="/certificates", tags=["Training Certificates"])

@router.post("/")
def generate_certificate(data: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        # Handle employee_id conversion
        employee_id_raw = data.get('employee_id')
        if str(employee_id_raw).startswith('user_'):
            employee_id = int(employee_id_raw.replace('user_', ''))
        else:
            employee_id = int(employee_id_raw)
        
        # Generate certificate number
        cert_number = f"CERT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        cert = TrainingCertificate(
            training_id=data.get('training_id'),
            employee_id=employee_id,
            score=data.get('score'),
            compliance_type=data.get('compliance_type'),
            certificate_number=cert_number,
            issued_date=datetime.now(),
            expiry_date=datetime.now() + timedelta(days=365) if data.get('has_expiry') else None
        )
        
        db.add(cert)
        db.commit()
        db.refresh(cert)
        
        # Audit log
        audit_crud(request, "tenant", user, "CREATE_TRAINING_CERTIFICATE", "training_certificates", str(cert.id), None, data)
        
        return {"message": "Certificate generated", "id": cert.id, "certificate_number": cert_number}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=f"Error generating certificate: {str(e)}")

@router.get("/")
def list_certificates(db: Session = Depends(get_tenant_db)):
    try:
        # Join with training programs and users to get complete data
        certificates_data = db.query(
            TrainingCertificate,
            TrainingProgram.title.label('program_title'),
            User.name.label('employee_name')
        ).join(
            TrainingProgram, TrainingCertificate.training_id == TrainingProgram.id, isouter=True
        ).join(
            User, TrainingCertificate.employee_id == User.id, isouter=True
        ).all()
        
        result = []
        for certificate, program_title, employee_name in certificates_data:
            result.append({
                "id": certificate.id,
                "training_id": certificate.training_id,
                "employee_id": certificate.employee_id,
                "employee_name": employee_name or f"Employee #{certificate.employee_id}",
                "program_title": program_title or "Unknown Program",
                "score": certificate.score,
                "certificate_number": getattr(certificate, 'certificate_number', f"CERT-{certificate.id:06d}"),
                "issued_date": certificate.issued_at,
                "expiry_date": getattr(certificate, 'expiry_date', None),
                "status": certificate.status,
                "compliance_type": certificate.compliance_type,
                "certificate_file": certificate.certificate_file
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching certificates: {str(e)}")

@router.get("/{certificate_id}/download")
def download_certificate(certificate_id: int, db: Session = Depends(get_tenant_db)):
    try:
        # Get certificate data with joins
        certificate_data = db.query(
            TrainingCertificate,
            TrainingProgram.title.label('program_title'),
            User.name.label('employee_name')
        ).join(
            TrainingProgram, TrainingCertificate.training_id == TrainingProgram.id, isouter=True
        ).join(
            User, TrainingCertificate.employee_id == User.id, isouter=True
        ).filter(TrainingCertificate.id == certificate_id).first()
        
        if not certificate_data:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        certificate, program_title, employee_name = certificate_data
        
        # Generate PDF using ReportLab
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Title with certificate styling
        title_style = ParagraphStyle(
            'CertificateTitle',
            parent=styles['Title'],
            fontSize=24,
            textColor=colors.blue,
            alignment=1,  # Center alignment
            spaceAfter=30
        )
        
        title = Paragraph("CERTIFICATE OF COMPLETION", title_style)
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Certificate content
        content_style = ParagraphStyle(
            'CertificateContent',
            parent=styles['Normal'],
            fontSize=14,
            alignment=1,  # Center alignment
            spaceAfter=12
        )
        
        name_style = ParagraphStyle(
            'EmployeeName',
            parent=styles['Normal'],
            fontSize=18,
            textColor=colors.darkblue,
            alignment=1,
            spaceAfter=12,
            fontName='Helvetica-Bold'
        )
        
        program_style = ParagraphStyle(
            'ProgramTitle',
            parent=styles['Normal'],
            fontSize=16,
            textColor=colors.darkgreen,
            alignment=1,
            spaceAfter=12,
            fontName='Helvetica-Bold'
        )
        
        # Certificate content
        story.append(Paragraph("This is to certify that", content_style))
        story.append(Paragraph(employee_name or 'Unknown Employee', name_style))
        story.append(Paragraph("has successfully completed the training program", content_style))
        story.append(Paragraph(program_title or 'Unknown Program', program_style))
        story.append(Paragraph(f"with a score of <b>{certificate.score}%</b>", content_style))
        
        story.append(Spacer(1, 20))
        
        # Certificate details
        details_style = ParagraphStyle(
            'CertificateDetails',
            parent=styles['Normal'],
            fontSize=12,
            alignment=1,
            spaceAfter=8
        )
        
        cert_number = getattr(certificate, 'certificate_number', f'CERT-{certificate.id:06d}')
        story.append(Paragraph(f"Certificate Number: <b>{cert_number}</b>", details_style))
        
        issued_date = certificate.issued_at.strftime('%B %d, %Y') if certificate.issued_at else 'N/A'
        story.append(Paragraph(f"Issued on: <b>{issued_date}</b>", details_style))
        
        if getattr(certificate, 'expiry_date', None):
            expiry_date = certificate.expiry_date.strftime('%B %d, %Y')
            story.append(Paragraph(f"Valid until: <b>{expiry_date}</b>", details_style))
        
        story.append(Spacer(1, 40))
        
        # Signature section
        signature_style = ParagraphStyle(
            'Signature',
            parent=styles['Normal'],
            fontSize=12,
            alignment=1,
            spaceAfter=8
        )
        
        story.append(Paragraph("_________________________", signature_style))
        story.append(Paragraph("Authorized Signature", signature_style))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        filename = f"certificate_{certificate_id}.pdf"
        
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating certificate: {str(e)}")
