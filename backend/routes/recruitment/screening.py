from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud
from models.models_tenant import PublicCandidate, Candidate, JobRequisition
from datetime import datetime
from database import logger
from utils.email import send_email
import html

router = APIRouter(prefix="/recruitment/screening", tags=["Candidate Screening"])


# ----------------------------------------------------------
# DEBUG: CHECK DATA CONSISTENCY
# ----------------------------------------------------------
@router.get("/debug/data-check")
def debug_data_check(db: Session = Depends(get_tenant_db)):
    """Debug endpoint to check data consistency between PublicCandidate and Candidate tables"""
    
    # Get all public candidates
    public_candidates = db.query(PublicCandidate).all()
    
    # Get all ATS candidates
    ats_candidates = db.query(Candidate).all()
    
    # Get all jobs
    jobs = db.query(JobRequisition).all()
    
    return {
        "public_candidates": [{
            "id": pc.id,
            "name": pc.name,
            "email": pc.email,
            "job_id": pc.job_id,
            "applied_at": pc.applied_at
        } for pc in public_candidates],
        "ats_candidates": [{
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "job_id": c.job_id,
            "stage": c.stage,
            "created_at": c.created_at
        } for c in ats_candidates],
        "jobs": [{
            "id": j.id,
            "title": j.title,
            "department": j.department
        } for j in jobs]
    }


# ----------------------------------------------------------
# DEBUG: FIX DATA INCONSISTENCIES
# ----------------------------------------------------------
@router.post("/debug/fix-data")
def fix_data_inconsistencies(request: Request, db: Session = Depends(get_tenant_db)):
    """Fix data inconsistencies by correcting job_id mappings"""
    
    fixed_count = 0
    
    # Get all ATS candidates with potentially wrong job_ids
    ats_candidates = db.query(Candidate).all()
    
    for ats_candidate in ats_candidates:
        # Find corresponding public candidate by email
        public_candidate = db.query(PublicCandidate).filter(
            PublicCandidate.email == ats_candidate.email
        ).first()
        
        if public_candidate and public_candidate.job_id != ats_candidate.job_id:
            logger.info(f"Fixing job_id for {ats_candidate.name}: {ats_candidate.job_id} -> {public_candidate.job_id}")
            ats_candidate.job_id = public_candidate.job_id
            fixed_count += 1
    
    db.commit()
    audit_crud(request, "tenant_db", {"email": "system"}, "UPDATE", "candidate_data_fix", None, None, {"fixed_count": fixed_count})
    
    return {
        "message": f"Fixed {fixed_count} data inconsistencies",
        "fixed_count": fixed_count
    }


# ----------------------------------------------------------
# GET PENDING APPLICATIONS FOR REVIEW
# ----------------------------------------------------------
@router.get("/pending/{job_id}")
def get_pending_applications(job_id: int, db: Session = Depends(get_tenant_db)):
    """Get all pending applications for a specific job"""
    
    # Get job details
    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get pending applications
    applications = db.query(PublicCandidate).filter(
        PublicCandidate.job_id == job_id
    ).all()
    
    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "department": job.department,
            "skills": job.skills or [],
            "experience": job.experience
        },
        "applications": [{
            "id": app.id,
            "name": app.name,
            "email": app.email,
            "phone": app.phone,
            "experience": app.experience,
            "skills": app.skills,
            "resume_url": app.resume_url,
            "applied_at": app.applied_at,
            "match_score": calculate_match_score(app, job)
        } for app in applications]
    }


# ----------------------------------------------------------
# SHORTLIST CANDIDATES WITH INTERVIEW SCHEDULING
# ----------------------------------------------------------
from pydantic import BaseModel
from typing import List

class InterviewSchedule(BaseModel):
    candidate_id: int
    interview_date: str
    interview_time: str

