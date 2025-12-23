from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_tenant_db
from utils.audit_logger import audit_crud
from typing import List, Optional
from pydantic import BaseModel
from models.models_tenant import (
    Candidate,
    JobRequisition,
    InterviewSchedule,
    ApplicationStageHistory,
    OfferLetter,
    OnboardingCandidate,
)
from schemas.schemas_tenant import (
    CandidateResponse,
    ResumeFilterRequest,
    ResumeFilterResponse,
    MoveStageRequest,
    InterviewScheduleCreate,
    InterviewScheduleResponse
)
import os
import uuid
from datetime import datetime

router = APIRouter(prefix="/ats", tags=["ATS"])

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ----------------------------------------------------------
# HELPER: Calculate Resume Score
# ----------------------------------------------------------
def calculate_score(candidate_exp, job_exp, candidate_skills, job_skills):
    score = 0

    # Experience match
    if isinstance(job_exp, str):
        try:
            job_exp = int(job_exp.split("-")[0])
        except:
            job_exp = 0

    if candidate_exp >= job_exp:
        score += 40
    else:
        score += (candidate_exp / job_exp) * 40 if job_exp > 0 else 0

    # Skill match
    if candidate_skills and job_skills:
        match = len(set(candidate_skills).intersection(set(job_skills)))
        total = len(job_skills)
        score += int((match / total) * 60)

    return min(score, 100)


# ----------------------------------------------------------
# CANDIDATE APPLY (VIA PUBLIC URL)
# ----------------------------------------------------------
@router.post("/apply/{job_id}", response_model=CandidateResponse)
def apply_candidate(
    job_id: int,
    name: str,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    experience: int = 0,
    resume: UploadFile = File(None),
    request: Request = None,
    db: Session = Depends(get_tenant_db)
):

    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    file_path = None

    # Save resume file
    file_name = None
    if resume and resume.filename:
        ext = resume.filename.split(".")[-1] if resume.filename else "txt"
        file_name = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)

        with open(file_path, "wb") as f:
            f.write(resume.file.read())

    # Create candidate entry
    candidate = Candidate(
        job_id=job_id,
        name=name,
        email=email or "",
        phone=phone or "",
        experience=experience,
        resume_url=file_name or "",
        stage="New",
        current_round=0,
        completed_rounds=[],
        created_at=datetime.now()
    )

    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    if request:
        audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "candidates", candidate.id, None, candidate.__dict__)

    return candidate


# ----------------------------------------------------------
# FILTER CANDIDATES BASED ON JD + EXPERIENCE + SKILLS
# ----------------------------------------------------------
@router.post("/filter", response_model=List[ResumeFilterResponse])
def filter_resumes(req: ResumeFilterRequest, db: Session = Depends(get_tenant_db)):

    job = db.query(JobRequisition).filter(JobRequisition.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    candidates = db.query(Candidate).filter(Candidate.job_id == req.job_id).all()

    results = []

    for c in candidates:
        candidate_skills = getattr(job, 'skills') or []
        score = calculate_score(
            candidate_exp=getattr(c, 'experience'),
            job_exp=getattr(job, 'experience'),
            candidate_skills=candidate_skills,
            job_skills=getattr(job, 'skills')
        )

        setattr(c, 'score', score)
        db.commit()

        if req.min_experience is not None and getattr(c, 'experience') < req.min_experience:
            continue

        results.append(c)

    # Sort by score
    sorted_list = sorted(results, key=lambda x: x.score, reverse=True)

    return sorted_list


# ----------------------------------------------------------
# MOVE CANDIDATE TO NEXT STAGE
# ----------------------------------------------------------
@router.put("/move-stage/{candidate_id}")
def move_stage(
    candidate_id: int,
    req: MoveStageRequest,
    request: Request,
    db: Session = Depends(get_tenant_db)
):

    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Record old stage
    history = ApplicationStageHistory(
        candidate_id=candidate_id,
        old_stage=getattr(c, 'stage') or "",
        new_stage=req.new_stage or ""
    )
    db.add(history)

    # Update pipeline
    setattr(c, 'stage', req.new_stage)

    if req.round_number is not None:
        setattr(c, 'current_round', req.round_number)
        completed_rounds = getattr(c, 'completed_rounds') or []
        if req.round_number not in completed_rounds:
            completed_rounds.append(req.round_number)
            setattr(c, 'completed_rounds', completed_rounds)

    # If interview scheduled
    if req.interview_date is not None:
        setattr(c, 'interview_date', req.interview_date)
        setattr(c, 'interview_time', req.interview_time)

    db.commit()
    db.refresh(c)
    audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "candidates", candidate_id, None, c.__dict__)

    return {"message": "Stage updated", "candidate": c}


