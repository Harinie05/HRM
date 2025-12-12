from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import JobRequisition, PublicCandidate, Candidate
import os
from datetime import datetime
import uuid

router = APIRouter(prefix="/recruitment/public", tags=["Public Apply"])

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# -------------------------------------------------------------
# GET JOB DETAILS FOR PUBLIC PAGE
# -------------------------------------------------------------
@router.get("/job/{job_id}")
def get_job_details(job_id: int, db: Session = Depends(get_tenant_db)):
    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "description": job.description,
        "skills": job.skills or [],
        "experience": job.experience,
        "location": job.location,
    }


# -------------------------------------------------------------
# PUBLIC APPLY ROUTE (Candidate fills form)
# -------------------------------------------------------------
@router.post("/apply/{job_id}")
def apply_to_job(
    job_id: int,
    name: str = Form(...),
    email: str = Form(""),
    phone: str = Form(""),
    experience: str = Form(""),
    skills: str = Form(""),
    resume: UploadFile = File(...),
    db: Session = Depends(get_tenant_db)
):
    from database import logger
    
    try:
        logger.info(f"Applying for job {job_id} - Name: {name}, Email: {email}")
        
        job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # ---- Save resume file ----
        ext = resume.filename.split(".")[-1] if resume.filename else "pdf"
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as buffer:
            buffer.write(resume.file.read())
        
        logger.info(f"Resume saved: {filename}")

        # ---- Save Public Candidate ----
        public = PublicCandidate(
            job_id=job_id,
            name=name,
            email=email,
            phone=phone,
            experience=experience,
            skills=skills,
            resume_url=filename,
        )

        db.add(public)
        db.commit()
        db.refresh(public)
        
        logger.info(f"Public candidate saved with ID: {public.id}")

        # Applications go to pending review, not directly to ATS
        logger.info(f"Application saved for HR review - Public ID: {public.id}")

        return {"message": "Application submitted successfully", "candidate_id": public.id}
        
    except Exception as e:
        logger.error(f"Error in apply_to_job: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Application failed: {str(e)}")
