from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_master_db, get_tenant_engine, logger
from models.models_master import Hospital
from models.models_tenant import JobRequisition
from schemas.schemas_tenant import JobReqCreate, JobReqOut
from routes.hospital import get_current_user
from typing import List


router = APIRouter(prefix="/recruitment", tags=["Recruitment"])


# ---------------- TENANT SESSION ----------------
def get_tenant_session(user):
    tenant_db = user.get("tenant_db")
    master_db = next(get_master_db())
    hospital = master_db.query(Hospital).filter(Hospital.db_name == tenant_db).first()

    if not hospital:
        raise HTTPException(404, "Hospital not found")

    engine = get_tenant_engine(str(hospital.db_name))
    return Session(bind=engine)


# ================= CREATE =================
@router.post("/jobs/create", response_model=JobReqOut)
def create_job(data: JobReqCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[JOB CREATE] {data.title}")

    job = JobRequisition(
        **data.dict(exclude={"skills"}),
        skills=",".join(data.skills)
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    skills_value = job.skills
    skills_list = skills_value.split(",") if skills_value not in (None, "") else []
    return JobReqOut.model_validate(job.__dict__ | {"skills": skills_list})


# ================= LIST =================
@router.get("/jobs/list", response_model=List[JobReqOut])
def list_jobs(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    jobs = db.query(JobRequisition).order_by(JobRequisition.id.desc()).all()

    results = []
    for j in jobs:
        skills_value = j.skills
        skills_list = skills_value.split(",") if skills_value not in (None, "") else []
        results.append(JobReqOut.model_validate(j.__dict__ | {"skills": skills_list}))

    return results


# ================= UPDATE =================
@router.put("/jobs/update/{id}", response_model=JobReqOut)
def update_job(id: int, data: JobReqCreate, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    job = db.query(JobRequisition).filter(JobRequisition.id == id).first()

    if not job:
        raise HTTPException(404, "Job not found")

    update = data.dict()
    update["skills"] = ",".join(update["skills"])

    for k, v in update.items():
        setattr(job, k, v)

    db.commit()
    db.refresh(job)

    skills_value = job.skills
    skills_list = skills_value.split(",") if skills_value not in (None, "") else []
    return JobReqOut.model_validate(job.__dict__ | {"skills": skills_list})


# ================= DELETE =================
@router.delete("/jobs/delete/{id}")
def delete_job(id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    job = db.query(JobRequisition).filter(JobRequisition.id == id).first()

    if not job:
        raise HTTPException(404, "Job not found")

    db.delete(job)
    db.commit()
    return {"message": "Job Requisition Deleted"}


# ================= POST JOB =================
@router.put("/jobs/post/{id}")
def post_job(id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    job = db.query(JobRequisition).filter(JobRequisition.id == id).first()

    if not job:
        raise HTTPException(404, "Job not found")

    setattr(job, "status", "Posted")
    db.commit()
    return {"message": "Job Posted Successfully"}
