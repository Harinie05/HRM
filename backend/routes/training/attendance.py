from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import TrainingAttendance, TrainingProgram, User
from schemas.schemas_tenant import TrainingAttendanceCreate, TrainingAttendanceOut
from sqlalchemy import func

router = APIRouter(prefix="/attendance", tags=["Training Attendance"])

@router.post("/")
def mark_attendance(data: dict, db: Session = Depends(get_tenant_db)):
    try:
        # Handle employee_id conversion
        employee_id_raw = data.get('employee_id')
        if str(employee_id_raw).startswith('user_'):
            employee_id = int(employee_id_raw.replace('user_', ''))
        else:
            employee_id = int(employee_id_raw)
        
        record = TrainingAttendance(
            training_id=data.get('training_id'),
            employee_id=employee_id,
            present=data.get('present', False),
            pre_score=data.get('pre_score'),
            post_score=data.get('post_score')
        )
        
        # Auto-calculate result based on post_score
        if data.get('post_score'):
            record.result = "Pass" if float(data.get('post_score')) >= 60 else "Fail"
        
        db.add(record)
        db.commit()
        db.refresh(record)
        return {"message": "Attendance & assessment saved", "id": record.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=f"Error saving attendance: {str(e)}")

@router.get("/")
def list_attendance(db: Session = Depends(get_tenant_db)):
    try:
        # Join with training programs and users to get complete data
        attendance_data = db.query(
            TrainingAttendance,
            TrainingProgram.title.label('program_title'),
            User.name.label('employee_name')
        ).join(
            TrainingProgram, TrainingAttendance.training_id == TrainingProgram.id, isouter=True
        ).join(
            User, TrainingAttendance.employee_id == User.id, isouter=True
        ).all()
        
        result = []
        for attendance, program_title, employee_name in attendance_data:
            result.append({
                "id": attendance.id,
                "training_id": attendance.training_id,
                "employee_id": attendance.employee_id,
                "employee_name": employee_name or f"Employee #{attendance.employee_id}",
                "program_title": program_title or "Unknown Program",
                "present": attendance.present,
                "pre_score": attendance.pre_score,
                "post_score": attendance.post_score,
                "result": attendance.result,
                "status": "Present" if attendance.present else "Absent",
                "assessment_score": attendance.post_score,
                "completion_status": "Completed" if attendance.result else "In Progress",
                "session_date": attendance.created_at,
                "created_at": attendance.created_at
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching attendance: {str(e)}")
