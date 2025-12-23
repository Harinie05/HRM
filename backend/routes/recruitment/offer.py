from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from typing import Optional
from database import get_tenant_db
from utils.audit_logger import audit_crud
from models.models_tenant import Candidate, OfferLetter, JobRequisition, BGV
from schemas.schemas_tenant import OfferCreate, OfferUpdate, OfferStatusUpdate, OfferOut
from utils.email import send_email
import uuid, os
from datetime import datetime
from database import logger

router = APIRouter(prefix="/offer", tags=["Offer Letters"])

UPLOAD_DIR = "uploads/offers"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# BGV Update Request Model
class BGVUpdateRequest(BaseModel):
    verification_type: Optional[str] = None
    agency_name: Optional[str] = None
    status: Optional[str] = None
    identity_verified: Optional[bool] = None
    address_verified: Optional[bool] = None
    employment_verified: Optional[bool] = None
    education_verified: Optional[bool] = None
    criminal_verified: Optional[bool] = None
    remarks: Optional[str] = None


# -----------------------------------------------------------
# 1) CREATE OFFER LETTER DRAFT
# -----------------------------------------------------------
@router.post("/{candidate_id}/create")
def create_offer(candidate_id: int, data: OfferCreate, request: Request, db: Session = Depends(get_tenant_db)):
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Get job information
        job = db.query(JobRequisition).filter(JobRequisition.id == candidate.job_id).first()
        
        # Ensure department is never None
        department = "General"
        if job:
            job_department = getattr(job, 'department', None)
            if job_department and job_department.strip():
                department = job_department
        
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
        audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "offer_letters", offer.id, None, offer.__dict__)

        return offer
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating offer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create offer: {str(e)}")


# -----------------------------------------------------------
# 2) UPDATE OFFER CONTENT
# -----------------------------------------------------------
@router.put("/{offer_id}/update", response_model=OfferOut)
def update_offer(offer_id: int, data: OfferUpdate, request: Request, db: Session = Depends(get_tenant_db)):
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    old_values = offer.__dict__.copy()
    for key, value in data.dict(exclude_unset=True).items():
        setattr(offer, key, value)

    db.commit()
    db.refresh(offer)
    audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "offer_letters", offer_id, old_values, offer.__dict__)
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
def send_offer(offer_id: int, request: Request, db: Session = Depends(get_tenant_db)):

    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Get candidate email
    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    token = str(uuid.uuid4())
    setattr(offer, 'token', token)
    setattr(offer, 'offer_status', "Sent")

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
    
    success = send_email(str(candidate.email), subject, email_html)
    
    if success:
        db.commit()
        audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "offer_letters", offer_id, None, {"offer_status": "Sent"})
        logger.info(f"✅ Offer letter sent to {candidate.email}")
        return {"message": "Offer letter sent successfully", "offer": offer}
    else:
        raise HTTPException(status_code=500, detail="Failed to send offer email")


# -----------------------------------------------------------
# 5) UPDATE ACCEPT / REJECT STATUS
# -----------------------------------------------------------
@router.post("/{offer_id}/status")
def update_offer_status(offer_id: int, status: str, request: Request, db: Session = Depends(get_tenant_db)):
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    setattr(offer, 'offer_status', status)
    db.commit()
    audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "offer_letters", offer_id, None, {"offer_status": status})
    
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
    token_value = getattr(offer, 'token', None)
    if token_value is None or token_value == "":
        setattr(offer, 'token', str(uuid.uuid4()))
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
from datetime import timedelta

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
    setattr(offer, 'offer_status', "Documents Submitted")
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
# BGV ENDPOINTS - Realistic Company Process
# -----------------------------------------------------------

# BGV Status Flow: Initiated -> Document Collection -> Agency Assignment -> In Progress -> Completed/Failed
BGV_STATUSES = {
    "INITIATED": "BGV Initiated",
    "DOCUMENT_COLLECTION": "Document Collection", 
    "AGENCY_ASSIGNED": "Agency Assigned",
    "IN_PROGRESS": "Verification In Progress",
    "COMPLETED": "BGV Completed",
    "FAILED": "BGV Failed",
    "ON_HOLD": "On Hold"
}

# BGV Check Types
BGV_CHECKS = {
    "IDENTITY": "Identity Verification",
    "ADDRESS": "Address Verification", 
    "EDUCATION": "Education Verification",
    "EMPLOYMENT": "Employment History",
    "CRIMINAL": "Criminal Background Check",
    "REFERENCE": "Reference Check"
}

