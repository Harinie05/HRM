from fastapi import APIRouter, HTTPException, Depends, Form
from sqlalchemy.orm import Session
from database import get_master_db, get_tenant_engine, logger

from models.models_master import Hospital
from models.models_tenant import JobApplication, ApplicationStageHistory, JobRequisition
from schemas.schemas_tenant import (
    ApplicationCreate,
    ApplicationOut,
    CandidateProfileOut,
    StageUpdate,
)
from routes.hospital import get_current_user
import traceback

router = APIRouter(prefix="/ats", tags=["ATS"])


def get_tenant_session(user):
    """
    Defensive tenant session getter. Raises clear HTTPException on problems.
    """
    if not user:
        logger.error("[TENANT SESSION] get_current_user returned None or falsy user")
        raise HTTPException(status_code=401, detail="Authentication required")

    tenant_db = user.get("tenant_db")
    if not tenant_db:
        logger.error(f"[TENANT SESSION] No tenant_db in user payload: {user}")
        raise HTTPException(status_code=400, detail="User missing tenant_db")

    master = next(get_master_db())
    hospital = master.query(Hospital).filter(Hospital.db_name == str(tenant_db)).first()
    if not hospital:
        logger.error(f"[TENANT SESSION] No hospital found for tenant_db: {tenant_db}")
        raise HTTPException(status_code=404, detail="Hospital (tenant) not found")

    engine = get_tenant_engine(hospital.db_name)
    return Session(bind=engine)


# Instrumented endpoints (wrap everything with try/except to log tracebacks)
@router.get("/jobs")
def ats_job_list(user=Depends(get_current_user)):
    try:
        db = get_tenant_session(user)

        jobs = db.query(JobRequisition).order_by(JobRequisition.id.desc()).all()

        results = []
        for job in jobs:
            apps = db.query(JobApplication).filter(JobApplication.job_id == job.id).all()

            count = {"New": 0, "Screening": 0, "Shortlisted": 0, "Interview": 0, "Selected": 0, "Rejected": 0}
            for a in apps:
                stage = str(a.stage)
                if stage in count:
                    count[stage] += 1

            results.append({"id": job.id, "title": job.title, "total": len(apps), **count})

        return results

    except HTTPException:
        # re-raise known HTTPExceptions so FastAPI returns the proper status code
        raise
    except Exception as e:
        tb = traceback.format_exc()
        logger.exception("[ATS /jobs] Unexpected error:\n" + tb)
        # return a helpful error message (avoid leaking sensitive internals)
        raise HTTPException(status_code=500, detail=f"Server error while loading ATS jobs. Check server logs.")


@router.get("/jobs/{job_id}/pipeline")
def ats_pipeline(job_id: int, user=Depends(get_current_user)):
    try:
        db = get_tenant_session(user)

        apps = db.query(JobApplication).filter(JobApplication.job_id == job_id).all()
        pipeline = {"New": [], "Screening": [], "Shortlisted": [], "Interview": [], "Selected": [], "Rejected": []}
        for a in apps:
            pipeline.setdefault(str(a.stage), []).append({"id": a.id, "name": a.name, "experience": a.experience, "resume": a.resume})
        return pipeline

    except HTTPException:
        raise
    except Exception:
        tb = traceback.format_exc()
        logger.exception("[ATS /jobs/{job_id}/pipeline] Unexpected error:\n" + tb)
        raise HTTPException(status_code=500, detail="Server error while loading pipeline.")


