from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from datetime import datetime, time, date
from typing import Optional, Union
from utils.audit_logger import audit_crud
from utils.permission import require_permission
from routes.hospital import get_current_user

from models.models_tenant import AttendancePunch, AttendanceRule, Shift, EmployeeRoster, User
from schemas.schemas_tenant import AttendancePunchCreate, AttendancePunchOut

router = APIRouter(
    prefix="/attendance/punches",
    tags=["Attendance - Punch Logs"]
)

@router.get("/current-user")
def get_current_user_info(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("view_punch_logs"))
):
    """Get current user's employee information"""
    current_user_id = user.get('user_id')
    if not current_user_id:
        raise HTTPException(status_code=400, detail="User ID not found")
    
    user_info = db.query(User).filter(User.id == current_user_id).first()
    if not user_info:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user_info.id,
        "name": user_info.name,
        "employee_code": user_info.employee_code or f"EMP{user_info.id}"
    }

def calculate_attendance_status(employee_id: int, punch_date: Union[str, date], in_time: time, out_time: Optional[time], db: Session) -> str:
    """Calculate attendance status based on shift timings and rules"""
    try:
        # Convert date to string if it's a date object
        if isinstance(punch_date, date):
            punch_date_str = punch_date.strftime('%Y-%m-%d')
        else:
            punch_date_str = punch_date
        
        # Get employee's shift for the date
        roster = db.query(EmployeeRoster).filter(
            EmployeeRoster.employee_id == employee_id,
            EmployeeRoster.date == punch_date_str
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
        
        in_minutes = to_minutes(in_time) if in_time is not None else None
        out_minutes = to_minutes(out_time) if out_time is not None else None
        shift_start_minutes = to_minutes(shift_start)
        shift_end_minutes = to_minutes(shift_end)
        
        # Check Late (check-in after shift start + grace)
        if in_minutes is not None and late_rule is not None and getattr(late_rule, 'value', None) is not None:
            late_threshold = shift_start_minutes + getattr(late_rule, 'value')
            if in_minutes > late_threshold:
                return 'Late'
        
        # Check Early (check-out before shift end - grace)
        if out_minutes is not None and early_rule is not None and getattr(early_rule, 'value', None) is not None:
            early_threshold = shift_end_minutes - getattr(early_rule, 'value')
            if out_minutes < early_threshold:
                return 'Early'
        
        return 'Present'
    
    except Exception:
        return 'Present'  # Safe default on any error

@router.post("/", response_model=AttendancePunchOut)
def create_punch(
    data: AttendancePunchCreate,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("mark_attendance"))
):
    try:
        punch_data = data.dict()
        
        # Validate required fields
        if not punch_data.get('employee_id') or not punch_data.get('date'):
            raise HTTPException(status_code=400, detail="Employee ID and date are required")
        
        employee_id = punch_data['employee_id']
        punch_date = punch_data['date']
        
        # Check for existing record today
        existing_punch = db.query(AttendancePunch).filter(
            AttendancePunch.employee_id == employee_id,
            AttendancePunch.date == punch_date
        ).first()
        
        # Get employee's shift for validation
        roster = db.query(EmployeeRoster).filter(
            EmployeeRoster.employee_id == employee_id,
            EmployeeRoster.date == punch_date
        ).first()
        
        # Check for missed checkout from previous day
        from datetime import datetime, timedelta
        
        # Convert punch_date to string if it's a date object
        if isinstance(punch_date, date):
            punch_date_str = punch_date.strftime('%Y-%m-%d')
        else:
            punch_date_str = punch_date
            
        yesterday = (datetime.strptime(punch_date_str, '%Y-%m-%d') - timedelta(days=1)).strftime('%Y-%m-%d')
        yesterday_punch = db.query(AttendancePunch).filter(
            AttendancePunch.employee_id == employee_id,
            AttendancePunch.date == yesterday,
            AttendancePunch.in_time.isnot(None),
            AttendancePunch.out_time.is_(None)
        ).first()
        
        # If trying to check in but missed checkout yesterday
        if punch_data.get('in_time') and yesterday_punch and not existing_punch:
            # Auto checkout yesterday at shift end time
            if roster:
                shift = db.query(Shift).filter(Shift.id == roster.shift_id).first()
                if shift:
                    # Convert shift.end_time to proper time object and update
                    if isinstance(shift.end_time, str):
                        end_time = datetime.strptime(shift.end_time, '%H:%M').time()
                    else:
                        end_time = shift.end_time
                    
                    # Update the punch record
                    setattr(yesterday_punch, 'out_time', end_time)
                    setattr(yesterday_punch, 'status', 'Auto Checkout')
                    db.commit()
            
            # Return alert for missed checkout
            return {
                "alert": "missed_checkout",
                "message": "You haven't checked out yesterday. It has been automatically processed. Please apply for regularization if needed.",
                "yesterday_date": yesterday
            }
        
        # Normal punch processing
        if existing_punch:
            # Check if trying to check in when already checked in
            if punch_data.get('in_time') and existing_punch.in_time is not None and existing_punch.out_time is None:
                raise HTTPException(status_code=400, detail="Already checked in today. Please check out first.")
            
            # Check if trying to check in when already completed for the day
            if punch_data.get('in_time') and existing_punch.in_time is not None and existing_punch.out_time is not None:
                raise HTTPException(status_code=400, detail="Attendance already completed for today.")
            
            # Update existing record (checkout)
            if punch_data.get('out_time') and existing_punch.in_time is not None and existing_punch.out_time is None:
                setattr(existing_punch, 'out_time', punch_data['out_time'])
                setattr(existing_punch, 'status', calculate_attendance_status(
                    employee_id, punch_date, getattr(existing_punch, 'in_time'), punch_data['out_time'], db
                ))
                if punch_data.get('location'):
                    setattr(existing_punch, 'location', f"{existing_punch.location} | Out: {punch_data['location']}")
                db.commit()
                db.refresh(existing_punch)
                return existing_punch
            else:
                raise HTTPException(status_code=400, detail="Invalid checkout request")
        else:
            # Create new record (checkin)
            if punch_data.get('in_time'):
                punch_data['status'] = calculate_attendance_status(
                    employee_id, punch_date, punch_data['in_time'], None, db
                )
                punch = AttendancePunch(**punch_data)
                db.add(punch)
                db.commit()
                db.refresh(punch)
                
                # Audit log
                audit_crud(request, db, user, "CREATE_ATTENDANCE_PUNCH", "attendance_punches", str(punch.id), {}, punch_data)
                return punch
            else:
                raise HTTPException(status_code=400, detail="Check-in time is required")
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process attendance: {str(e)}")