# Mock BGV storage (in production, this would be in database)
bgv_records = {}

@router.post("/bgv/start/{candidate_id}")
def start_bgv(candidate_id: int, request: Request, db: Session = Depends(get_tenant_db)):
    """Start comprehensive BGV process for a candidate"""
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        candidate_name = getattr(candidate, 'name', None)
        candidate_email = getattr(candidate, 'email', None)
        
        if not candidate_name or not candidate_email:
            raise HTTPException(status_code=400, detail="Candidate must have name and email for BGV")
        
        # Check if BGV already exists in database
        existing_bgv = db.query(BGV).filter(BGV.candidate_id == candidate_id).first()
        if existing_bgv:
            return {
                "message": "BGV already exists for this candidate",
                "bgv_id": existing_bgv.id,
                "status": existing_bgv.status
            }
        
        # Create BGV record in database
        db_bgv = BGV(
            candidate_id=candidate_id,
            verification_type="Internal HR Team",
            status="Pending",
            identity_verified=False,
            address_verified=False,
            employment_verified=False,
            education_verified=False,
            criminal_verified=False,
            remarks="BGV process initiated. Awaiting document collection."
        )
        
        db.add(db_bgv)
        db.commit()
        db.refresh(db_bgv)
        audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "bgv", db_bgv.id, None, db_bgv.__dict__)
        
        # Also create in-memory record for compatibility
        bgv_id = f"BGV_{candidate_id}_{int(datetime.utcnow().timestamp())}"
        
        bgv_record = {
            "id": bgv_id,
            "candidate_id": candidate_id,
            "candidate_name": candidate_name,
            "candidate_email": candidate_email,
            "status": "INITIATED",
            "overall_status": "In Progress",
            "agency": None,
            "initiated_date": datetime.utcnow(),
            "expected_completion": datetime.utcnow() + timedelta(days=15),
            "checks": {
                "IDENTITY": {"status": "Pending", "result": None, "remarks": ""},
                "ADDRESS": {"status": "Pending", "result": None, "remarks": ""},
                "EDUCATION": {"status": "Pending", "result": None, "remarks": ""},
                "EMPLOYMENT": {"status": "Pending", "result": None, "remarks": ""},
                "CRIMINAL": {"status": "Pending", "result": None, "remarks": ""},
                "REFERENCE": {"status": "Pending", "result": None, "remarks": ""}
            },
            "documents_required": [
                "PAN Card", "Aadhaar Card", "Address Proof", 
                "Educational Certificates", "Experience Letters", "Salary Slips"
            ],
            "documents_submitted": [],
            "timeline": [{
                "stage": "BGV Initiated",
                "date": datetime.utcnow(),
                "remarks": "Background verification process started"
            }],
            "remarks": "BGV process initiated. Awaiting document collection."
        }
        
        bgv_records[bgv_id] = bgv_record
        
        logger.info(f"BGV started for candidate {candidate_id} - {candidate_name}")
        
        return {
            "message": "BGV process initiated successfully",
            "bgv_id": db_bgv.id,
            "status": "Pending",
            "next_steps": "Candidate will be contacted for document submission",
            "expected_completion": bgv_record["expected_completion"]
        }
    
    except Exception as e:
        logger.error(f"Error starting BGV: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start BGV: {str(e)}")


