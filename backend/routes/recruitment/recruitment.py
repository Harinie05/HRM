from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_tenant_db
from utils.audit_logger import audit_crud
from models.models_tenant import JobRequisition
from schemas.schemas_tenant import (
    JobReqCreate,
    JobReqUpdate,
    JobReqOut
)
from routes.hospital import get_current_user
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
def create_job(req: JobReqCreate, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
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
    
    # Audit log with actual user
    audit_crud(request, db, user, "CREATE_JOB_REQUISITION", "job_requisitions", str(job.id), {}, {"title": req.title, "department": req.department})

    # After commit → we now have job.id
    setattr(job, 'apply_url', generate_apply_url(getattr(job, 'id')))
    db.commit()

    return job


# ----------------------------------------------------------
# UPDATE JOB REQUISITION
# ----------------------------------------------------------
@router.put("/update/{job_id}", response_model=JobReqOut)
def update_job(job_id: int, req: JobReqUpdate, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    update_data = req.dict(exclude_unset=True)
    old_values = job.__dict__.copy()

    for key, val in update_data.items():
        setattr(job, key, val)

    setattr(job, 'updated_at', datetime.now())

    db.commit()
    db.refresh(job)
    
    # Audit log with proper parameters
    audit_crud(request, db, user, "UPDATE_JOB_REQUISITION", "job_requisitions", str(job_id), {"title": old_values.get('title')}, {"title": getattr(job, 'title')})

    return job





# ----------------------------------------------------------
# UPLOAD ATTACHMENT (JD PDF or Job Description File)
# ----------------------------------------------------------
@router.post("/upload-attachment/{job_id}")
def upload_attachment(job_id: int, file: UploadFile = File(...), request: Request = None, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):

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
    
    if request:
        audit_crud(request, db, user, "UPLOAD_JOB_ATTACHMENT", "job_requisitions", str(job_id), {}, {"filename": filename})

    return {"message": "Attachment uploaded", "filename": filename}


# ----------------------------------------------------------
# GET ALL JOBS
# ----------------------------------------------------------
@router.get("/list", response_model=List[JobReqOut])
def list_jobs(request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    audit_crud(request, db, user, "VIEW_JOB_REQUISITIONS", "job_requisitions", "all", {}, {})
    # Force refresh from database
    db.commit()  # Ensure any pending changes are committed
    jobs = db.query(JobRequisition).order_by(JobRequisition.created_at.desc()).all()
    return jobs


# ----------------------------------------------------------
# GET SINGLE JOB DETAILS
# ----------------------------------------------------------
@router.get("/view/{job_id}", response_model=JobReqOut)
def view_job(job_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    audit_crud(request, db, user, "VIEW_JOB_REQUISITION", "job_requisitions", str(job_id), {}, {"job_id": job_id})
    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job





# ----------------------------------------------------------
# UPDATE JOB STATUS (ACTIVATE/DEACTIVATE)
# ----------------------------------------------------------
@router.put("/update-status/{job_id}")
def update_job_status(job_id: int, status_data: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    old_status = job.status
    setattr(job, 'status', status_data.get('status', 'Active'))
    setattr(job, 'updated_at', datetime.now())
    
    db.commit()
    db.refresh(job)
    
    # Audit log with actual user
    audit_crud(request, db, user, "UPDATE_JOB_STATUS", "job_requisitions", str(job_id), {"status": old_status}, {"status": job.status})
    
    return {"message": f"Job status updated to {status_data.get('status')}", "status": job.status}

# ----------------------------------------------------------
# DELETE JOB REQUISITION
# ----------------------------------------------------------
@router.delete("/delete/{job_id}")
def delete_job(job_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    old_values = job.__dict__.copy()
    db.delete(job)
    db.commit()
    
    # Audit log with proper parameters
    audit_crud(request, db, user, "DELETE_JOB_REQUISITION", "job_requisitions", str(job_id), {"title": old_values.get('title')}, {})
    
    return {"message": "Job requisition deleted successfully"}


# ----------------------------------------------------------
# GENERATE PUBLIC APPLY LINK
# ----------------------------------------------------------
@router.post("/generate-link/{job_id}")
def generate_job_link(job_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Generate public apply URL
    apply_url = f"http://localhost:3000/apply/{job_id}"
    
    # Update job with apply URL
    setattr(job, 'apply_url', apply_url)
    db.commit()
    
    audit_crud(request, db, user, "GENERATE_JOB_LINK", "job_requisitions", str(job_id), {}, {"apply_url": apply_url})
    
    return {"url": apply_url, "message": "Apply link generated successfully"}






