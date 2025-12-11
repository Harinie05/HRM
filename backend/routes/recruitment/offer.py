from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_master_db, get_tenant_engine
from models.models_master import Hospital
from models.models_tenant import (
    JobApplication,
    OfferLetter,
    BGV,
    JobRequisition
)
from schemas.schemas_tenant import (
    OfferCreate,
    OfferOut,
    BGVUpdate
)
from routes.hospital import get_current_user
from utils.email import send_email
import os
from datetime import datetime

router = APIRouter(prefix="/offer", tags=["Offer & Pre-Onboarding"])


# ========================= GET TENANT DB =========================
def get_tenant_session(user):
    tenant_db = user.get("tenant_db")

    master = next(get_master_db())
    hospital = master.query(Hospital).filter(Hospital.db_name == tenant_db).first()

    if not hospital:
        raise HTTPException(404, "Hospital not found")

    engine = get_tenant_engine(hospital.db_name)
    return Session(bind=engine)


# =================================================================
#                         CREATE OFFER
# =================================================================
@router.post("/generate/{application_id}")
def generate_offer(application_id: int, request: dict, user=Depends(get_current_user)):

    db = get_tenant_session(user)

    candidate = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not candidate:
        raise HTTPException(404, "Candidate not found")

    job = db.query(JobRequisition).filter(JobRequisition.id == candidate.job_id).first()
    if not job:
        raise HTTPException(404, "Job requisition not found")

    # Convert joining date if available
    joining_date = None
    if request.get("joining_date"):
        try:
            joining_date = datetime.strptime(request["joining_date"], "%Y-%m-%d").date()
        except:
            joining_date = None

    offer = OfferLetter(
        application_id=application_id,
        candidate_name=candidate.name,
        job_title=job.title,
        department=job.department,
        location=request.get("location") or job.location or "Not specified",
        ctc=request.get("ctc", 0),
        basic_percent=request.get("basic_percent", 40),
        hra_percent=request.get("hra_percent", 20),
        joining_date=joining_date,
        probation_period=request.get("probation_period", "3 Months"),
        notice_period=request.get("notice_period", "30 Days"),
        terms=request.get("terms"),
        document=request.get("email"),   # store candidate email temporarily
        offer_status="Draft"
    )

    db.add(offer)
    db.commit()
    db.refresh(offer)

    return offer


# =================================================================
#                         SEND OFFER EMAIL
# =================================================================
@router.post("/send/{offer_id}")
def send_offer(offer_id: int, user=Depends(get_current_user), files: Optional[List[UploadFile]] = File(None)):
    try:
        print(f"DEBUG: Sending offer for ID: {offer_id}")
        db = get_tenant_session(user)

        offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
        if not offer:
            raise HTTPException(404, "Offer not found")

        candidate = db.query(JobApplication).filter(JobApplication.id == offer.application_id).first()
        if not candidate:
            raise HTTPException(404, "Candidate not found")

        # Update status to Sent
        setattr(offer, 'offer_status', "Sent")
        db.commit()

        recipient_email = str(offer.document) if str(offer.document) else None
        print(f"DEBUG: Recipient email: {recipient_email}")

        if not recipient_email:
            raise HTTPException(400, "No email provided for candidate")

        # ---------------------------------------------------------------
        # PROFESSIONAL OFFER LETTER EMAIL TEMPLATE (NO VIEW PAGE REQUIRED)
        # ---------------------------------------------------------------
        html_content = f"""
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                
                <h2 style="color:#0D3B66;">Offer Letter – {offer.job_title}</h2>

                <p>Dear <strong>{candidate.name}</strong>,</p>

                <p>
                    We are pleased to offer you the position of 
                    <strong>{offer.job_title}</strong> in the 
                    <strong>{offer.department}</strong> department at Nutryah Hospital.
                </p>

                <p>Please find your offer details below:</p>

                <table style="border-collapse: collapse; width: 100%; margin-top: 10px;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc;"><strong>Job Title</strong></td>
                        <td style="padding: 8px; border: 1px solid #ccc;">{offer.job_title}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc;"><strong>Department</strong></td>
                        <td style="padding: 8px; border: 1px solid #ccc;">{offer.department}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc;"><strong>Location</strong></td>
                        <td style="padding: 8px; border: 1px solid #ccc;">{offer.location}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc;"><strong>CTC</strong></td>
                        <td style="padding: 8px; border: 1px solid #ccc;">₹{offer.ctc}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc;"><strong>Joining Date</strong></td>
                        <td style="padding: 8px; border: 1px solid #ccc;">{offer.joining_date or "Not Provided"}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc;"><strong>Probation Period</strong></td>
                        <td style="padding: 8px; border: 1px solid #ccc;">{offer.probation_period}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc;"><strong>Notice Period</strong></td>
                        <td style="padding: 8px; border: 1px solid #ccc;">{offer.notice_period}</td>
                    </tr>
                </table>

                <h3 style="margin-top: 20px;">Terms & Conditions</h3>
                <p>{offer.terms or "No additional terms provided."}</p>

                <hr style="margin-top: 30px;">

                <h3>Next Steps</h3>
                <p>
                    Kindly reply to this email with one of the options below:
                </p>

                <p>
                    ✔️ <strong>I ACCEPT the offer</strong><br>
                    ❌ <strong>I REJECT the offer</strong>
                </p>



                <br>
                <p>Regards,<br><strong>Nutryah HR Team</strong></p>
            </div>
        """

        # ---------------------------------------------------------------
        # SEND EMAIL WITH ATTACHMENTS
        # ---------------------------------------------------------------
        print(f"DEBUG: Attempting to send email to {recipient_email}")
        
        # Prepare attachments if files are uploaded
        attachments = []
        if files:
            for file in files:
                if file.filename:
                    attachments.append({
                        'filename': file.filename,
                        'content': file.file.read(),
                        'content_type': file.content_type
                    })
        
        send_result = send_email(
            recipient_email,
            f"Offer Letter – {offer.job_title}",
            html_content,
            attachments=attachments
        )
        print(f"DEBUG: Email send result: {send_result}")

        return {
            "email_sent": send_result,
            "recipient_email": recipient_email
        }

    except Exception as e:
        print(f"ERROR in send_offer: {str(e)}")
        raise HTTPException(500, f"Internal server error: {str(e)}")