# ----------------------------------------------------------
# SCHEDULE INTERVIEW FOR ROUND
# ----------------------------------------------------------
@router.post("/schedule-interview", response_model=InterviewScheduleResponse)
def schedule_interview(
    req: InterviewScheduleCreate,
    request: Request,
    db: Session = Depends(get_tenant_db)
):

    candidate = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
    job = db.query(JobRequisition).filter(JobRequisition.id == req.job_id).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Create schedule record
    schedule = InterviewSchedule(
        candidate_id=req.candidate_id,
        job_id=req.job_id,
        round_number=req.round_number,
        round_name=req.round_name,
        interview_date=req.interview_date,
        interview_time=req.interview_time,
        email_sent=True,  
        created_at=datetime.now()
    )

    db.add(schedule)

    # Update candidate stage
    setattr(candidate, 'stage', f"Round {req.round_number} Scheduled")
    setattr(candidate, 'current_round', req.round_number)

    db.commit()
    db.refresh(schedule)
    audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "interview_schedules", schedule.id, None, schedule.__dict__)

    return schedule


# ----------------------------------------------------------
# GET ALL JOBS FOR ATS
# ----------------------------------------------------------
@router.get("/jobs")
def get_jobs(db: Session = Depends(get_tenant_db)):
    jobs = db.query(JobRequisition).all()
    return jobs


# ----------------------------------------------------------
# GET ALL CANDIDATES FOR A JOB
# ----------------------------------------------------------
@router.get("/job/{job_id}", response_model=List[CandidateResponse])
def job_candidates(job_id: int, db: Session = Depends(get_tenant_db)):
    candidates = db.query(Candidate).filter(Candidate.job_id == job_id).all()
    return candidates