@router.get("/check-status/{employee_id}")
def check_attendance_status(
    employee_id: int,
    date: Optional[str] = None,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("view_punch_logs"))
):
    """Check current attendance status and validate shift timing"""
    from datetime import datetime, timedelta
    
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    
    # Get today's punch record
    today_punch = db.query(AttendancePunch).filter(
        AttendancePunch.employee_id == employee_id,
        AttendancePunch.date == date
    ).first()
    
    # Check for missed checkout from previous day
    yesterday = (datetime.strptime(date, '%Y-%m-%d') - timedelta(days=1)).strftime('%Y-%m-%d')
    yesterday_punch = db.query(AttendancePunch).filter(
        AttendancePunch.employee_id == employee_id,
        AttendancePunch.date == yesterday,
        AttendancePunch.in_time.isnot(None),
        AttendancePunch.out_time.is_(None)
    ).first()
    
    # Get shift information
    roster = db.query(EmployeeRoster).filter(
        EmployeeRoster.employee_id == employee_id,
        EmployeeRoster.date == date
    ).first()
    
    shift_info = None
    if roster:
        shift = db.query(Shift).filter(Shift.id == roster.shift_id).first()
        if shift:
            shift_info = {
                "start_time": str(shift.start_time),
                "end_time": str(shift.end_time),
                "name": shift.name
            }
    
    status = {
        "date": date,
        "employee_id": employee_id,
        "shift": shift_info,
        "missed_checkout_yesterday": bool(yesterday_punch),
        "yesterday_date": yesterday if yesterday_punch else None,
        "can_check_in": True  # Always allow check-in, but show alert if missed checkout
    }
    
    if today_punch:
        status.update({
            "checked_in": today_punch.in_time is not None,
            "checked_out": today_punch.out_time is not None,
            "in_time": str(today_punch.in_time) if today_punch.in_time is not None else None,
            "out_time": str(today_punch.out_time) if today_punch.out_time is not None else None,
            "source": today_punch.source,
            "status": today_punch.status
        })
    else:
        status.update({
            "checked_in": False,
            "checked_out": False,
            "in_time": None,
            "out_time": None,
            "source": None,
            "status": None
        })
    
    return status
@router.get("/")
def get_all_punches(
    limit: int = 100,
    offset: int = 0,
    employee_id: Optional[int] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("view_punch_logs"))
):
    query = db.query(AttendancePunch)
    
    # Check if user has view_self permission (can only view own records)
    user_permissions = user.get('permissions', [])
    if 'view_self' in user_permissions:
        # User can only view their own records
        current_user_id = user.get('user_id')
        if current_user_id:
            query = query.filter(AttendancePunch.employee_id == current_user_id)
    elif employee_id is not None:
        query = query.filter(AttendancePunch.employee_id == employee_id)
    
    if date is not None:
        query = query.filter(AttendancePunch.date == date)
    
    return query.offset(offset).limit(limit).all()

@router.put("/{punch_id}", response_model=AttendancePunchOut)
def update_punch(
    punch_id: int,
    data: AttendancePunchCreate,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("edit_punch_logs"))
):
    punch = db.query(AttendancePunch).filter(AttendancePunch.id == punch_id).first()
    if not punch:
        raise HTTPException(status_code=404, detail="Punch record not found")
    
    # Store old values for audit
    old_values = {"in_time": str(punch.in_time), "out_time": str(punch.out_time), "status": punch.status}
    
    update_data = data.dict(exclude_unset=True)
    
    # Debug logging
    print(f"Updating punch {punch_id} with data: {update_data}")
    print(f"Original employee_id: {punch.employee_id}")
    
    # Recalculate status when updating times
    if 'in_time' in update_data or 'out_time' in update_data:
        in_time = update_data.get('in_time', punch.in_time)
        out_time = update_data.get('out_time', punch.out_time)
        
        if in_time is not None:
            update_data['status'] = calculate_attendance_status(
                getattr(punch, 'employee_id'),
                getattr(punch, 'date'),
                in_time,
                out_time,
                db
            )
    
    for key, value in update_data.items():
        setattr(punch, key, value)
    
    db.commit()
    db.refresh(punch)
    
    print(f"Updated punch - Final employee_id: {punch.employee_id}")
    
    # Audit log
    audit_crud(request, db, user, "UPDATE_ATTENDANCE_PUNCH", "attendance_punches", str(punch_id), old_values, update_data)
    
    return punch