@router.get("/candidate/{id}", response_model=CandidateProfileOut)
def candidate_profile(id: int, user=Depends(get_current_user)):
    try:
        db = get_tenant_session(user)
        c = db.query(JobApplication).filter(JobApplication.id == id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return c
    except HTTPException:
        raise
    except Exception:
        tb = traceback.format_exc()
        logger.exception(f"[ATS /candidate/{id}] Unexpected error:\n" + tb)
        raise HTTPException(status_code=500, detail="Server error while loading candidate.")


@router.put("/candidate/{id}/stage")
def candidate_stage_change(id: int, data: StageUpdate, user=Depends(get_current_user)):
    try:
        db = get_tenant_session(user)
        c = db.query(JobApplication).filter(JobApplication.id == id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Candidate not found")

        old_stage = str(c.stage)
        setattr(c, 'stage', data.stage)
        history = ApplicationStageHistory(application_id=id, old_stage=old_stage, new_stage=data.stage)
        db.add(history)
        db.commit()

        logger.info(f"[ATS] Candidate {id} moved from {old_stage} → {data.stage}")
        return {"message": "Stage updated successfully"}

    except HTTPException:
        raise
    except Exception:
        tb = traceback.format_exc()
        logger.exception(f"[ATS /candidate/{id}/stage] Unexpected error:\n" + tb)
        raise HTTPException(status_code=500, detail="Server error while updating candidate stage.")


@router.get("/job/{job_id}")
def get_job_details(job_id: int):
    """Public endpoint to view job description"""
    try:
        from database import get_master_db
        from models.models_master import Hospital
        
        master = next(get_master_db())
        hospital = master.query(Hospital).first()
        if not hospital:
            raise HTTPException(status_code=500, detail="No tenant configured")
        
        engine = get_tenant_engine(hospital.db_name)
        db = Session(bind=engine)
        
        job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "id": job.id,
            "title": job.title,
            "department": job.department,
            "experience": job.experience,
            "salary_range": job.salary_range,
            "job_type": job.job_type,
            "work_mode": job.work_mode,
            "location": job.location,
            "skills": job.skills,
            "description": job.description,
            "openings": job.openings
        }
    except Exception:
        tb = traceback.format_exc()
        logger.exception("[ATS /job/{job_id}] Unexpected error:\n" + tb)
        raise HTTPException(status_code=500, detail="Server error while loading job details.")

@router.post("/apply")
def apply_job_public(
    job_id: str = Form(...),
    name: str = Form(...),
    email: str = Form(None),
    phone: str = Form(None),
    experience: str = Form("0")
):
    """Public endpoint for job applications - no auth required"""
    try:
        # Convert string inputs to proper types
        job_id_int = int(job_id)
        experience_int = int(experience) if experience else 0
        
        # Use a default tenant for public applications - you may need to adjust this
        from database import get_master_db
        from models.models_master import Hospital
        
        master = next(get_master_db())
        # Get the first hospital as default tenant for public applications
        hospital = master.query(Hospital).first()
        if not hospital:
            raise HTTPException(status_code=500, detail="No tenant configured")
        
        engine = get_tenant_engine(hospital.db_name)
        db = Session(bind=engine)
        
        new_app = JobApplication(
            job_id=job_id_int,
            name=name,
            email=email if email else None,
            phone=phone if phone else None,
            experience=experience_int
        )
        db.add(new_app)
        db.commit()
        db.refresh(new_app)
        
        return {"message": "Application submitted successfully", "id": new_app.id}
    except ValueError as e:
        logger.error(f"[ATS /apply] Invalid input format: {e}")
        raise HTTPException(status_code=422, detail="Invalid input format")
    except Exception:
        tb = traceback.format_exc()
        logger.exception("[ATS /apply] Unexpected error:\n" + tb)
        raise HTTPException(status_code=500, detail="Server error while applying for job.")

@router.post("/apply-auth", response_model=ApplicationOut)
def apply_job(data: ApplicationCreate, user=Depends(get_current_user)):
    try:
        db = get_tenant_session(user)
        new_app = JobApplication(**data.dict())
        db.add(new_app)
        db.commit()
        db.refresh(new_app)
        return new_app
    except Exception:
        tb = traceback.format_exc()
        logger.exception("[ATS /apply-auth] Unexpected error:\n" + tb)
        raise HTTPException(status_code=500, detail="Server error while applying for job.")
