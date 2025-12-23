from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import TrainingCertificate, TrainingProgram, User
from schemas.schemas_tenant import TrainingCertificateCreate, TrainingCertificateOut
from datetime import datetime, timedelta
import uuid
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

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
        
        # Generate PDF content (simple HTML template)
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Training Certificate</title>
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
                .certificate {{ border: 5px solid #0066cc; padding: 50px; margin: 20px; }}
                .title {{ font-size: 36px; color: #0066cc; margin-bottom: 30px; }}
                .content {{ font-size: 18px; line-height: 1.6; }}
                .signature {{ margin-top: 50px; }}
            </style>
        </head>
        <body>
            <div class="certificate">
                <h1 class="title">CERTIFICATE OF COMPLETION</h1>
                <div class="content">
                    <p>This is to certify that</p>
                    <h2>{employee_name or 'Unknown Employee'}</h2>
                    <p>has successfully completed the training program</p>
                    <h3>{program_title or 'Unknown Program'}</h3>
                    <p>with a score of <strong>{certificate.score}%</strong></p>
                    <p>Certificate Number: <strong>{getattr(certificate, 'certificate_number', f'CERT-{certificate.id:06d}')}</strong></p>
                    <p>Issued on: <strong>{certificate.issued_at.strftime('%B %d, %Y') if certificate.issued_at else 'N/A'}</strong></p>
                    {f'<p>Valid until: <strong>{certificate.expiry_date.strftime("%B %d, %Y")}</strong></p>' if getattr(certificate, 'expiry_date', None) else ''}                    
                </div>
                <div class="signature">
                    <p>_________________________</p>
                    <p>Authorized Signature</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        from fastapi.responses import Response
        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename=certificate_{certificate_id}.html"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating certificate: {str(e)}")