@router.get("/bgv/{bgv_id}")
def get_bgv_details(bgv_id: int, db: Session = Depends(get_tenant_db)):
    """Get comprehensive BGV details"""
    # Try database first
    db_bgv = db.query(BGV).filter(BGV.id == bgv_id).first()
    
    if db_bgv:
        # Reset status to Pending if it was auto-set to Cleared
        if db_bgv.status == "Cleared" and not all([
            db_bgv.identity_verified,
            db_bgv.address_verified,
            db_bgv.employment_verified,
            db_bgv.education_verified,
            db_bgv.criminal_verified
        ]):
            db_bgv.status = "Pending"
            db.commit()
        # Calculate progress from database record
        checks = [
            db_bgv.identity_verified,
            db_bgv.address_verified,
            db_bgv.employment_verified,
            db_bgv.education_verified,
            db_bgv.criminal_verified
        ]
        completed_checks = sum(1 for check in checks if check)
        total_checks = len(checks)
        progress = (completed_checks / total_checks) * 100
        
        return {
            "verification_type": db_bgv.verification_type,
            "agency_name": db_bgv.agency_name,
            "status": db_bgv.status,
            "identity_verified": db_bgv.identity_verified,
            "address_verified": db_bgv.address_verified,
            "employment_verified": db_bgv.employment_verified,
            "education_verified": db_bgv.education_verified,
            "criminal_verified": db_bgv.criminal_verified,
            "remarks": db_bgv.remarks,
            "progress_percentage": round(progress, 1),
            "checks_summary": {
                "total": total_checks,
                "completed": completed_checks,
                "pending": total_checks - completed_checks
            }
        }
    
    # Fallback to in-memory records
    bgv_id_str = str(bgv_id)
    if bgv_id_str not in bgv_records:
        raise HTTPException(status_code=404, detail="BGV record not found")
    
    bgv = bgv_records[bgv_id_str]
    
    # Calculate progress percentage
    total_checks = len(bgv["checks"])
    completed_checks = sum(1 for check in bgv["checks"].values() if check["status"] == "Completed")
    progress = (completed_checks / total_checks) * 100
    
    return {
        **bgv,
        "progress_percentage": round(progress, 1),
        "status_display": BGV_STATUSES.get(bgv["status"], bgv["status"]),
        "days_elapsed": (datetime.utcnow() - bgv["initiated_date"]).days,
        "checks_summary": {
            "total": total_checks,
            "completed": completed_checks,
            "pending": total_checks - completed_checks
        }
    }


@router.put("/bgv/update/{bgv_id}")
def update_bgv_status(bgv_id: int, data: BGVUpdateRequest, request: Request, db: Session = Depends(get_tenant_db)):
    """Update BGV status and progress"""
    # Try to find BGV in database first
    db_bgv = db.query(BGV).filter(BGV.id == bgv_id).first()
    
    if db_bgv:
        # Update database record
        if data.verification_type is not None:
            db_bgv.verification_type = data.verification_type
        
        if data.agency_name is not None:
            db_bgv.agency_name = data.agency_name
            if data.agency_name and data.verification_type != "Internal HR Team":
                db_bgv.verification_type = "Agency"
        
        if data.status is not None:
            db_bgv.status = data.status
        
        if data.identity_verified is not None:
            db_bgv.identity_verified = data.identity_verified
        
        if data.address_verified is not None:
            db_bgv.address_verified = data.address_verified
        
        if data.employment_verified is not None:
            db_bgv.employment_verified = data.employment_verified
        
        if data.education_verified is not None:
            db_bgv.education_verified = data.education_verified
        
        if data.criminal_verified is not None:
            db_bgv.criminal_verified = data.criminal_verified
        
        if data.remarks is not None:
            db_bgv.remarks = data.remarks
        
        # Status is only updated when explicitly set through the form
        # No automatic status changes based on checkboxes
        
        db.commit()
        audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "bgv", bgv_id, None, db_bgv.__dict__)
        
        return {
            "message": "BGV updated successfully",
            "bgv_id": bgv_id,
            "status": db_bgv.status
        }
    
    # Fallback to in-memory records
    bgv_id_str = str(bgv_id)
    if bgv_id_str not in bgv_records:
        raise HTTPException(status_code=404, detail="BGV record not found")
    
    bgv = bgv_records[bgv_id_str]
    
    # Update basic details
    if data.agency_name:
        bgv["agency"] = data.agency_name
        if bgv["status"] == "INITIATED":
            bgv["status"] = "AGENCY_ASSIGNED"
            bgv["timeline"].append({
                "stage": "Agency Assigned",
                "date": datetime.utcnow(),
                "remarks": f"BGV assigned to {data.agency_name}"
            })
    
    if data.status:
        old_status = bgv["status"]
        bgv["status"] = data.status
        if old_status != data.status:
            bgv["timeline"].append({
                "stage": BGV_STATUSES.get(data.status, data.status),
                "date": datetime.utcnow(),
                "remarks": data.remarks or f"Status updated to {data.status}"
            })
    
    if data.remarks:
        bgv["remarks"] = data.remarks
    
    return {
        "message": "BGV updated successfully",
        "bgv_id": bgv_id,
        "status": bgv["status"],
        "timeline": bgv["timeline"][-3:]  # Return last 3 timeline entries
    }


