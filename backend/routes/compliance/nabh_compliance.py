from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import NABHHRMCompliance, User
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user, require_permission

router = APIRouter(prefix="/compliance/nabh", tags=["Compliance"])

class NABHComplianceRequest(BaseModel):
    employee_id: str
    employee_name: str
    department: str = ""
    designation: str = ""
    staff_qualification_verified: bool = False
    medical_fitness_done: bool = False
    credentialing_done: bool = False
    fire_safety_training_done: bool = False
    performance_monitoring_done: bool = False
    remarks: str = ""

@router.post("/")
def create_nabh_compliance(data: NABHComplianceRequest, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("add_nabh_compliance"))):
    try:
        user_record = db.query(User).filter(User.employee_code == data.employee_id).first()
        if not user_record:
            user_id = 1
        else:
            user_id = user_record.id
        
        record = NABHHRMCompliance(
            employee_id=user_id,
            staff_qualification_verified=data.staff_qualification_verified,
            medical_fitness_done=data.medical_fitness_done,
            credentialing_done=data.credentialing_done,
            fire_safety_training_done=data.fire_safety_training_done,
            performance_monitoring_done=data.performance_monitoring_done,
            remarks=data.remarks
        )
        
        db.add(record)
        db.commit()
        db.refresh(record)
        
        audit_crud(request, db, user, "CREATE_NABH_COMPLIANCE", "nabh_hrm_compliance", str(record.id), {}, data.dict())
        
        return {"message": "NABH compliance record saved successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/")
def get_nabh_compliance(request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("view_nabh_compliance"))):
    try:
        records = db.query(NABHHRMCompliance).order_by(NABHHRMCompliance.created_at.desc()).all()
        
        result = []
        for record in records:
            user_record = db.query(User).filter(User.id == record.employee_id).first()
            
            compliance_score = sum([
                1 if record.staff_qualification_verified is True else 0,
                1 if record.medical_fitness_done is True else 0,
                1 if record.credentialing_done is True else 0,
                1 if record.fire_safety_training_done is True else 0,
                1 if record.performance_monitoring_done is True else 0
            ]) / 5 * 100
            
            compliance_score_float = float(compliance_score)
            
            result.append({
                "id": record.id,
                "employee_id": user_record.employee_code if user_record else str(record.employee_id),
                "employee_name": user_record.name if user_record else f"Employee {record.employee_id}",
                "department": user_record.department.name if user_record and user_record.department else "N/A",
                "compliance_score": round(compliance_score_float, 1),
                "status": "Compliant" if compliance_score_float >= 80 else "Pending",
                "staff_qualification_verified": record.staff_qualification_verified,
                "medical_fitness_done": record.medical_fitness_done,
                "credentialing_done": record.credentialing_done,
                "fire_safety_training_done": record.fire_safety_training_done,
                "performance_monitoring_done": record.performance_monitoring_done,
                "remarks": record.remarks
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.put("/{record_id}")
def update_nabh_compliance(record_id: int, data: NABHComplianceRequest, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("edit_nabh_compliance"))):
    try:
        record = db.query(NABHHRMCompliance).filter(NABHHRMCompliance.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        
        old_values = {
            "staff_qualification_verified": record.staff_qualification_verified,
            "medical_fitness_done": record.medical_fitness_done,
            "credentialing_done": record.credentialing_done,
            "fire_safety_training_done": record.fire_safety_training_done,
            "performance_monitoring_done": record.performance_monitoring_done,
            "remarks": record.remarks
        }
        
        setattr(record, 'staff_qualification_verified', data.staff_qualification_verified)
        setattr(record, 'medical_fitness_done', data.medical_fitness_done)
        setattr(record, 'credentialing_done', data.credentialing_done)
        setattr(record, 'fire_safety_training_done', data.fire_safety_training_done)
        setattr(record, 'performance_monitoring_done', data.performance_monitoring_done)
        setattr(record, 'remarks', data.remarks)
        
        db.commit()
        
        audit_crud(request, db, user, "UPDATE_NABH_COMPLIANCE", "nabh_hrm_compliance", str(record.id), old_values, data.dict())
        
        return {"message": "Record updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.delete("/{record_id}")
def delete_nabh_compliance(record_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(require_permission("delete_nabh_compliance"))):
    try:
        record = db.query(NABHHRMCompliance).filter(NABHHRMCompliance.id == record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        
        db.delete(record)
        db.commit()
        
        audit_crud(request, db, user, "DELETE_NABH_COMPLIANCE", "nabh_hrm_compliance", str(record.id), {}, {})
        
        return {"message": "Record deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")