# =================================================================
#                    MANUAL ACCEPT/REJECT BY HR
# =================================================================
@router.post("/manual-response/{offer_id}")
def manual_offer_response(offer_id: int, action: str, user=Depends(get_current_user)):
    
    db = get_tenant_session(user)
    
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(404, "Offer not found")
    
    candidate = db.query(JobApplication).filter(JobApplication.id == offer.application_id).first()
    
    if action == "accept":
        setattr(offer, 'offer_status', "Accepted")
        setattr(candidate, 'stage', "Offer Accepted")
    elif action == "reject":
        setattr(offer, 'offer_status', "Rejected")
        setattr(candidate, 'stage', "Offer Rejected")
    else:
        raise HTTPException(400, "Invalid action")
    
    db.commit()
    return {"message": f"Offer {action}ed successfully"}


# =================================================================
#                         GET OFFERS LIST
# =================================================================
@router.get("/list")
def get_offers(user=Depends(get_current_user)):
    
    db = get_tenant_session(user)
    
    offers = db.query(OfferLetter).all()
    result = []
    
    for offer in offers:
        candidate = db.query(JobApplication).filter(JobApplication.id == offer.application_id).first()
        bgv = db.query(BGV).filter(BGV.application_id == offer.application_id).first()
        
        result.append({
            "id": offer.id,
            "candidate_name": str(offer.candidate_name),
            "job_title": str(offer.job_title),
            "offer_status": str(offer.offer_status),
            "application_id": offer.application_id,
            "bgv_status": str(bgv.status) if bgv else None,
            "bgv_id": bgv.id if bgv else None
        })
    
    return result


# =================================================================
#                         BGV START
# =================================================================
@router.post("/bgv/start/{candidate_id}")
def start_bgv(candidate_id: int, user=Depends(get_current_user)):

    db = get_tenant_session(user)

    bgv = BGV(application_id=candidate_id, status="Pending")
    db.add(bgv)
    db.commit()

    return {"message": "BGV started"}


# =================================================================
#                         BGV UPDATE
# =================================================================
@router.put("/bgv/update/{bgv_id}")
def update_bgv(bgv_id: int, request: dict, user=Depends(get_current_user)):

    db = get_tenant_session(user)

    bgv = db.query(BGV).filter(BGV.id == bgv_id).first()
    if not bgv:
        raise HTTPException(404, "BGV record not found")

    setattr(bgv, 'status', request.get('status', 'Pending'))
    setattr(bgv, 'remarks', request.get('remarks', ''))
    setattr(bgv, 'agency_name', request.get('agency_name', ''))
    db.commit()

    return {"message": "BGV updated"}


# =================================================================
#                         GET BGV DETAILS
# =================================================================
@router.get("/bgv/{bgv_id}")
def get_bgv(bgv_id: int, user=Depends(get_current_user)):
    
    db = get_tenant_session(user)
    
    bgv = db.query(BGV).filter(BGV.id == bgv_id).first()
    if not bgv:
        raise HTTPException(404, "BGV not found")
    
    return {
        "id": bgv.id,
        "application_id": bgv.application_id,
        "status": str(bgv.status),
        "remarks": str(bgv.remarks) if str(bgv.remarks) else "",
        "agency_name": str(bgv.agency_name) if hasattr(bgv, 'agency_name') and str(bgv.agency_name) else ""
    }


# =================================================================
#                         TEST EMAIL
# =================================================================
@router.get("/test-email")
def test_email(email: str, user=Depends(get_current_user)):

    print(f"Sending test email to: {email}")
    result = send_email(email, "Test Email", "<h2>This is a test email from Nutryah HRM</h2>")

    return {
        "success": result,
        "message": "Email sent successfully" if result else "Email failed to send"
    }
