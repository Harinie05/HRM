from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_tenant_db
from models.models_tenant import Candidate, OfferLetter, JobRequisition
from schemas.schemas_tenant import OfferCreate, OfferUpdate, OfferStatusUpdate, OfferOut
from utils.email import send_email
import uuid, os
from datetime import datetime
from database import logger

router = APIRouter(prefix="/offer", tags=["Offer Letters"])

UPLOAD_DIR = "uploads/offers"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# -----------------------------------------------------------
# 1) CREATE OFFER LETTER DRAFT
# -----------------------------------------------------------
@router.post("/{candidate_id}/create")
def create_offer(candidate_id: int, data: OfferCreate, db: Session = Depends(get_tenant_db)):
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Get job information
        job = db.query(JobRequisition).filter(JobRequisition.id == candidate.job_id).first()
        
        # Ensure department is never None
        department = "General"
        if job and job.department and job.department.strip():
            department = job.department
        
        offer = OfferLetter(
            candidate_id=candidate_id,
            candidate_name=candidate.name,
            job_title=job.title if job else "N/A",
            department=department,
            ctc=data.ctc or 0,
            basic_percent=data.basic_percent,
            hra_percent=data.hra_percent,
            joining_date=data.joining_date if data.joining_date else None,
            probation_period=data.probation_period,
            notice_period=data.notice_period,
            terms=data.terms or "",
            offer_status="Draft",
            created_at=datetime.utcnow(),
        )

        db.add(offer)
        db.commit()
        db.refresh(offer)

        return offer
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating offer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create offer: {str(e)}")


# -----------------------------------------------------------
# 2) UPDATE OFFER CONTENT
# -----------------------------------------------------------
@router.put("/{offer_id}/update", response_model=OfferOut)
def update_offer(offer_id: int, data: OfferUpdate, db: Session = Depends(get_tenant_db)):
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(offer, key, value)

    db.commit()
    db.refresh(offer)
    return offer


# -----------------------------------------------------------
# 3) UPLOAD OFFER PDF DOCUMENT
# -----------------------------------------------------------
@router.post("/{offer_id}/upload-document", response_model=OfferOut)
def upload_offer_document(
    offer_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_tenant_db)
):
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    setattr(offer, 'document', filename)
    db.commit()
    db.refresh(offer)
    return offer


