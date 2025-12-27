from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from models.models_tenant import EmployeeRoster, NightShiftRule, Shift, Employee, User, OnCallDuty, EmergencyCallLog

router = APIRouter(prefix="/roster", tags=["Roster Management"])

def get_tenant_session(user):
    from models.models_master import Hospital
    from database import get_master_db

    tenant_db = user.get("tenant_db")
    master = next(get_master_db())

    hospital = master.query(Hospital).filter(Hospital.db_name == tenant_db).first()
    if not hospital:
        raise HTTPException(404, "Tenant not found")

    engine = get_tenant_engine(hospital.db_name)
    return Session(bind=engine)

# Note: Shifts are fetched from /shifts/{tenant}/list endpoint (organization setup)
# No need to duplicate shift fetching here

# -------------------------------------------------------------------------
# 2. GET EMPLOYEES FOR ROSTER
# -------------------------------------------------------------------------
@router.get("/employees")
def get_employees(
    department: Optional[str] = None,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    try:
        query = db.query(Employee).filter(Employee.status == "Active")
        if department:
            query = query.filter(Employee.department == department)
        
        employees = query.all()
        return {"employees": employees}
    except Exception as e:
        raise HTTPException(500, f"Error fetching employees: {str(e)}")
    finally:
        db.close()

# -------------------------------------------------------------------------
# 3. GET ROSTER FOR DATE RANGE
# -------------------------------------------------------------------------
@router.get("/schedule")
def get_roster_schedule(
    start_date: str,
    end_date: str,
    department: Optional[str] = None,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    try:
        # Convert string dates to date objects
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        # Get roster data first
        roster_data = db.query(EmployeeRoster).filter(
            EmployeeRoster.date >= start_dt,
            EmployeeRoster.date <= end_dt
        ).all()
        
        # Get unique employee IDs from roster data
        employee_ids = list(set([r.employee_id for r in roster_data]))
        
        # Get only users who have roster entries
        if employee_ids:
            emp_query = db.query(User).filter(User.id.in_(employee_ids))
            if department:
                emp_query = emp_query.filter(User.department_id == int(department))
            employees = emp_query.all()
        else:
            employees = []
        
        # Get shifts from organization setup
        shifts = db.query(Shift).all()
        shift_map = {shift.id: shift for shift in shifts}
        
        # Organize data by employee
        result = []
        for emp in employees:
            emp_roster = [r for r in roster_data if r.employee_id == emp.id]
            roster_dict = {r.date.strftime("%Y-%m-%d"): r for r in emp_roster}
            
            # Generate date range
            current_date = start_dt
            schedule = []
            while current_date <= end_dt:
                date_str = current_date.strftime("%Y-%m-%d")
                roster_entry = roster_dict.get(date_str)
                
                if roster_entry:
                    shift_info = shift_map.get(roster_entry.shift_id)
                    schedule.append({
                        "date": date_str,
                        "shift_id": roster_entry.shift_id,
                        "shift_name": shift_info.name if shift_info else "Unknown",
                        "status": roster_entry.status
                    })
                else:
                    schedule.append({
                        "date": date_str,
                        "shift_id": None,
                        "shift_name": "Not Assigned",
                        "status": "Unscheduled"
                    })
                
                current_date += timedelta(days=1)
            
            result.append({
                "employee_id": emp.id,
                "employee_name": emp.name,
                "department": emp.department.name if emp.department else "Unknown",
                "schedule": schedule
            })
        
        return {"roster": result}
        
    except Exception as e:
        raise HTTPException(500, f"Error fetching roster: {str(e)}")
    finally:
        db.close()

# -------------------------------------------------------------------------
# 4. SAVE ROSTER ENTRY
# -------------------------------------------------------------------------
from pydantic import BaseModel

class RosterEntryRequest(BaseModel):
    employee_id: int
    date: str
    shift_id: Optional[int] = None
    status: str = "Scheduled"

class NightShiftRulesRequest(BaseModel):
    applicable_shifts: List[int]
    punch_out_rule: str
    minimum_hours: int
    night_ot_rate: str
    grace_minutes: int

class OnCallDutyRequest(BaseModel):
    employee_id: int
    date: str
    from_time: str
    to_time: str
    duty_type: str = "On-Call"
    department_id: Optional[int] = None
    priority_level: str = "Normal"
    contact_number: Optional[str] = None
    remarks: Optional[str] = None

class EmergencyCallRequest(BaseModel):
    on_call_duty_id: int
    employee_id: int
    call_time: str
    call_type: str
    caller_details: Optional[str] = None
    issue_description: Optional[str] = None

@router.post("/save")
def save_roster_entry(
    request: RosterEntryRequest,
    req: Request,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    try:
        print(f"DEBUG: Saving roster entry: {request.dict()}")
        roster_date = datetime.strptime(request.date, "%Y-%m-%d").date()
        
        # Check if entry exists
        existing = db.query(EmployeeRoster).filter(
            EmployeeRoster.employee_id == request.employee_id,
            EmployeeRoster.date == roster_date
        ).first()
        
        print(f"DEBUG: Existing entry found: {existing}")
        
        if existing:
            if request.shift_id is None:
                # Delete the entry if shift_id is None (clearing)
                db.delete(existing)
                print("DEBUG: Deleted existing entry")
            else:
                existing.shift_id = request.shift_id
                existing.status = request.status
                print("DEBUG: Updated existing entry")
        else:
            if request.shift_id is not None:
                new_roster = EmployeeRoster(
                    employee_id=request.employee_id,
                    shift_id=request.shift_id,
                    date=roster_date,
                    status=request.status
                )
                db.add(new_roster)
                print(f"DEBUG: Created new roster entry: {new_roster.__dict__}")
        
        db.commit()
        audit_crud(req, user.get("tenant_db"), user, "UPDATE", "employee_roster", request.employee_id, None, request.dict())
        print("DEBUG: Transaction committed successfully")
        return {"message": "Roster saved successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error saving roster: {str(e)}")
    finally:
        db.close()

# -------------------------------------------------------------------------
# 5. COPY LAST WEEK ROSTER
# -------------------------------------------------------------------------
@router.post("/copy-last-week")
def copy_last_week_roster(
    start_date: str,
    request: Request,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    try:
        current_start = datetime.strptime(start_date, "%Y-%m-%d").date()
        last_week_start = current_start - timedelta(days=7)
        last_week_end = current_start - timedelta(days=1)
        
        # Get last week's roster
        last_week_roster = db.query(EmployeeRoster).filter(
            EmployeeRoster.date >= last_week_start,
            EmployeeRoster.date <= last_week_end
        ).all()
        
        # Copy to current week
        for entry in last_week_roster:
            new_date = entry.date + timedelta(days=7)
            
            # Check if entry already exists
            existing = db.query(EmployeeRoster).filter(
                EmployeeRoster.employee_id == entry.employee_id,
                EmployeeRoster.date == new_date
            ).first()
            
            if not existing:
                new_entry = EmployeeRoster(
                    employee_id=entry.employee_id,
                    shift_id=entry.shift_id,
                    date=new_date,
                    status=entry.status
                )
                db.add(new_entry)
        
        db.commit()
        audit_crud(request, user.get("tenant_db"), user, "CREATE", "employee_roster", None, None, {"action": "copy_last_week", "start_date": start_date})
        return {"message": "Last week roster copied successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error copying roster: {str(e)}")
    finally:
        db.close()

# -------------------------------------------------------------------------
# 6. NIGHT SHIFT RULES
# -------------------------------------------------------------------------
@router.get("/night-shift-rules")
def get_night_shift_rules(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        rules = db.query(NightShiftRule).first()
        if not rules:
            # Create default rules
            rules = NightShiftRule()
            db.add(rules)
            db.commit()
            db.refresh(rules)
        
        return {"rules": rules}
    except Exception as e:
        raise HTTPException(500, f"Error fetching night shift rules: {str(e)}")
    finally:
        db.close()

@router.post("/night-shift-rules")
def save_night_shift_rules(
    request: NightShiftRulesRequest,
    req: Request,
    user=Depends(get_current_user)
):
    db = get_tenant_session(user)
    try:
        rules = db.query(NightShiftRule).first()
        if rules:
            rules.applicable_shifts = request.applicable_shifts
            rules.punch_out_rule = request.punch_out_rule
            rules.minimum_hours = request.minimum_hours
            rules.night_ot_rate = request.night_ot_rate
            rules.grace_minutes = request.grace_minutes
        else:
            rules = NightShiftRule(
                applicable_shifts=request.applicable_shifts,
                punch_out_rule=request.punch_out_rule,
                minimum_hours=request.minimum_hours,
                night_ot_rate=request.night_ot_rate,
                grace_minutes=request.grace_minutes
            )
            db.add(rules)
        
        db.commit()
        audit_crud(req, user.get("tenant_db"), user, "UPDATE" if rules else "CREATE", "night_shift_rules", getattr(rules, 'id', None), None, request.dict())
        return {"message": "Night shift rules saved successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error saving night shift rules: {str(e)}")
    finally:
        db.close()

@router.get("/night-shift-rules/list")
def list_night_shift_rules(user=Depends(get_current_user)):
    """Get all night shift rules"""
    db = get_tenant_session(user)
    try:
        rules = db.query(NightShiftRule).all()
        return {"rules": rules}
    except Exception as e:
        raise HTTPException(500, f"Error fetching night shift rules: {str(e)}")
    finally:
        db.close()

@router.get("/night-shift-rules/{rule_id}")
def get_night_shift_rule(rule_id: int, user=Depends(get_current_user)):
    """Get specific night shift rule by ID"""
    db = get_tenant_session(user)
    try:
        rule = db.query(NightShiftRule).filter(NightShiftRule.id == rule_id).first()
        if not rule:
            raise HTTPException(404, "Night shift rule not found")
        return {"rule": rule}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching night shift rule: {str(e)}")
    finally:
        db.close()

@router.put("/night-shift-rules/{rule_id}")
def update_night_shift_rule(
    rule_id: int,
    request: NightShiftRulesRequest,
    req: Request,
    user=Depends(get_current_user)
):
    """Update specific night shift rule"""
    db = get_tenant_session(user)
    try:
        rule = db.query(NightShiftRule).filter(NightShiftRule.id == rule_id).first()
        if not rule:
            raise HTTPException(404, "Night shift rule not found")
        
        rule.applicable_shifts = request.applicable_shifts
        rule.punch_out_rule = request.punch_out_rule
        rule.minimum_hours = request.minimum_hours
        rule.night_ot_rate = request.night_ot_rate
        rule.grace_minutes = request.grace_minutes
        
        db.commit()
        audit_crud(req, user.get("tenant_db"), user, "UPDATE", "night_shift_rules", rule_id, None, request.dict())
        return {"message": "Night shift rule updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error updating night shift rule: {str(e)}")
    finally:
        db.close()

@router.delete("/night-shift-rules/{rule_id}")
def delete_night_shift_rule(rule_id: int, request: Request, user=Depends(get_current_user)):
    """Delete specific night shift rule"""
    db = get_tenant_session(user)
    try:
        rule = db.query(NightShiftRule).filter(NightShiftRule.id == rule_id).first()
        if not rule:
            raise HTTPException(404, "Night shift rule not found")
        
        old_values = rule.__dict__.copy()
        db.delete(rule)
        db.commit()
        audit_crud(request, user.get("tenant_db"), user, "DELETE", "night_shift_rules", rule_id, old_values, None)
        return {"message": "Night shift rule deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error deleting night shift rule: {str(e)}")
    finally:
        db.close()

# -------------------------------------------------------------------------
# DEBUG: CHECK ROSTER TABLE
# -------------------------------------------------------------------------
@router.get("/debug/roster-table")
def debug_roster_table(user=Depends(get_current_user)):
    db = get_tenant_session(user)
    try:
        # Get all roster entries
        roster_entries = db.query(EmployeeRoster).all()
        
        result = []
        for entry in roster_entries:
            result.append({
                "id": entry.id,
                "employee_id": entry.employee_id,
                "shift_id": entry.shift_id,
                "date": str(entry.date),
                "status": entry.status,
                "created_at": str(entry.created_at)
            })
        
        return {
            "total_entries": len(result),
            "entries": result
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

# -------------------------------------------------------------------------
# ON-CALL DUTY MANAGEMENT
# -------------------------------------------------------------------------
@router.get("/on-call")
def get_on_call_duties(
    date: Optional[str] = None,
    department_id: Optional[int] = None,
    user=Depends(get_current_user)
):
    """Get on-call duties for a specific date or date range"""
    db = get_tenant_session(user)
    try:
        query = db.query(OnCallDuty)
        
        if date:
            duty_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(OnCallDuty.date == duty_date)
        
        if department_id:
            query = query.filter(OnCallDuty.department_id == department_id)
        
        duties = query.all()
        
        # Get employee details
        result = []
        for duty in duties:
            employee = db.query(User).filter(User.id == duty.employee_id).first()
            result.append({
                "id": duty.id,
                "employee_id": duty.employee_id,
                "employee_name": employee.name if employee else "Unknown",
                "date": str(duty.date),
                "from_time": str(duty.from_time),
                "to_time": str(duty.to_time),
                "duty_type": duty.duty_type,
                "priority_level": duty.priority_level,
                "contact_number": duty.contact_number,
                "status": duty.status,
                "remarks": duty.remarks
            })
        
        return {"on_call_duties": result}
    except Exception as e:
        raise HTTPException(500, f"Error fetching on-call duties: {str(e)}")
    finally:
        db.close()

@router.post("/on-call")
def create_on_call_duty(
    request: OnCallDutyRequest,
    req: Request,
    user=Depends(get_current_user)
):
    """Create new on-call duty assignment"""
    db = get_tenant_session(user)
    try:
        duty_date = datetime.strptime(request.date, "%Y-%m-%d").date()
        from_time = datetime.strptime(request.from_time, "%H:%M").time()
        to_time = datetime.strptime(request.to_time, "%H:%M").time()
        
        new_duty = OnCallDuty(
            employee_id=request.employee_id,
            date=duty_date,
            from_time=from_time,
            to_time=to_time,
            duty_type=request.duty_type,
            department_id=request.department_id,
            priority_level=request.priority_level,
            contact_number=request.contact_number,
            remarks=request.remarks
        )
        
        db.add(new_duty)
        db.commit()
        db.refresh(new_duty)
        
        audit_crud(req, user.get("tenant_db"), user, "CREATE", "on_call_duties", new_duty.id, None, request.dict())
        return {"message": "On-call duty created successfully", "duty_id": new_duty.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error creating on-call duty: {str(e)}")
    finally:
        db.close()

@router.put("/on-call/{duty_id}")
def update_on_call_duty(
    duty_id: int,
    request: OnCallDutyRequest,
    req: Request,
    user=Depends(get_current_user)
):
    """Update on-call duty"""
    db = get_tenant_session(user)
    try:
        duty = db.query(OnCallDuty).filter(OnCallDuty.id == duty_id).first()
        if not duty:
            raise HTTPException(404, "On-call duty not found")
        
        duty_date = datetime.strptime(request.date, "%Y-%m-%d").date()
        from_time = datetime.strptime(request.from_time, "%H:%M").time()
        to_time = datetime.strptime(request.to_time, "%H:%M").time()
        
        duty.employee_id = request.employee_id
        duty.date = duty_date
        duty.from_time = from_time
        duty.to_time = to_time
        duty.duty_type = request.duty_type
        duty.department_id = request.department_id
        duty.priority_level = request.priority_level
        duty.contact_number = request.contact_number
        duty.remarks = request.remarks
        
        db.commit()
        audit_crud(req, user.get("tenant_db"), user, "UPDATE", "on_call_duties", duty_id, None, request.dict())
        return {"message": "On-call duty updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error updating on-call duty: {str(e)}")
    finally:
        db.close()

@router.delete("/on-call/{duty_id}")
def delete_on_call_duty(
    duty_id: int,
    request: Request,
    user=Depends(get_current_user)
):
    """Delete on-call duty"""
    db = get_tenant_session(user)
    try:
        duty = db.query(OnCallDuty).filter(OnCallDuty.id == duty_id).first()
        if not duty:
            raise HTTPException(404, "On-call duty not found")
        
        old_values = duty.__dict__.copy()
        db.delete(duty)
        db.commit()
        
        audit_crud(request, user.get("tenant_db"), user, "DELETE", "on_call_duties", duty_id, old_values, None)
        return {"message": "On-call duty deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error deleting on-call duty: {str(e)}")
    finally:
        db.close()

# -------------------------------------------------------------------------
# EMERGENCY CALL LOGGING
# -------------------------------------------------------------------------
@router.post("/emergency-call")
def log_emergency_call(
    request: EmergencyCallRequest,
    req: Request,
    user=Depends(get_current_user)
):
    """Log an emergency call"""
    db = get_tenant_session(user)
    try:
        call_time = datetime.strptime(request.call_time, "%Y-%m-%d %H:%M:%S")
        
        new_call = EmergencyCallLog(
            on_call_duty_id=request.on_call_duty_id,
            employee_id=request.employee_id,
            call_time=call_time,
            call_type=request.call_type,
            caller_details=request.caller_details,
            issue_description=request.issue_description
        )
        
        db.add(new_call)
        db.commit()
        db.refresh(new_call)
        
        audit_crud(req, user.get("tenant_db"), user, "CREATE", "emergency_call_logs", new_call.id, None, request.dict())
        return {"message": "Emergency call logged successfully", "call_id": new_call.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error logging emergency call: {str(e)}")
    finally:
        db.close()

@router.get("/emergency-calls")
def get_emergency_calls(
    duty_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    user=Depends(get_current_user)
):
    """Get emergency call logs"""
    db = get_tenant_session(user)
    try:
        query = db.query(EmergencyCallLog)
        
        if duty_id:
            query = query.filter(EmergencyCallLog.on_call_duty_id == duty_id)
        
        if employee_id:
            query = query.filter(EmergencyCallLog.employee_id == employee_id)
        
        calls = query.order_by(EmergencyCallLog.call_time.desc()).all()
        
        result = []
        for call in calls:
            employee = db.query(User).filter(User.id == call.employee_id).first()
            result.append({
                "id": call.id,
                "on_call_duty_id": call.on_call_duty_id,
                "employee_id": call.employee_id,
                "employee_name": employee.name if employee else "Unknown",
                "call_time": str(call.call_time),
                "response_time": str(call.response_time) if call.response_time else None,
                "call_type": call.call_type,
                "caller_details": call.caller_details,
                "issue_description": call.issue_description,
                "resolution_notes": call.resolution_notes,
                "call_duration": call.call_duration,
                "status": call.status
            })
        
        return {"emergency_calls": result}
    except Exception as e:
        raise HTTPException(500, f"Error fetching emergency calls: {str(e)}")
    finally:
        db.close()