@router.post("/bgv/{bgv_id}/update-check")
def update_bgv_check(bgv_id: str, check_type: str, status: str, result: Optional[str] = None, remarks: str = ""):
    """Update individual BGV check status"""
    if bgv_id not in bgv_records:
        raise HTTPException(status_code=404, detail="BGV record not found")
    
    if check_type not in BGV_CHECKS:
        raise HTTPException(status_code=400, detail="Invalid check type")
    
    bgv = bgv_records[bgv_id]
    
    # Update specific check
    bgv["checks"][check_type] = {
        "status": status,
        "result": result,
        "remarks": remarks,
        "updated_at": datetime.utcnow()
    }
    
    # Add to timeline
    bgv["timeline"].append({
        "stage": f"{BGV_CHECKS[check_type]} - {status}",
        "date": datetime.utcnow(),
        "remarks": remarks or f"{BGV_CHECKS[check_type]} {status.lower()}"
    })
    
    # Check if all verifications are complete
    all_completed = all(check["status"] == "Completed" for check in bgv["checks"].values())
    any_failed = any(check["result"] == "Failed" for check in bgv["checks"].values())
    
    if all_completed:
        if any_failed:
            bgv["status"] = "FAILED"
            bgv["overall_status"] = "Failed"
        else:
            bgv["status"] = "COMPLETED"
            bgv["overall_status"] = "Completed"
        
        bgv["timeline"].append({
            "stage": "BGV Process Completed",
            "date": datetime.utcnow(),
            "remarks": f"All background checks completed. Overall result: {bgv['overall_status']}"
        })
    
    return {
        "message": f"{BGV_CHECKS[check_type]} updated successfully",
        "check_status": bgv["checks"][check_type],
        "overall_status": bgv["overall_status"]
    }


@router.post("/bgv/{bgv_id}/submit-documents")
def submit_bgv_documents(bgv_id: str, documents: list[str]):
    """Mark documents as submitted for BGV"""
    if bgv_id not in bgv_records:
        raise HTTPException(status_code=404, detail="BGV record not found")
    
    bgv = bgv_records[bgv_id]
    bgv["documents_submitted"] = documents
    
    # Update status to document collection if still initiated
    if bgv["status"] == "INITIATED":
        bgv["status"] = "DOCUMENT_COLLECTION"
        bgv["timeline"].append({
            "stage": "Documents Submitted",
            "date": datetime.utcnow(),
            "remarks": f"Candidate submitted {len(documents)} documents"
        })
    
    return {
        "message": "Documents submitted successfully",
        "submitted_count": len(documents),
        "status": bgv["status"]
    }


@router.get("/bgv/list")
def list_all_bgv(db: Session = Depends(get_tenant_db)):
    """List all BGV records with summary"""
    bgv_list = []
    
    for bgv_id, bgv in bgv_records.items():
        total_checks = len(bgv["checks"])
        completed_checks = sum(1 for check in bgv["checks"].values() if check["status"] == "Completed")
        progress = (completed_checks / total_checks) * 100
        
        bgv_list.append({
            "bgv_id": bgv_id,
            "candidate_id": bgv["candidate_id"],
            "candidate_name": bgv["candidate_name"],
            "status": bgv["status"],
            "status_display": BGV_STATUSES.get(bgv["status"], bgv["status"]),
            "overall_status": bgv["overall_status"],
            "agency": bgv["agency"],
            "progress_percentage": round(progress, 1),
            "initiated_date": bgv["initiated_date"],
            "expected_completion": bgv["expected_completion"],
            "days_elapsed": (datetime.utcnow() - bgv["initiated_date"]).days
        })
    
    return {"bgv_records": bgv_list, "total_count": len(bgv_list)}


# -----------------------------------------------------------
# MANUAL BGV COMPLETION FOR ONBOARDED CANDIDATES
# -----------------------------------------------------------
@router.post("/bgv/complete/{candidate_id}")
def complete_bgv_for_candidate(candidate_id: int, db: Session = Depends(get_tenant_db)):
    """Mark BGV as completed for candidates who have started onboarding"""
    try:
        # Check if candidate exists
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Find or create BGV record
        db_bgv = db.query(BGV).filter(BGV.candidate_id == candidate_id).first()
        
        if not db_bgv:
            # Create new BGV record if it doesn't exist
            db_bgv = BGV(
                candidate_id=candidate_id,
                verification_type="Internal HR Team",
                status="Cleared",
                identity_verified=True,
                address_verified=True,
                employment_verified=True,
                education_verified=True,
                criminal_verified=True,
                remarks="BGV completed successfully. All verifications cleared."
            )
            db.add(db_bgv)
        else:
            # Update existing BGV record
            db_bgv.status = "Cleared"
            db_bgv.identity_verified = True
            db_bgv.address_verified = True
            db_bgv.employment_verified = True
            db_bgv.education_verified = True
            db_bgv.criminal_verified = True
            db_bgv.remarks = "BGV completed successfully. All verifications cleared."
        
        db.commit()
        
        logger.info(f"BGV marked as completed for candidate {candidate_id}")
        
        return {
            "message": "BGV marked as completed successfully",
            "candidate_id": candidate_id,
            "bgv_status": "Cleared"
        }
    
    except Exception as e:
        logger.error(f"Error completing BGV: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to complete BGV: {str(e)}")