# -----------------------------------------------------------
# 4) SEND OFFER MAIL (WITH TOKEN)
# -----------------------------------------------------------
@router.post("/{offer_id}/send")
def send_offer(offer_id: int, db: Session = Depends(get_tenant_db)):

    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Get candidate email
    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    token = str(uuid.uuid4())
    offer.token = token
    offer.offer_status = "Sent"

    # Professional offer email
    subject = f"🎉 Job Offer - {offer.job_title} Position at NUTRYAH"
    
    email_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #28a745; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }}
        .offer-details {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .action-buttons {{ text-align: center; margin: 30px 0; }}
        .btn {{ display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
        .btn-accept {{ background: #28a745; color: white; }}
        .btn-reject {{ background: #dc3545; color: white; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🎉 Congratulations! Job Offer</h2>
        </div>
        
        <p>Dear <strong>{offer.candidate_name}</strong>,</p>
        
        <p>We are delighted to extend an offer of employment for the position of <strong>{offer.job_title}</strong> at <strong>NUTRYAH</strong>.</p>
        
        <div class="offer-details">
            <h3>📋 Offer Details:</h3>
            <p><strong>Position:</strong> {offer.job_title}</p>
            <p><strong>Department:</strong> {offer.department}</p>
            <p><strong>Annual CTC:</strong> ₹{offer.ctc:,}</p>
            <p><strong>Joining Date:</strong> {offer.joining_date or 'To be discussed'}</p>
            <p><strong>Probation Period:</strong> {offer.probation_period}</p>
            <p><strong>Notice Period:</strong> {offer.notice_period}</p>
        </div>
        
        <div class="offer-details">
            <h3>💰 Salary Breakdown:</h3>
            <p><strong>Basic:</strong> {offer.basic_percent}% of CTC</p>
            <p><strong>HRA:</strong> {offer.hra_percent}% of CTC</p>
            <p><strong>Other Allowances:</strong> {100 - offer.basic_percent - offer.hra_percent}% of CTC</p>
        </div>
        
        <div class="offer-details">
            <h3>📝 Terms & Conditions:</h3>
            <p>{offer.terms or 'Standard company terms and conditions apply.'}</p>
        </div>
        
        <div class="action-buttons">
            <p><strong>Please respond to this offer by replying to this email with:</strong></p>
            <p style="font-size: 18px; margin: 20px 0;">
                <strong style="color: #28a745;">"I ACCEPT"</strong> or <strong style="color: #dc3545;">"I REJECT"</strong>
            </p>
        </div>
        
        <p>This offer is valid for 7 days from the date of this email. We look forward to welcoming you to the NUTRYAH team!</p>
        
        <p><strong>Best regards,</strong><br>
        HR Team<br>
        NUTRYAH</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated email. Please reply with your acceptance or rejection.</p>
    </div>
</body>
</html>"""
    
    success = send_email(candidate.email, subject, email_html)
    
    if success:
        db.commit()
        logger.info(f"✅ Offer letter sent to {candidate.email}")
        return {"message": "Offer letter sent successfully", "offer": offer}
    else:
        raise HTTPException(status_code=500, detail="Failed to send offer email")


# -----------------------------------------------------------
# 5) UPDATE ACCEPT / REJECT STATUS
# -----------------------------------------------------------
@router.post("/{offer_id}/status")
def update_offer_status(offer_id: int, status: str, db: Session = Depends(get_tenant_db)):
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    offer.offer_status = status
    db.commit()
    
    return {"message": f"Offer {status.lower()} successfully", "offer": offer}


# -----------------------------------------------------------
# GENERATE DOCUMENT UPLOAD LINK
# -----------------------------------------------------------
@router.post("/{offer_id}/generate-link")
def generate_document_link(offer_id: int, db: Session = Depends(get_tenant_db)):
    """Generate document upload link for manual sharing"""
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Generate or reuse token
    if not offer.token:
        offer.token = str(uuid.uuid4())
        db.commit()
    
    upload_url = f"http://localhost:3000/document-upload/{offer.token}"
    
    return {
        "message": "Document upload link generated",
        "upload_url": upload_url,
        "candidate_name": offer.candidate_name
    }


# -----------------------------------------------------------
# PUBLIC DOCUMENT UPLOAD BY TOKEN
# -----------------------------------------------------------
@router.get("/documents/{token}")
def get_document_upload_page(token: str, db: Session = Depends(get_tenant_db)):
    """Get offer details for document upload page"""
    offer = db.query(OfferLetter).filter(OfferLetter.token == token).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
    
    return {
        "candidate_name": offer.candidate_name,
        "job_title": offer.job_title,
        "offer_id": offer.id
    }


from fastapi import Form

@router.post("/documents/{token}/upload")
def upload_documents(
    token: str,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    db: Session = Depends(get_tenant_db)
):
    """Upload document via public link"""
    offer = db.query(OfferLetter).filter(OfferLetter.token == token).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
    
    # Save file
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    
    # Create document record
    from models.models_tenant import DocumentUpload
    doc = DocumentUpload(
        candidate_id=offer.candidate_id,
        document_type=document_type,
        file_name=filename,
        file_path=file_path,
        status="Uploaded"
    )
    
    db.add(doc)
    db.commit()
    
    return {"message": "Document uploaded successfully"}


# -----------------------------------------------------------
# SUBMIT ALL DOCUMENTS
# -----------------------------------------------------------
@router.post("/documents/{token}/submit")
def submit_documents(token: str, db: Session = Depends(get_tenant_db)):
    """Mark documents as submitted"""
    offer = db.query(OfferLetter).filter(OfferLetter.token == token).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
    
    # Update offer status to indicate documents submitted
    offer.offer_status = "Documents Submitted"
    db.commit()
    
    return {"message": "Documents submitted successfully"}


# -----------------------------------------------------------
# VIEW UPLOADED FILE
# -----------------------------------------------------------
from fastapi.responses import FileResponse

@router.get("/documents/file/{file_name}")
def view_document_file(file_name: str):
    """Serve uploaded document file"""
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)


# -----------------------------------------------------------
# VIEW UPLOADED DOCUMENTS
# -----------------------------------------------------------
@router.get("/documents/view/{offer_id}")
def view_uploaded_documents(offer_id: int, db: Session = Depends(get_tenant_db)):
    """View all documents uploaded by candidate"""
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    from models.models_tenant import DocumentUpload
    documents = db.query(DocumentUpload).filter(
        DocumentUpload.candidate_id == offer.candidate_id
    ).all()
    
    return {
        "candidate_name": offer.candidate_name,
        "documents": [{
            "id": doc.id,
            "document_type": doc.document_type,
            "file_name": doc.file_name,
            "status": doc.status,
            "uploaded_at": doc.uploaded_at
        } for doc in documents]
    }


# -----------------------------------------------------------
# 6) LIST ALL OFFERS
# -----------------------------------------------------------
@router.get("/list")
def list_offers(db: Session = Depends(get_tenant_db)):
    offers = db.query(OfferLetter).all()
    return offers
