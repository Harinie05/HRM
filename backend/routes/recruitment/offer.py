from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
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
import uuid
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


# Load BASE_URL from .env
BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
print(f"DEBUG: Loaded BASE_URL = {BASE_URL}")


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
def send_offer(offer_id: int, user=Depends(get_current_user)):
    try:
        print(f"DEBUG: Sending offer for ID: {offer_id}")
        db = get_tenant_session(user)

        offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
        if not offer:
            raise HTTPException(404, "Offer not found")

        candidate = db.query(JobApplication).filter(JobApplication.id == offer.application_id).first()
        if not candidate:
            raise HTTPException(404, "Candidate not found")

        # Create unique token
        token = str(uuid.uuid4())
        setattr(offer, 'token', token)
        setattr(offer, 'offer_status', "Sent")
        db.commit()
        print(f"DEBUG: Token created and offer status updated")

        # ---------------------------------------------------------------
        # HARD-CODED FRONTEND URL (NO .env REQUIRED)
        # ---------------------------------------------------------------
        FRONTEND_URL = "http://192.168.1.10:3000"    # 🔥 CHANGE THIS TO YOUR FRONTEND IP/DOMAIN
        offer_link = f"{FRONTEND_URL}/offer/view/{token}"
        print(f"DEBUG: Offer link: {offer_link}")
        # ---------------------------------------------------------------

        recipient_email = str(offer.document) if str(offer.document) else None
        print(f"DEBUG: Recipient email: {recipient_email}")

        if not recipient_email or recipient_email.strip() == "":
            raise HTTPException(400, "No email provided for candidate")

        # Email HTML Template
        html_content = f"""
            <h2>Hello {str(candidate.name)},</h2>
            <p>Congratulations! Your offer letter is ready.</p>
            <p>Please click below to view:</p>
            <a href="{offer_link}" 
               style="padding:10px 18px; background:#0D3B66; color:white; 
                      border-radius:6px; text-decoration:none;">
                View Offer Letter
            </a>
            <br/><br/>
            <p>Regards,<br/>Nutryah HR Team</p>
        """

        # Send using SMTP
        print(f"DEBUG: Attempting to send email to {recipient_email}")
        send_result = send_email(recipient_email, "Your Offer Letter", html_content)
        print(f"DEBUG: Email send result: {send_result}")

        return {
            "offer_link": offer_link,
            "email_sent": send_result,
            "recipient_email": recipient_email
        }
    except Exception as e:
        print(f"ERROR in send_offer: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Internal server error: {str(e)}")



# =================================================================
#               ACCEPT / REJECT OFFER
# =================================================================
@router.post("/respond/{token}")
def respond_offer(token: str, action: str):

    db = next(get_master_db())

    offer = db.query(OfferLetter).filter(OfferLetter.token == token).first()
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

    return {"message": f"Offer {action}ed successfully!"}


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
@router.put("/bgv/update/{candidate_id}")
def update_bgv(candidate_id: int, data: BGVUpdate, user=Depends(get_current_user)):

    db = get_tenant_session(user)

    bgv = db.query(BGV).filter(BGV.application_id == candidate_id).first()
    if not bgv:
        raise HTTPException(404, "BGV record not found")

    setattr(bgv, 'status', data.status)
    setattr(bgv, 'remarks', data.remarks)
    db.commit()

    return {"message": "BGV updated"}


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
