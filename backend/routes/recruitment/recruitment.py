from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_tenant_db
from models.models_tenant import JobRequisition
from schemas.schemas_tenant import (
    JobReqCreate,
    JobReqUpdate,
    JobReqOut
)
import uuid
import os
from datetime import datetime
from database import logger

router = APIRouter(prefix="/recruitment", tags=["Recruitment"])

UPLOAD_DIR = "uploads/recruitment"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ----------------------------------------------------------
# Utility: Generate public apply URL
# ----------------------------------------------------------
def generate_apply_url(job_id: int):
    return f"https://yourdomain.com/careers/apply/{job_id}"


# ----------------------------------------------------------
# CREATE JOB REQUISITION
# ----------------------------------------------------------
from fastapi import Request

@router.post("/create-debug")
async def debug_create_job(request: Request):
    body = await request.body()
    logger.info(f"Raw request body: {body.decode()}")
    return {"received": body.decode()}

@router.post("/create", response_model=JobReqOut)
def create_job(req: JobReqCreate, db: Session = Depends(get_tenant_db)):
    logger.info(f"Creating job with data: {req.dict()}")

    job = JobRequisition(
        title=req.title,
        department=req.department,
        hiring_manager=req.hiring_manager,

        openings=req.openings,
        experience=req.experience,
        salary_range=req.salary_range,
        job_type=req.job_type,
        work_mode=req.work_mode,
        location=req.location,

        rounds=req.rounds,
        round_names=req.round_names,
        jd_text=req.jd_text,
        skills=req.skills,

        description=req.description,
        deadline=req.deadline,

        created_at=datetime.now(),
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    # After commit → we now have job.id
    setattr(job, 'apply_url', generate_apply_url(getattr(job, 'id')))
    db.commit()

    return job


# ----------------------------------------------------------
# UPDATE JOB REQUISITION
# ----------------------------------------------------------
@router.put("/update/{job_id}", response_model=JobReqOut)
def update_job(job_id: int, req: JobReqUpdate, db: Session = Depends(get_tenant_db)):

    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    update_data = req.dict(exclude_unset=True)

    for key, val in update_data.items():
        setattr(job, key, val)

    setattr(job, 'updated_at', datetime.now())

    db.commit()
    db.refresh(job)

    return job


# ----------------------------------------------------------
# UPLOAD ATTACHMENT (JD PDF or Job Description File)
# ----------------------------------------------------------
@router.post("/upload-attachment/{job_id}")
def upload_attachment(job_id: int, file: UploadFile = File(...), db: Session = Depends(get_tenant_db)):

    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    file_ext = file.filename.split(".")[-1] if file.filename else "txt"
    filename = f"JD_{job_id}_{uuid.uuid4().hex}.{file_ext}"

    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(file.file.read())

    setattr(job, 'attachment', filename)
    db.commit()

    return {"message": "Attachment uploaded", "filename": filename}


# ----------------------------------------------------------
# GET ALL JOBS
# ----------------------------------------------------------
@router.get("/list", response_model=List[JobReqOut])
def list_jobs(db: Session = Depends(get_tenant_db)):
    # Force refresh from database
    db.commit()  # Ensure any pending changes are committed
    jobs = db.query(JobRequisition).order_by(JobRequisition.created_at.desc()).all()
    return jobs


# ----------------------------------------------------------
# GET SINGLE JOB DETAILS
# ----------------------------------------------------------
@router.get("/view/{job_id}", response_model=JobReqOut)
def view_job(job_id: int, db: Session = Depends(get_tenant_db)):
    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job





# ----------------------------------------------------------
# GENERATE PUBLIC APPLY LINK
# ----------------------------------------------------------
@router.post("/generate-link/{job_id}")
def generate_job_link(job_id: int, db: Session = Depends(get_tenant_db)):
    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Generate public apply URL
    apply_url = f"http://localhost:3000/apply/{job_id}"
    
    # Update job with apply URL
    setattr(job, 'apply_url', apply_url)
    db.commit()
    
    return {"url": apply_url, "message": "Apply link generated successfully"}






