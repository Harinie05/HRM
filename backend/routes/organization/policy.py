from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from sqlalchemy.orm import Session
from database import get_master_db, get_tenant_engine, logger
from utils.audit_logger import audit_crud
import os
import shutil
from pathlib import Path

from models.models_master import Hospital
from models.models_tenant import (
    HRPolicy, LeavePolicy, AttendancePolicy, OTPolicy
)

from schemas.schemas_tenant import (
    HRPolicyCreate, HRPolicyOut,
    LeavePolicyCreate, LeavePolicyOut,
    AttendancePolicyCreate, AttendancePolicyOut,
    OTPolicyCreate, OTPolicyOut
)

from routes.hospital import get_current_user
from typing import List


router = APIRouter(prefix="/policies", tags=["Policy Setup"])


# --------------------------------------------------------------------------------
# Get Tenant Session
# --------------------------------------------------------------------------------
def get_tenant_session(user):
    tenant_db = user.get("tenant_db")
    master_db = next(get_master_db())
    hospital = master_db.query(Hospital).filter(Hospital.db_name == tenant_db).first()

    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    engine = get_tenant_engine(str(hospital.db_name))
    return Session(bind=engine)


# =================================================================================
# HR POLICY
# =================================================================================
@router.post("/hr/create", response_model=HRPolicyOut)
def create_hr_policy(data: HRPolicyCreate, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[HR POLICY CREATE] {data.name}")

    policy = HRPolicy(**data.dict())
    db.add(policy)
    db.commit()
    db.refresh(policy)
    audit_crud(request, user.get("tenant_db"), user, "CREATE", "hr_policies", policy.id, None, policy.__dict__)
    return policy


@router.get("/hr/list", response_model=List[HRPolicyOut])
def list_hr_policies(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[HR POLICY LIST] Fetching all HR policies for user {user.get('email')}")
    policies = db.query(HRPolicy).order_by(HRPolicy.id.desc()).all()
    
    results = []
    for p in policies:
        policy_dict = p.__dict__.copy()
        policy_dict['document_download_url'] = f"/uploads/policies/{p.document}" if getattr(p, 'document', None) else None
        results.append(HRPolicyOut(**policy_dict))
    
    return results


@router.put("/hr/update/{id}", response_model=HRPolicyOut)
def update_hr_policy(id: int, data: HRPolicyCreate, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[HR POLICY UPDATE] Updating policy id={id} by user {user.get('email')}")
    policy = db.query(HRPolicy).filter(HRPolicy.id == id).first()

    if not policy:
        logger.error(f"[HR POLICY UPDATE] Policy not found id={id}")
        raise HTTPException(status_code=404, detail="HR Policy not found")

    old_values = policy.__dict__.copy()
    for key, value in data.dict().items():
        setattr(policy, key, value)

    db.commit()
    db.refresh(policy)
    audit_crud(request, user.get("tenant_db"), user, "UPDATE", "hr_policies", id, old_values, policy.__dict__)
    logger.info(f"[HR POLICY UPDATE] Policy updated successfully id={id}")
    return policy


@router.delete("/hr/delete/{id}")
def delete_hr_policy(id: int, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[HR POLICY DELETE] Deleting policy id={id} by user {user.get('email')}")
    policy = db.query(HRPolicy).filter(HRPolicy.id == id).first()

    if not policy:
        logger.error(f"[HR POLICY DELETE] Policy not found id={id}")
        raise HTTPException(status_code=404, detail="HR Policy not found")

    old_values = policy.__dict__.copy()
    db.delete(policy)
    db.commit()
    audit_crud(request, user.get("tenant_db"), user, "DELETE", "hr_policies", id, old_values, None)
    logger.info(f"[HR POLICY DELETE] Policy deleted successfully id={id}")
    return {"message": "HR Policy deleted successfully"}


@router.post("/hr/upload/{id}")
async def upload_hr_policy_document(id: int, file: UploadFile = File(...), user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[HR POLICY UPLOAD] Uploading document for policy id={id}")
    
    policy = db.query(HRPolicy).filter(HRPolicy.id == id).first()
    if not policy:
        raise HTTPException(404, "HR Policy not found")
    
    upload_dir = Path("uploads/policies")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    if not file.filename:
        raise HTTPException(400, "No filename provided")
    
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"hr_policy_{id}_{file.filename}"
    file_path = upload_dir / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    setattr(policy, "document", filename)
    db.commit()
    logger.info(f"[HR POLICY UPLOAD] Document uploaded: {filename}")
    return {"message": "Document uploaded", "filename": filename}


@router.get("/hr/view/{id}", response_model=HRPolicyOut)
def view_hr_policy(id: int, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[HR POLICY VIEW] Viewing policy id={id}")
    
    policy = db.query(HRPolicy).filter(HRPolicy.id == id).first()
    if not policy:
        raise HTTPException(404, "HR Policy not found")
    
    policy_dict = policy.__dict__.copy()
    policy_dict['document_download_url'] = f"/uploads/policies/{policy.document}" if getattr(policy, 'document', None) else None
    
    return HRPolicyOut(**policy_dict)


# =================================================================================
# LEAVE POLICY
# =================================================================================
@router.post("/leave/create", response_model=LeavePolicyOut)
def create_leave_policy(data: LeavePolicyCreate, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[LEAVE POLICY CREATE] {data.name}")

    policy = LeavePolicy(**data.dict())
    db.add(policy)
    db.commit()
    db.refresh(policy)
    audit_crud(request, user.get("tenant_db"), user, "CREATE", "leave_policies", policy.id, None, policy.__dict__)
    return policy


@router.get("/leave/list", response_model=List[LeavePolicyOut])
def list_leave_policy(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[LEAVE POLICY LIST] Fetching all leave policies for user {user.get('email')}")
    return db.query(LeavePolicy).order_by(LeavePolicy.id.desc()).all()


@router.put("/leave/update/{id}", response_model=LeavePolicyOut)
def update_leave_policy(id: int, data: LeavePolicyCreate, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[LEAVE POLICY UPDATE] Updating policy id={id} by user {user.get('email')}")
    policy = db.query(LeavePolicy).filter(LeavePolicy.id == id).first()

    if not policy:
        logger.error(f"[LEAVE POLICY UPDATE] Policy not found id={id}")
        raise HTTPException(status_code=404, detail="Leave Policy not found")

    old_values = policy.__dict__.copy()
    for key, value in data.dict().items():
        setattr(policy, key, value)

    db.commit()
    db.refresh(policy)
    audit_crud(request, user.get("tenant_db"), user, "UPDATE", "leave_policies", id, old_values, policy.__dict__)
    logger.info(f"[LEAVE POLICY UPDATE] Policy updated successfully id={id}")
    return policy


@router.delete("/leave/delete/{id}")
def delete_leave_policy(id: int, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[LEAVE POLICY DELETE] Deleting policy id={id} by user {user.get('email')}")
    policy = db.query(LeavePolicy).filter(LeavePolicy.id == id).first()

    if not policy:
        logger.error(f"[LEAVE POLICY DELETE] Policy not found id={id}")
        raise HTTPException(status_code=404, detail="Leave Policy not found")

    old_values = policy.__dict__.copy()
    db.delete(policy)
    db.commit()
    audit_crud(request, user.get("tenant_db"), user, "DELETE", "leave_policies", id, old_values, None)
    logger.info(f"[LEAVE POLICY DELETE] Policy deleted successfully id={id}")
    return {"message": "Leave Policy deleted successfully"}


# =================================================================================
# ATTENDANCE POLICY
# =================================================================================
@router.post("/attendance/create", response_model=AttendancePolicyOut)
def create_attendance_policy(data: AttendancePolicyCreate, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[ATTENDANCE POLICY CREATE] Creating policy by user {user.get('email')}")

    policy = AttendancePolicy(**data.dict())
    db.add(policy)
    db.commit()
    db.refresh(policy)
    audit_crud(request, user.get("tenant_db"), user, "CREATE", "attendance_policies", policy.id, None, policy.__dict__)
    return policy


@router.get("/attendance/list", response_model=List[AttendancePolicyOut])
def list_attendance_policy(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[ATTENDANCE POLICY LIST] Fetching all attendance policies for user {user.get('email')}")
    return db.query(AttendancePolicy).order_by(AttendancePolicy.id.desc()).all()


@router.put("/attendance/update/{id}", response_model=AttendancePolicyOut)
def update_attendance_policy(id: int, data: AttendancePolicyCreate, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[ATTENDANCE POLICY UPDATE] Updating policy id={id} by user {user.get('email')}")
    policy = db.query(AttendancePolicy).filter(AttendancePolicy.id == id).first()

    if not policy:
        logger.error(f"[ATTENDANCE POLICY UPDATE] Policy not found id={id}")
        raise HTTPException(status_code=404, detail="Attendance Policy not found")

    old_values = policy.__dict__.copy()
    for key, value in data.dict().items():
        setattr(policy, key, value)

    db.commit()
    db.refresh(policy)
    audit_crud(request, user.get("tenant_db"), user, "UPDATE", "attendance_policies", id, old_values, policy.__dict__)
    logger.info(f"[ATTENDANCE POLICY UPDATE] Policy updated successfully id={id}")
    return policy


@router.delete("/attendance/delete/{id}")
def delete_attendance_policy(id: int, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[ATTENDANCE POLICY DELETE] Deleting policy id={id} by user {user.get('email')}")
    policy = db.query(AttendancePolicy).filter(AttendancePolicy.id == id).first()

    if not policy:
        logger.error(f"[ATTENDANCE POLICY DELETE] Policy not found id={id}")
        raise HTTPException(status_code=404, detail="Attendance Policy not found")

    old_values = policy.__dict__.copy()
    db.delete(policy)
    db.commit()
    audit_crud(request, user.get("tenant_db"), user, "DELETE", "attendance_policies", id, old_values, None)
    logger.info(f"[ATTENDANCE POLICY DELETE] Policy deleted successfully id={id}")
    return {"message": "Attendance Policy deleted successfully"}


# =================================================================================
# OT POLICY
# =================================================================================
@router.post("/ot/create", response_model=OTPolicyOut)
def create_ot_policy(data: OTPolicyCreate, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[OT POLICY CREATE] Creating policy by user {user.get('email')}")

    grades_str = ",".join(data.grades) if data.grades else ""
    policy = OTPolicy(**data.dict(exclude={"grades"}), grades=grades_str)
    db.add(policy)
    db.commit()
    db.refresh(policy)
    audit_crud(request, user.get("tenant_db"), user, "CREATE", "ot_policies", policy.id, None, policy.__dict__)

    grades_value = policy.grades
    grades_list = grades_value.split(",") if grades_value not in (None, "") else []
    return OTPolicyOut.model_validate(policy.__dict__ | {"grades": grades_list})


@router.get("/ot/list", response_model=List[OTPolicyOut])
def list_ot_policy(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[OT POLICY LIST] Fetching all OT policies for user {user.get('email')}")
    items = db.query(OTPolicy).order_by(OTPolicy.id.desc()).all()

    results = []
    for i in items:
        grades_value = i.grades
        grades_list = grades_value.split(",") if grades_value not in (None, "") else []
        results.append(OTPolicyOut.model_validate(i.__dict__ | {"grades": grades_list}))

    return results


@router.put("/ot/update/{id}", response_model=OTPolicyOut)
def update_ot_policy(id: int, data: OTPolicyCreate, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[OT POLICY UPDATE] Updating policy id={id} by user {user.get('email')}")
    policy = db.query(OTPolicy).filter(OTPolicy.id == id).first()

    if not policy:
        logger.error(f"[OT POLICY UPDATE] Policy not found id={id}")
        raise HTTPException(status_code=404, detail="OT Policy not found")

    old_values = policy.__dict__.copy()
    update = data.dict()
    update["grades"] = ",".join(update["grades"])

    for k, v in update.items():
        setattr(policy, k, v)

    db.commit()
    db.refresh(policy)
    audit_crud(request, user.get("tenant_db"), user, "UPDATE", "ot_policies", id, old_values, policy.__dict__)
    logger.info(f"[OT POLICY UPDATE] Policy updated successfully id={id}")

    grades_value = policy.grades
    grades_list = grades_value.split(",") if grades_value not in (None, "") else []
    return OTPolicyOut.model_validate(policy.__dict__ | {"grades": grades_list})


@router.delete("/ot/delete/{id}")
def delete_ot_policy(id: int, request: Request, user=Depends(get_current_user)):
    db = get_tenant_session(user)
    logger.info(f"[OT POLICY DELETE] Deleting policy id={id} by user {user.get('email')}")
    policy = db.query(OTPolicy).filter(OTPolicy.id == id).first()

    if not policy:
        logger.error(f"[OT POLICY DELETE] Policy not found id={id}")
        raise HTTPException(status_code=404, detail="OT Policy not found")

    old_values = policy.__dict__.copy()
    db.delete(policy)
    db.commit()
    audit_crud(request, user.get("tenant_db"), user, "DELETE", "ot_policies", id, old_values, None)
    logger.info(f"[OT POLICY DELETE] Policy deleted successfully id={id}")
    return {"message": "OT Policy deleted successfully"}