# ----------------------------------------------------------
# GET SINGLE CANDIDATE PROFILE
# ----------------------------------------------------------
@router.get("/candidate/{candidate_id}", response_model=CandidateResponse)
def candidate_profile(candidate_id: int, db: Session = Depends(get_tenant_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


# ----------------------------------------------------------
# MOVE CANDIDATE TO NEXT ROUND WITH EMAIL
# ----------------------------------------------------------
from utils.email import send_email
from database import logger

class MoveToNextRoundRequest(BaseModel):
    candidate_id: int
    next_round: int
    interview_date: str
    interview_time: str
    action: str  # "selected", "rejected", "next_round"
    custom_round_name: str = None

@router.post("/move-to-next-round")
def move_to_next_round(
    req: MoveToNextRoundRequest,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    """Move candidate to next round and send email notification"""
    try:
        # Get candidate
        candidate = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Get job details
        job = db.query(JobRequisition).filter(JobRequisition.id == candidate.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Update candidate status
        if req.action == "selected":
            setattr(candidate, 'stage', "Selected")
            round_names = getattr(job, 'round_names') or []
            setattr(candidate, 'current_round', len(round_names) + 1)
            
            # Create offer letter and onboarding record
            create_offer_and_onboarding(candidate, job, db)
            
        elif req.action == "rejected":
            setattr(candidate, 'stage', "Rejected")
            
            # Send rejection email
            send_rejection_email(candidate, job)
        elif req.action == "next_round":
            setattr(candidate, 'stage', f"Round {req.next_round} Scheduled")
            setattr(candidate, 'current_round', req.next_round)
            setattr(candidate, 'interview_date', datetime.strptime(f"{req.interview_date} {req.interview_time}", "%Y-%m-%d %H:%M"))
            setattr(candidate, 'interview_time', req.interview_time)
        
        db.commit()
        
        # Send email notification
        if req.action in ["selected", "next_round"]:
            send_round_notification_email(
                candidate=candidate,
                job=job,
                action=req.action,
                next_round=req.next_round if req.action == "next_round" else None,
                interview_date=req.interview_date if req.action == "next_round" else None,
                interview_time=req.interview_time if req.action == "next_round" else None
            )
        
        return {"message": f"Candidate {req.action} successfully", "candidate": candidate}
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error in move_to_next_round: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process candidate action: {str(e)}")


def create_offer_and_onboarding(candidate, job, db):
    """Create offer letter and onboarding record for selected candidate"""
    try:
        # Ensure department is never None
        department = "General"
        if job and job.department and job.department.strip():
            department = job.department
        
        # Create offer letter
        offer = OfferLetter(
            candidate_id=candidate.id,
            candidate_name=candidate.name,
            job_title=job.title,
            department=department,
            ctc=500000,  # Default CTC, can be updated later
            basic_percent=40,
            hra_percent=20,
            probation_period="3 Months",
            notice_period="30 Days",
            offer_status="Draft",
            terms="Standard terms and conditions apply."
        )
        db.add(offer)
        db.flush()  # Get the offer ID
        
        # Create onboarding record
        onboarding = OnboardingCandidate(
            application_id=candidate.id,
            candidate_name=candidate.name,
            job_title=job.title,
            department=department,
            work_shift="General",
            probation_period="3 Months",
            status="Pending Docs"
        )
        db.add(onboarding)
        
        logger.info(f"✅ Created offer and onboarding records for {candidate.name}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create offer/onboarding for {candidate.name}: {str(e)}")


def send_round_notification_email(candidate, job, action, next_round=None, interview_date=None, interview_time=None):
    """Send email notification for round progression"""
    try:
        round_names = job.round_names or []
        
        if action == "selected":
            subject = f"🎉 Congratulations! You've been selected for {job.title} position"
            html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #28a745; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }}
        .section {{ margin: 20px 0; padding: 15px; border-left: 4px solid #28a745; background: #f8f9fa; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🎉 Congratulations! You've been selected!</h2>
        </div>
        
        <p>Dear <strong>{candidate.name}</strong>,</p>
        
        <p>We are delighted to inform you that you have been <strong>selected</strong> for the <strong>{job.title}</strong> position at <strong>NUTRYAH</strong>!</p>
        
        <div class="section">
            <h3>✅ NEXT STEPS:</h3>
            <p>Our HR team will contact you shortly with the offer details and onboarding process.</p>
        </div>
        
        <p>Welcome to the NUTRYAH family!</p>
        
        <p><strong>Best regards,</strong><br>
        HR Team<br>
        NUTRYAH</p>
    </div>
</body>
</html>"""
        
        elif action == "next_round" and next_round:
            round_name = f"Round {next_round}"
            if isinstance(round_names, list) and len(round_names) >= next_round:
                if isinstance(round_names[next_round-1], dict):
                    round_name = f"Round {next_round} - {round_names[next_round-1].get('name', 'Interview')}"
                else:
                    round_name = f"Round {next_round} - {round_names[next_round-1]}"
            elif isinstance(round_names, dict) and str(next_round) in round_names:
                round_name = f"Round {next_round} - {round_names[str(next_round)]}"
            else:
                # Check if custom round name is provided for additional rounds
                if hasattr(req, 'custom_round_name') and req.custom_round_name:
                    round_name = f"Round {next_round} - {req.custom_round_name}"
                else:
                    round_name = f"Round {next_round} - Interview"
            
            subject = f"🎯 You've been selected for {round_name} - {job.title} position"
            html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #007bff; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }}
        .section {{ margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🎯 Round {next_round} Interview Scheduled</h2>
        </div>
        
        <p>Dear <strong>{candidate.name}</strong>,</p>
        
        <p>Congratulations! You have been selected for <strong>Round {next_round}</strong> of the interview process for the <strong>{job.title}</strong> position at <strong>NUTRYAH</strong>.</p>
        
        <div class="section">
            <h3>📅 ROUND {next_round} INTERVIEW DETAILS:</h3>
            <p><strong>Round:</strong> {round_name}<br>
            <strong>Date:</strong> {interview_date}<br>
            <strong>Time:</strong> {interview_time}<br>
            <strong>Mode:</strong> We will share the interview link/location details shortly</p>
        </div>
        
        <div class="section">
            <h3>📞 RESCHEDULING:</h3>
            <p>If the scheduled time doesn't work for you, please reply to this email with:</p>
            <ul>
                <li>Your preferred dates (at least 3 options)</li>
                <li>Your preferred time slots</li>
                <li>Any specific requirements</li>
            </ul>
        </div>
        
        <p>We look forward to meeting you in the next round!</p>
        
        <p><strong>Best regards,</strong><br>
        HR Team<br>
        NUTRYAH</p>
    </div>
</body>
</html>"""
        
        # Send email
        success = send_email(
            to_email=candidate.email,
            subject=subject,
            html_content=html_body
        )
        
        if success:
            logger.info(f"✅ Round notification email sent to {candidate.email}")
        else:
            logger.error(f"❌ Failed to send round notification to {candidate.email}")
            
    except Exception as e:
        logger.error(f"Failed to send round notification email: {str(e)}")


# Complete the incomplete function at the end
def send_rejection_email(candidate, job):
    """Send rejection email to candidate"""
    try:
        subject = f"Application Update - {job.title} Position"
        html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #dc3545; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }}
        .section {{ margin: 20px 0; padding: 15px; border-left: 4px solid #dc3545; background: #f8f9fa; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Application Status Update</h2>
        </div>
        
        <p>Dear <strong>{candidate.name}</strong>,</p>
        
        <p>Thank you for your interest in the <strong>{job.title}</strong> position at <strong>NUTRYAH</strong> and for taking the time to participate in our interview process.</p>
        
        <div class="section">
            <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current requirements.</p>
        </div>
        
        <p>We were impressed with your background and encourage you to apply for future opportunities that align with your skills and experience.</p>
        
        <p>We will keep your resume on file and will reach out if a suitable position becomes available.</p>
        
        <p>Thank you again for your time and interest in NUTRYAH.</p>
        
        <p><strong>Best regards,</strong><br>
        HR Team<br>
        NUTRYAH</p>
    </div>
</body>
</html>"""
        
        # Send email
        success = send_email(
            to_email=candidate.email,
            subject=subject,
            html_content=html_body
        )
        
        if success:
            logger.info(f"✅ Rejection email sent to {candidate.email}")
        else:
            logger.error(f"❌ Failed to send rejection email to {candidate.email}")
            
    except Exception as e:
        logger.error(f"Failed to send rejection email: {str(e)}")


def complete_function():
    """Placeholder function to complete the file"""
    pass
