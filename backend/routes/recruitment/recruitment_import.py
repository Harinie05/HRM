from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime
import shutil
import os
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

from database import get_tenant_db
from models.models_tenant import ImportedCandidate, JobRequisition, ATSCandidate

router = APIRouter(prefix="/recruitment", tags=["Candidate Import"])


# -------------------------------
# 1️⃣ UPLOAD RESUME FILE
# -------------------------------
@router.post("/import/upload-resume")
async def upload_resume(file: UploadFile = File(...), request: Request = None, user = Depends(get_current_user)):
    upload_dir = "uploads/resumes/"
    os.makedirs(upload_dir, exist_ok=True)

    filename = file.filename or "resume.pdf"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    resume_url = f"/static/resumes/{filename}"  # adjust if you use CDN
    
    if request:
        from database import get_tenant_db
        db = next(get_tenant_db())
        audit_crud(request, db, user, "UPLOAD_RESUME", "resume_uploads", filename, {}, {"filename": filename})

    return {"resume_url": resume_url}


# -------------------------------
# 2️⃣ SAVE CANDIDATE IN DATABASE
# -------------------------------
@router.post("/import-candidate")
async def import_candidate(data: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):

    job = db.query(JobRequisition).filter(JobRequisition.id == data["job_id"]).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    new_cand = ImportedCandidate(
        job_id=data["job_id"],
        job_title=job.title,
        name=data["name"],
        email=data["email"],
        phone=data["phone"],
        experience=data["experience"],
        skills=data["skills"],
        resume_url=data.get("resume_url", None),
        created_at=datetime.now()
    )

    db.add(new_cand)
    db.commit()
    db.refresh(new_cand)

    # ALSO push into ATS automatically → stage = New
    ats_entry = ATSCandidate(
        job_id=data["job_id"],
        candidate_id=new_cand.id,
        name=data["name"],
        email=data["email"],
        phone=data["phone"],
        experience=data["experience"],
        stage="New",
        resume=new_cand.resume_url,
        created_at=datetime.now()
    )

    db.add(ats_entry)
    db.commit()
    
    audit_crud(request, db, user, "IMPORT_CANDIDATE", "imported_candidates", str(new_cand.id), {}, {"name": data["name"], "email": data["email"]})

    return {"message": "Candidate imported & added to ATS", "candidate": new_cand.id}


# -------------------------------
# 3️⃣ LIST IMPORTED CANDIDATES
# -------------------------------
@router.get("/import/list")
def list_imported(request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    audit_crud(request, db, user, "VIEW_IMPORTED_CANDIDATES", "imported_candidates", "all", {}, {})
    data = db.query(ImportedCandidate).order_by(ImportedCandidate.id.desc()).all()
    return data