# -----------------------------------------------------------
# RESET BGV STATUS (FOR TESTING)
# -----------------------------------------------------------
@router.post("/bgv/reset/{candidate_id}")
def reset_bgv_status(candidate_id: int, db: Session = Depends(get_tenant_db)):
    """Reset BGV status to Pending for testing"""
    db_bgv = db.query(BGV).filter(BGV.candidate_id == candidate_id).first()
    if db_bgv:
        db_bgv.status = "Pending"
        db_bgv.identity_verified = False
        db_bgv.address_verified = False
        db_bgv.employment_verified = False
        db_bgv.education_verified = False
        db_bgv.criminal_verified = False
        db_bgv.remarks = "BGV reset to pending status"
        db.commit()
        return {"message": "BGV status reset to Pending"}
    return {"message": "No BGV record found"}

# -----------------------------------------------------------
# LIST ALL OFFERS WITH BGV STATUS
# -----------------------------------------------------------
@router.get("/list")
def list_offers(db: Session = Depends(get_tenant_db)):
    offers = db.query(OfferLetter).all()
    
    # Enrich offers with BGV information from database
    enriched_offers = []
    for offer in offers:
        # Get BGV record from database first
        db_bgv = db.query(BGV).filter(BGV.candidate_id == offer.candidate_id).first()
        
        # Check if candidate has started onboarding
        from models.models_tenant import OnboardingCandidate
        onboarding_record = db.query(OnboardingCandidate).filter(
            OnboardingCandidate.application_id == offer.candidate_id
        ).first()
        
        # Fallback to in-memory records if no database record
        candidate_bgv = None
        bgv_id_found = None
        
        if db_bgv:
            # Use database BGV record
            bgv_status = db_bgv.status
            # Map database status to display status
            if bgv_status == "Cleared":
                display_status = "Cleared"
            elif bgv_status == "Pending":
                display_status = "Pending"
            elif bgv_status == "In Progress":
                display_status = "In Progress"
            elif bgv_status == "Failed":
                display_status = "Failed"
            else:
                display_status = bgv_status
        else:
            # If candidate has onboarding record but no BGV, assume BGV is cleared
            if onboarding_record:
                display_status = "Cleared"
            else:
                # Fallback to in-memory records
                for bgv_id, bgv in bgv_records.items():
                    if bgv["candidate_id"] == offer.candidate_id:
                        candidate_bgv = bgv
                        bgv_id_found = bgv_id
                        break
                
                if candidate_bgv:
                    # Map in-memory status to display status
                    if candidate_bgv["overall_status"] == "Completed":
                        display_status = "Cleared"
                    elif candidate_bgv["status"] == "COMPLETED":
                        display_status = "Cleared"
                    else:
                        display_status = candidate_bgv.get("overall_status", candidate_bgv.get("status", None))
                else:
                    display_status = None
        
        offer_dict = {
            "id": offer.id,
            "candidate_id": offer.candidate_id,
            "candidate_name": offer.candidate_name,
            "job_title": offer.job_title,
            "department": offer.department,
            "ctc": offer.ctc,
            "basic_percent": offer.basic_percent,
            "hra_percent": offer.hra_percent,
            "joining_date": offer.joining_date,
            "probation_period": offer.probation_period,
            "notice_period": offer.notice_period,
            "terms": offer.terms,
            "document": offer.document,
            "offer_status": offer.offer_status,
            "token": offer.token,
            "created_at": offer.created_at,
            "application_id": offer.candidate_id,
            "bgv_status": display_status,
            "bgv_overall_status": display_status,
            "bgv_id": db_bgv.id if db_bgv else bgv_id_found,
            "bgv_agency": db_bgv.agency_name if db_bgv else (candidate_bgv["agency"] if candidate_bgv else None)
        }
        
        enriched_offers.append(offer_dict)
    
    return enriched_offers