@router.post("/shortlist-with-interviews")
def shortlist_candidates_with_interviews(
    schedules: List[InterviewSchedule],
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    """Shortlist candidates with interview scheduling and email notifications"""
    
    logger.info(f"📥 Received {len(schedules)} interview schedules")
    for i, schedule in enumerate(schedules):
        logger.info(f"Schedule {i+1}: candidate_id={schedule.candidate_id}, date={schedule.interview_date}, time={schedule.interview_time}")
    
    shortlisted_count = 0
    
    for schedule in schedules:
        try:
            # Get public candidate
            logger.info(f"🔍 Looking for candidate ID: {schedule.candidate_id}")
            public_candidate = db.query(PublicCandidate).filter(
                PublicCandidate.id == schedule.candidate_id
            ).first()
            
            if not public_candidate:
                logger.warning(f"⚠️ Candidate ID {schedule.candidate_id} not found in PublicCandidate table")
                continue
            
            logger.info(f"✅ Found candidate: {public_candidate.name} ({public_candidate.email}) for job_id: {public_candidate.job_id}")
                
            # Get job details for email
            job = db.query(JobRequisition).filter(
                JobRequisition.id == public_candidate.job_id
            ).first()
            
            if not job:
                logger.warning(f"⚠️ Job ID {public_candidate.job_id} not found")
                continue
                
            # Check if already in ATS (by email AND job_id to avoid duplicates)
            existing = db.query(Candidate).filter(
                Candidate.job_id == public_candidate.job_id,
                Candidate.email == public_candidate.email
            ).first()
            
            if existing:
                logger.info(f"🔄 Updating existing ATS candidate: {public_candidate.email} for job {public_candidate.job_id}")
                # Update existing candidate with new interview details
                existing.interview_date = datetime.strptime(f"{schedule.interview_date} {schedule.interview_time}", "%Y-%m-%d %H:%M")
                existing.interview_time = schedule.interview_time
                existing.stage = "Shortlisted"
                existing.current_round = 1
            else:
                logger.info(f"➕ Creating new ATS candidate: {public_candidate.email} for job {public_candidate.job_id}")
                # Create ATS candidate with CORRECT job_id
                ats_candidate = Candidate(
                    job_id=public_candidate.job_id,  # CRITICAL: Use the job_id from public_candidate
                    name=public_candidate.name,
                    email=public_candidate.email,
                    phone=public_candidate.phone,
                    experience=int(public_candidate.experience or 0),
                    resume_url=public_candidate.resume_url,
                    stage="Shortlisted",
                    current_round=1,
                    completed_rounds=[],
                    interview_date=datetime.strptime(f"{schedule.interview_date} {schedule.interview_time}", "%Y-%m-%d %H:%M"),
                    interview_time=schedule.interview_time,
                    created_at=datetime.now()
                )
                
                db.add(ats_candidate)
                logger.info(f"✅ Added candidate {public_candidate.name} to ATS for job_id {public_candidate.job_id}")
            
            # Send shortlist email
            send_shortlist_email(
                candidate_name=public_candidate.name,
                candidate_email=public_candidate.email,
                job_title=job.title,
                company_name="NUTRYAH",
                interview_date=schedule.interview_date,
                interview_time=schedule.interview_time,
                round_names=job.round_names or []
            )
            
            shortlisted_count += 1
            
        except Exception as e:
            logger.error(f"❌ Error processing candidate {schedule.candidate_id}: {str(e)}")
            continue
    
    try:
        db.commit()
        logger.info(f"✅ Database committed successfully. Shortlisted {shortlisted_count} candidates")
    except Exception as e:
        logger.error(f"❌ Database commit failed: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to commit shortlisting changes")
    
    audit_crud(request, "tenant_db", {"email": "system"}, "CREATE", "candidate_shortlist", None, None, {"count": shortlisted_count})
    
    logger.info(f"Shortlisted {shortlisted_count} candidates with interviews scheduled")
    
    return {
        "message": f"Successfully shortlisted {shortlisted_count} candidates with interview invitations sent",
        "count": shortlisted_count
    }


# ----------------------------------------------------------
# TEST EMAIL ENDPOINT
# ----------------------------------------------------------
@router.post("/test-email")
def test_email_sending(email: str = "test@example.com"):
    """Test email sending functionality"""
    try:
        success = send_email(
            to_email=email,
            subject="Test Email from NUTRYAH HRM",
            html_content="""<h2>Test Email</h2><p>This is a test email to verify SMTP configuration is working correctly.</p>"""
        )
        
        if success:
            return {"message": f"Test email sent successfully to {email}"}
        else:
            return {"message": f"Failed to send test email to {email}"}
            
    except Exception as e:
        logger.error(f"Test email failed: {str(e)}")
        return {"message": f"Test email failed: {str(e)}"}


# ----------------------------------------------------------
# CALCULATE MATCH SCORE
# ----------------------------------------------------------
def send_shortlist_email(candidate_name, candidate_email, job_title, company_name, interview_date, interview_time, round_names):
    """Send professional shortlist email to candidate"""
    try:
        # Format round names - handle different data structures
        rounds_text = ""
        first_round_name = "Interview"
        
        if round_names:
            if isinstance(round_names, list) and len(round_names) > 0:
                # Handle array of objects [{name: "Tech Round", description: "..."}, ...]
                if isinstance(round_names[0], dict) and 'name' in round_names[0]:
                    rounds_list = [f"{i+1}. {round_info['name']}" for i, round_info in enumerate(round_names)]
                    first_round_name = round_names[0]['name']
                # Handle simple array ["Tech Round", "HR Round"]
                else:
                    rounds_list = [f"{i+1}. {round_name}" for i, round_name in enumerate(round_names)]
                    first_round_name = round_names[0]
                rounds_text = "<br>".join(rounds_list)
            # Handle object format {1: "Tech Round", 2: "HR Round"}
            elif isinstance(round_names, dict):
                rounds_list = [f"{key}. {value}" for key, value in round_names.items()]
                rounds_text = "<br>".join(rounds_list)
                first_round_name = list(round_names.values())[0] if round_names else "Interview"
        
        if not rounds_text:
            rounds_text = "1. Technical Round<br>2. HR Round"
            first_round_name = "Technical Round"
        
        # Email content
        subject = f"Congratulations! You've been shortlisted for {job_title} position"
        
        html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
        .section {{ margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🎉 Congratulations! You've been shortlisted</h2>
        </div>
        
        <p>Dear <strong>{candidate_name}</strong>,</p>
        
        <p>Congratulations! We are pleased to inform you that you have been shortlisted for the <strong>{job_title}</strong> position at <strong>{company_name}</strong>.</p>
        
        <p>After reviewing your application and resume, we believe you would be a great fit for our team. We would like to invite you for the first round of interviews.</p>
        
        <div class="section">
            <h3>📅 ROUND 1 INTERVIEW DETAILS:</h3>
            <p><strong>Round:</strong> {first_round_name}<br>
            <strong>Date:</strong> {interview_date}<br>
            <strong>Time:</strong> {interview_time}<br>
            <strong>Mode:</strong> We will share the interview link/location details shortly</p>
        </div>
        
        <div class="section">
            <h3>📋 COMPLETE INTERVIEW PROCESS:</h3>
            <p>The selection process will consist of the following rounds:</p>
            <p>{rounds_text}</p>
        </div>
        
        <div class="section">
            <h3>✅ NEXT STEPS:</h3>
            <ol>
                <li>Please confirm your availability for the scheduled Round 1 interview</li>
                <li>If you need to reschedule, please reply to this email with your preferred dates and times</li>
                <li>Prepare for the <strong>{first_round_name}</strong> as mentioned above</li>
                <li>Bring a copy of your updated resume</li>
                <li>Further rounds will be scheduled based on your performance</li>
            </ol>
        </div>
        
        <div class="section">
            <h3>📞 RESCHEDULING:</h3>
            <p>If the scheduled time doesn't work for you, please reply to this email with:</p>
            <ul>
                <li>Your preferred dates (at least 3 options)</li>
                <li>Your preferred time slots</li>
                <li>Any specific requirements or constraints</li>
            </ul>
        </div>
        
        <p>We look forward to meeting you and learning more about your experience and skills.</p>
        
        <p><strong>Best regards,</strong><br>
        HR Team<br>
        {company_name}</p>
        
        <div class="footer">
            <p>This is an automated email. Please reply if you need any assistance or have questions.</p>
        </div>
    </div>
</body>
</html>"""
        
        # Send actual email
        success = send_email(
            to_email=candidate_email,
            subject=subject,
            html_content=html_body
        )
        
        if success:
            logger.info(f"✅ Shortlist email sent successfully to {candidate_email}")
        else:
            logger.error(f"❌ Failed to send shortlist email to {candidate_email}")
            
        return success
        
    except Exception as e:
        logger.error(f"Failed to send shortlist email to {candidate_email}: {str(e)}")
        return False


def calculate_match_score(candidate, job):
    """Calculate how well candidate matches job requirements"""
    score = 0
    
    # Skills matching
    if job.skills and candidate.skills:
        try:
            # Handle job skills (could be JSON array or list)
            if isinstance(job.skills, list):
                job_skills = [skill.lower().strip() for skill in job.skills]
            else:
                job_skills = [skill.lower().strip() for skill in str(job.skills).split(',')]
            
            # Handle candidate skills (could be comma-separated string or JSON)
            candidate_skills_str = str(candidate.skills).strip()
            if candidate_skills_str.startswith('[') and candidate_skills_str.endswith(']'):
                # Try to parse as JSON array
                import json
                try:
                    candidate_skills_list = json.loads(candidate_skills_str)
                    candidate_skills = [skill.lower().strip() for skill in candidate_skills_list]
                except:
                    candidate_skills = [skill.lower().strip() for skill in candidate_skills_str.split(',')]
            else:
                # Treat as comma-separated string
                candidate_skills = [skill.lower().strip() for skill in candidate_skills_str.split(',')]
            
            # Remove empty strings
            job_skills = [skill for skill in job_skills if skill]
            candidate_skills = [skill for skill in candidate_skills if skill]
            
            # Calculate matching skills
            if job_skills:
                matching_skills = set(job_skills) & set(candidate_skills)
                skills_score = (len(matching_skills) / len(job_skills)) * 60
                score += skills_score
                logger.info(f"Skills matching: Job skills: {job_skills}, Candidate skills: {candidate_skills}, Matching: {matching_skills}, Score: {skills_score}")
        except Exception as e:
            logger.error(f"Error in skills matching: {str(e)}")
    
    # Experience matching
    if job.experience_years and candidate.experience:
        try:
            # Use the specific experience_years field from job
            job_exp = job.experience_years
            
            # Extract numbers from candidate experience
            candidate_exp_str = str(candidate.experience).strip()
            candidate_exp_numbers = [int(x) for x in candidate_exp_str.split() if x.isdigit()]
            candidate_exp = candidate_exp_numbers[0] if candidate_exp_numbers else 0
            
            logger.info(f"Experience matching: Job exp: {job_exp}, Candidate exp: {candidate_exp}")
            
            if job_exp > 0:  # Only calculate if job has experience requirement
                if candidate_exp >= job_exp:
                    score += 40
                elif candidate_exp >= job_exp * 0.8:
                    score += 30
                elif candidate_exp >= job_exp * 0.6:
                    score += 20
                elif candidate_exp >= job_exp * 0.4:
                    score += 10
        except Exception as e:
            logger.error(f"Error in experience matching: {str(e)}")
    
    final_score = min(int(score), 100)
    logger.info(f"Final match score for candidate {candidate.name}: {final_score}%")
    return final_score