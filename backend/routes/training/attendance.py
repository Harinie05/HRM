from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import TrainingAttendance, TrainingProgram, User
from schemas.schemas_tenant import TrainingAttendanceCreate, TrainingAttendanceOut
from sqlalchemy import func
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

router = APIRouter(prefix="/attendance", tags=["Training Attendance"])

@router.post("/")
def mark_attendance(data: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        training_id = data.get('training_id')
        employee_id = data.get('employee_id')
        attendance_days = data.get('attendance_days', {})
        assessments = data.get('assessments', {})
        completion_status = data.get('completion_status', 'In Progress')
        
        if not training_id or not employee_id:
            raise HTTPException(status_code=400, detail="Training ID and Employee ID are required")
        
        # Handle employee_id conversion
        if employee_id and str(employee_id).startswith('user_'):
            employee_id = int(str(employee_id).replace('user_', ''))
        elif employee_id:
            employee_id = int(employee_id)
        
        # Calculate if present based on attendance days
        attended_days = sum(1 for day, present in attendance_days.items() if present) if attendance_days else 0
        is_present = attended_days > 0
        
        # Get assessment scores
        pre_score = assessments.get('assessment1') if assessments else None
        post_score = assessments.get('assessment2') if assessments else None
        
        # Check if record exists
        existing_record = db.query(TrainingAttendance).filter(
            TrainingAttendance.training_id == training_id,
            TrainingAttendance.employee_id == employee_id
        ).first()
        
        if existing_record:
            existing_record.present = is_present  # type: ignore
            existing_record.attendance_days = attendance_days
            existing_record.assessments = assessments
            existing_record.completion_status = completion_status
            if pre_score:
                existing_record.pre_score = float(pre_score)  # type: ignore
            if post_score:
                existing_record.post_score = float(post_score)  # type: ignore
            if post_score and float(post_score) >= 60:
                existing_record.result = "Pass"  # type: ignore
            elif post_score:
                existing_record.result = "Fail"  # type: ignore
        else:
            record = TrainingAttendance(
                training_id=training_id,
                employee_id=employee_id,
                present=is_present,
                attendance_days=attendance_days,
                assessments=assessments,
                completion_status=completion_status,
                pre_score=float(pre_score) if pre_score else None,
                post_score=float(post_score) if post_score else None,
                result="Pass" if post_score and float(post_score) >= 60 else "Fail" if post_score else None
            )
            db.add(record)
        
        db.commit()
        
        audit_crud(request, db, user, "CREATE_TRAINING_ATTENDANCE", "training_attendance", str(training_id), {}, data)
        
        return {"message": "Attendance marked successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=f"Error saving attendance: {str(e)}")

@router.put("/{training_id}/{employee_id}")
def update_attendance(training_id: int, employee_id: int, data: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        attendance_days = data.get('attendance_days', {})
        assessments = data.get('assessments', {})
        completion_status = data.get('completion_status', 'In Progress')
        
        existing_record = db.query(TrainingAttendance).filter(
            TrainingAttendance.training_id == training_id,
            TrainingAttendance.employee_id == employee_id
        ).first()
        
        if not existing_record:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        
        attended_days = sum(1 for day, present in attendance_days.items() if present) if attendance_days else 0
        is_present = attended_days > 0
        
        pre_score = assessments.get('assessment1') if assessments else None
        post_score = assessments.get('assessment2') if assessments else None
        
        existing_record.present = is_present  # type: ignore
        existing_record.attendance_days = attendance_days
        existing_record.assessments = assessments
        existing_record.completion_status = completion_status
        if pre_score:
            existing_record.pre_score = float(pre_score)  # type: ignore
        if post_score:
            existing_record.post_score = float(post_score)  # type: ignore
        if post_score and float(post_score) >= 60:
            existing_record.result = "Pass"  # type: ignore
        elif post_score:
            existing_record.result = "Fail"  # type: ignore
        
        db.commit()
        
        audit_crud(request, db, user, "UPDATE_TRAINING_ATTENDANCE", "training_attendance", str(training_id), {}, data)
        
        return {"message": "Attendance updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=f"Error updating attendance: {str(e)}")

@router.get("/{training_id}/{employee_id}")
def get_attendance_record(training_id: int, employee_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        record = db.query(TrainingAttendance).filter(
            TrainingAttendance.training_id == training_id,
            TrainingAttendance.employee_id == employee_id
        ).first()
        
        audit_crud(request, db, user, "VIEW_TRAINING_ATTENDANCE", "training_attendance", f"{training_id}_{employee_id}", {}, {"training_id": training_id, "employee_id": employee_id})
        
        if not record:
            return {"attendance_days": {}, "assessments": {}}
        
        return {
            "attendance_days": record.attendance_days or {},
            "assessments": record.assessments or {},
            "completion_status": record.completion_status or "In Progress"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching attendance record: {str(e)}")

@router.get("/")
def list_attendance(request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        audit_crud(request, db, user, "VIEW_TRAINING_ATTENDANCE_LIST", "training_attendance", "all", {}, {})
        
        attendance_records = db.query(TrainingAttendance).all()
        
        result = []
        for attendance in attendance_records:
            try:
                program = db.query(TrainingProgram).filter(TrainingProgram.id == attendance.training_id).first()
                program_title = program.title if program else "Unknown Program"
                
                from models.models_tenant import TrainingApplication
                application = db.query(TrainingApplication).filter(
                    TrainingApplication.id == attendance.employee_id
                ).first()
                
                employee_name = application.name if application else f"Candidate #{attendance.employee_id}"
                
                completion_status = attendance.completion_status or "In Progress"
                assessments = attendance.assessments or {}
                
                assessment_score = None
                if assessments is not None and isinstance(assessments, dict):
                    assessment_score = assessments.get('assessment2') or assessments.get('assessment1')
                if not assessment_score and attendance.post_score is not None:
                    assessment_score = attendance.post_score
                
                result.append({
                    "id": attendance.id,
                    "training_id": attendance.training_id,
                    "employee_id": attendance.employee_id,
                    "employee_name": employee_name,
                    "program_title": program_title,
                    "present": attendance.present,
                    "pre_score": attendance.pre_score,
                    "post_score": attendance.post_score,
                    "result": attendance.result,
                    "status": "Present" if attendance.present is True else "Absent",
                    "assessment_score": assessment_score,
                    "completion_status": completion_status,
                    "session_date": attendance.created_at,
                    "created_at": attendance.created_at
                })
            except Exception as inner_e:
                continue
        
        return result
    except Exception as e:
        return []