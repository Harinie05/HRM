# type: ignore[misc]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from datetime import datetime, time
from typing import Optional

from models.models_tenant import AttendancePunch, AttendanceRule, Shift, EmployeeRoster
from schemas.schemas_tenant import AttendancePunchCreate, AttendancePunchOut

router = APIRouter(
    prefix="/attendance/punches",
    tags=["Attendance - Punch Logs"]
)

def calculate_attendance_status(employee_id: int, punch_date: str, in_time: time, out_time: Optional[time], db: Session) -> str:
    """Calculate attendance status based on shift timings and rules"""
    try:
        # Get employee's shift for the date
        roster = db.query(EmployeeRoster).filter(
            EmployeeRoster.employee_id == employee_id,
            EmployeeRoster.date == punch_date
        ).first()
        
        if not roster:
            return 'Present'  # Default if no roster
        
        shift = db.query(Shift).filter(Shift.id == roster.shift_id).first()
        if not shift:
            return 'Present'
        
        # Parse shift timings with error handling
        try:
            shift_start = datetime.strptime(str(shift.start_time), '%H:%M').time()
            shift_end = datetime.strptime(str(shift.end_time), '%H:%M').time()
        except (ValueError, TypeError):
            return 'Present'  # Default if time format is invalid
        
        # Get active rules
        late_rule = db.query(AttendanceRule).filter(
            AttendanceRule.rule_type == 'Late',
            AttendanceRule.is_active.is_(True)  # type: ignore
        ).first()
        
        early_rule = db.query(AttendanceRule).filter(
            AttendanceRule.rule_type == 'Early',
            AttendanceRule.is_active.is_(True)  # type: ignore
        ).first()
        
        # Convert to minutes for comparison
        def to_minutes(t: time) -> int:
            return t.hour * 60 + t.minute
        
        in_minutes = to_minutes(in_time) if in_time else None
        out_minutes = to_minutes(out_time) if out_time else None
        shift_start_minutes = to_minutes(shift_start)
        shift_end_minutes = to_minutes(shift_end)
        
        # Check Late (check-in after shift start + grace)
        if in_minutes is not None and late_rule is not None:  # type: ignore
            late_threshold = shift_start_minutes + late_rule.value
            if in_minutes > late_threshold:
                return 'Late'
        
        # Check Early (check-out before shift end - grace)
        if out_minutes is not None and early_rule is not None:  # type: ignore
            early_threshold = shift_end_minutes - early_rule.value
            if out_minutes < early_threshold:
                return 'Early'
        
        return 'Present'
    
    except Exception:
        return 'Present'  # Safe default on any error


@router.post("/", response_model=AttendancePunchOut)
def create_punch(
    data: AttendancePunchCreate,
    db: Session = Depends(get_tenant_db)
):
    try:
        punch_data = data.dict()
        
        # Validate required fields
        if not punch_data.get('employee_id') or not punch_data.get('date'):
            raise HTTPException(status_code=400, detail="Employee ID and date are required")
        
        # Auto-calculate status based on shift and rules
        if punch_data.get('in_time'):
            punch_data['status'] = calculate_attendance_status(
                punch_data['employee_id'],
                punch_data['date'],
                punch_data['in_time'],
                punch_data.get('out_time'),
                db
            )
        
        punch = AttendancePunch(**punch_data)
        db.add(punch)
        db.commit()
        db.refresh(punch)
        return punch
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create punch record: {str(e)}")


@router.get("/", response_model=list[AttendancePunchOut])
def get_all_punches(
    limit: int = 100,
    offset: int = 0,
    employee_id: Optional[int] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_tenant_db)
):
    query = db.query(AttendancePunch)
    
    if employee_id is not None:
        query = query.filter(AttendancePunch.employee_id == employee_id)
    if date is not None:
        query = query.filter(AttendancePunch.date == date)
    
    return query.offset(offset).limit(limit).all()


@router.put("/{punch_id}", response_model=AttendancePunchOut)
def update_punch(
    punch_id: int,
    data: AttendancePunchCreate,
    db: Session = Depends(get_tenant_db)
):
    punch = db.query(AttendancePunch).filter(AttendancePunch.id == punch_id).first()
    if not punch:
        raise HTTPException(status_code=404, detail="Punch record not found")
    
    update_data = data.dict(exclude_unset=True)
    
    # Recalculate status when updating times
    if 'in_time' in update_data or 'out_time' in update_data:
        in_time = update_data.get('in_time', punch.in_time)
        out_time = update_data.get('out_time', punch.out_time)
        
        if in_time:
            update_data['status'] = calculate_attendance_status(
                getattr(punch, 'employee_id'),
                str(getattr(punch, 'date')),
                in_time,
                out_time,
                db
            )
    
    for key, value in update_data.items():
        setattr(punch, key, value)
    
    db.commit()
    db.refresh(punch)
    return punch
