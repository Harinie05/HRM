from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from utils.permission import require_permission
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
    user=Depends(require_permission("VIEW_ROSTER"))
):
    db = get_tenant_session(user)
    try:
        # Get all active employees, not just those with roster entries
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
    show_deleted: bool = False,
    user=Depends(get_current_user)  # Remove permission requirement
):
    db = get_tenant_session(user)
    try:
        # Convert string dates to date objects
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        # Get roster data first (include/exclude soft deleted based on parameter)
        roster_query = db.query(EmployeeRoster)
        if not show_deleted:
            roster_query = roster_query.filter(EmployeeRoster.deleted_at.is_(None))
        roster_data = roster_query.all()
        
        print(f"DEBUG: Total roster entries found: {len(roster_data)}")
        print(f"DEBUG: Date range requested: {start_dt} to {end_dt}")
        print(f"DEBUG: Show deleted: {show_deleted}")
        if roster_data:
            print(f"DEBUG: Sample roster entries: {[(r.employee_id, r.date, r.shift_id, getattr(r, 'employee_name', 'N/A'), getattr(r, 'employee_code', 'N/A'), getattr(r, 'deleted_at', 'N/A')) for r in roster_data[:5]]}")
        
        # Filter roster data by date range after fetching all
        roster_data_in_range = [r for r in roster_data if start_dt <= r.date <= end_dt]
        print(f"DEBUG: Roster entries in date range {start_dt} to {end_dt}: {len(roster_data_in_range)}")
        
        # Count unique employees with deleted entries for this date range
        deleted_employees_count = db.query(EmployeeRoster.employee_id).filter(
            EmployeeRoster.date >= start_dt,
            EmployeeRoster.date <= end_dt,
            EmployeeRoster.deleted_at.is_not(None)
        ).distinct().count()
        
        # Get unique employee IDs from roster data (show all employees with any roster entries)
        employee_ids = list(set([r.employee_id for r in roster_data]))
        print(f"DEBUG: Unique employee IDs from all roster data: {employee_ids}")
        print(f"DEBUG: Unique employee IDs from date range {start_dt} to {end_dt}: {list(set([r.employee_id for r in roster_data_in_range]))}")
        
        # REMOVED: view_self filtering - now all users can see all roster entries
        print(f"DEBUG: Showing all roster entries to user (view_self filtering removed)")
        
        # Get only users who have roster entries (employees manually added to roster)
        if employee_ids:
            emp_query = db.query(User).filter(User.id.in_(employee_ids))
            if department:
                emp_query = emp_query.filter(User.department_id == int(department))
            employees = emp_query.all()
            print(f"DEBUG: Found {len(employees)} employees with roster entries")
            print(f"DEBUG: Employee IDs in roster: {employee_ids}")
            print(f"DEBUG: Users found: {[(emp.id, emp.name) for emp in employees]}")
            
            # If no employees found in User table, check if they exist at all
            if not employees:
                all_users = db.query(User).all()
                print(f"DEBUG: All users in User table: {[(u.id, u.name) for u in all_users]}")
        else:
            employees = []
            print(f"DEBUG: No employees found with roster entries")
        
        # Get shifts from organization setup
        shifts = db.query(Shift).all()
        shift_map = {shift.id: shift for shift in shifts}
        
        # Organize data by employee
        result = []
        
        # Process employees found in User table
        for emp in employees:
            # Get roster entries for this employee (use all roster data, not just date range)
            emp_roster = [r for r in roster_data if r.employee_id == emp.id]
            roster_dict = {r.date.strftime("%Y-%m-%d"): r for r in emp_roster}
            
            # Get employee details - prioritize stored roster data, then user data
            employee_name = emp.name
            employee_code = emp.id  # fallback to user ID
            
            # Check if we have stored employee details in any roster entry
            stored_roster_entry = next((r for r in emp_roster if hasattr(r, 'employee_name') and r.employee_name), None)
            if stored_roster_entry:
                employee_name = stored_roster_entry.employee_name
                if hasattr(stored_roster_entry, 'employee_code') and stored_roster_entry.employee_code:
                    employee_code = stored_roster_entry.employee_code
            else:
                # Fall back to original logic
                try:
                    # First try to get from user's employee_code field
                    if hasattr(emp, 'employee_code') and emp.employee_code:
                        employee_code = emp.employee_code
                    else:
                        # Then try onboarding candidate employee_id
                        from models.models_tenant import OnboardingCandidate
                        onboarding = db.query(OnboardingCandidate).filter(
                            OnboardingCandidate.application_id == emp.id
                        ).first()
                        if onboarding and onboarding.employee_id:
                            employee_code = onboarding.employee_id
                            if onboarding.candidate_name:
                                employee_name = onboarding.candidate_name
                except Exception as e:
                    print(f"Warning: Could not fetch employee code for user {emp.id}: {e}")
                    # Keep the fallback value
            
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
            
            # Check if this employee has any deleted roster entries in the date range
            has_deleted_entries = any(r.deleted_at is not None for r in emp_roster)
            
            result.append({
                "employee_id": emp.id,
                "employee_name": employee_name,
                "employee_code": employee_code,
                "department": getattr(emp, 'department_name', 'Unknown') or 'Unknown',
                "schedule": schedule,
                "is_deleted": has_deleted_entries and show_deleted
            })
        
        # Process employees with roster entries but not found in User table
        processed_employee_ids = {emp.id for emp in employees}
        missing_employee_ids = set(employee_ids) - processed_employee_ids
        
        if missing_employee_ids:
            print(f"DEBUG: Processing {len(missing_employee_ids)} employees not found in User table: {missing_employee_ids}")
            
            for emp_id in missing_employee_ids:
                # Get roster entries for this employee (use all roster data, not just date range)
                emp_roster = [r for r in roster_data if r.employee_id == emp_id]
                roster_dict = {r.date.strftime("%Y-%m-%d"): r for r in emp_roster}
                
                # Use stored employee details from roster entries
                employee_name = f"Employee {emp_id}"
                employee_code = str(emp_id)
                
                stored_roster_entry = next((r for r in emp_roster if hasattr(r, 'employee_name') and r.employee_name), None)
                if stored_roster_entry:
                    employee_name = stored_roster_entry.employee_name
                    if hasattr(stored_roster_entry, 'employee_code') and stored_roster_entry.employee_code:
                        employee_code = stored_roster_entry.employee_code
                
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
                
                # Check if this employee has any deleted roster entries in the date range
                has_deleted_entries = any(r.deleted_at is not None for r in emp_roster)
                
                result.append({
                    "employee_id": emp_id,
                    "employee_name": employee_name,
                    "employee_code": employee_code,
                    "department": "Unknown",
                    "schedule": schedule,
                    "is_deleted": has_deleted_entries and show_deleted
                })
        
        return {"roster": result, "deleted_count": deleted_employees_count}
        
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
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None

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
    user=Depends(require_permission("MANAGE_ROSTER"))
):
    db = get_tenant_session(user)
    try:
        print(f"DEBUG: Saving roster entry: {request.dict()}")
        
        # TEMPORARILY DISABLE view_self permission check for save operation
        # user_permissions = user.get('permissions', [])
        
        roster_date = datetime.strptime(request.date, "%Y-%m-%d").date()
        
        # Use employee details from frontend if provided, otherwise fetch from database
        employee_name = request.employee_name
        employee_code = request.employee_code
        
        if not employee_name or not employee_code:
            # Fallback: Get employee details from database
            employee = db.query(User).filter(User.id == request.employee_id).first()
            if not employee:
                raise HTTPException(404, "Employee not found")
            
            # Get employee code - prioritize user's employee_code field first
            if not employee_name:
                employee_name = employee.name
            if not employee_code:
                employee_code = employee.id  # fallback to user ID
                try:
                    # First try to get from user's employee_code field
                    if hasattr(employee, 'employee_code') and employee.employee_code:
                        employee_code = employee.employee_code
                    else:
                        # Then try onboarding candidate employee_id
                        from models.models_tenant import OnboardingCandidate
                        onboarding = db.query(OnboardingCandidate).filter(
                            OnboardingCandidate.application_id == employee.id
                        ).first()
                        if onboarding and onboarding.employee_id:
                            employee_code = onboarding.employee_id
                            if onboarding.candidate_name:
                                employee_name = onboarding.candidate_name
                except Exception as e:
                    print(f"Warning: Could not fetch employee code for user {employee.id}: {e}")
        
        # Check if entry exists
        existing = db.query(EmployeeRoster).filter(
            EmployeeRoster.employee_id == request.employee_id,
            EmployeeRoster.date == roster_date
        ).first()
        
        print(f"DEBUG: Using employee details - Name: {employee_name}, Code: {employee_code}")
        
        if existing:
            if request.shift_id is None:
                # Soft delete the entry if shift_id is None (clearing)
                existing.deleted_at = datetime.now()
                print("DEBUG: Soft deleted existing entry")
            else:
                existing.shift_id = request.shift_id
                existing.status = request.status
                existing.deleted_at = None  # Restore if previously deleted
                # Update stored employee details with frontend data
                existing.employee_name = employee_name
                existing.employee_code = str(employee_code)
                print("DEBUG: Updated existing entry")
        else:
            if request.shift_id is not None:
                new_roster = EmployeeRoster(
                    employee_id=request.employee_id,
                    shift_id=request.shift_id,
                    date=roster_date,
                    status=request.status,
                    employee_name=employee_name,
                    employee_code=str(employee_code)
                )
                db.add(new_roster)
                print(f"DEBUG: Created new roster entry with frontend data")
        
        db.commit()
        audit_crud(req, db, user, "SAVE_ROSTER", "employee_roster", str(request.employee_id), {}, request.dict())
        print("DEBUG: Transaction committed successfully")
        return {"message": "Roster saved successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error saving roster: {str(e)}")
    finally:
        db.close()

@router.delete("/remove-employee/{employee_id}")
def remove_employee_from_roster(
    employee_id: int,
    req: Request,
    user=Depends(require_permission("MANAGE_ROSTER"))
):
    db = get_tenant_session(user)
    try:
        # Soft delete all roster entries for this employee
        roster_entries = db.query(EmployeeRoster).filter(
            EmployeeRoster.employee_id == employee_id,
            EmployeeRoster.deleted_at.is_(None)
        ).all()
        
        for entry in roster_entries:
            entry.deleted_at = datetime.now()
        
        db.commit()
        audit_crud(req, db, user, "REMOVE_EMPLOYEE_FROM_ROSTER", "employee_roster", str(employee_id), {}, {"action": "soft_delete_all"})
        return {"message": "Employee removed from roster successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error removing employee from roster: {str(e)}")
    finally:
        db.close()
@router.post("/copy-last-week")
def copy_last_week_roster(
    start_date: str,
    request: Request,
    user=Depends(require_permission("MANAGE_ROSTER"))
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
        audit_crud(request, db, user, "COPY_ROSTER", "employee_roster", "0", {}, {"action": "copy_last_week", "start_date": start_date})
        return {"message": "Last week roster copied successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error copying roster: {str(e)}")
    finally:
        db.close()

# -------------------------------------------------------------------------
# WEEKLY ROSTER MANAGEMENT
# -------------------------------------------------------------------------
class WeeklyRosterRequest(BaseModel):
    employee_id: int
    week_start_date: str
    assignments: dict  # {"monday": {"shift_id": 1}, "tuesday": {"shift_id": 2}, ...}

@router.post("/weekly-assign")
def assign_weekly_roster(
    request: WeeklyRosterRequest,
    req: Request,
    user=Depends(require_permission("MANAGE_ROSTER"))
):
    """Assign shifts for an entire week for an employee"""
    db = get_tenant_session(user)
    try:
        week_start = datetime.strptime(request.week_start_date, "%Y-%m-%d").date()
        
        # Days mapping
        days_map = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6
        }
        
        for day_name, assignment in request.assignments.items():
            if day_name.lower() in days_map:
                day_offset = days_map[day_name.lower()]
                roster_date = week_start + timedelta(days=day_offset)
                
                # Check if entry exists
                existing = db.query(EmployeeRoster).filter(
                    EmployeeRoster.employee_id == request.employee_id,
                    EmployeeRoster.date == roster_date
                ).first()
                
                if assignment.get("shift_id"):
                    # Assign shift
                    if existing:
                        existing.shift_id = assignment["shift_id"]
                        existing.status = "Scheduled"
                        existing.deleted_at = None
                    else:
                        new_roster = EmployeeRoster(
                            employee_id=request.employee_id,
                            shift_id=assignment["shift_id"],
                            date=roster_date,
                            status="Scheduled"
                        )
                        db.add(new_roster)
                else:
                    # Clear assignment
                    if existing:
                        existing.deleted_at = datetime.now()
        
        db.commit()
        audit_crud(req, db, user, "WEEKLY_ROSTER_ASSIGN", "employee_roster", str(request.employee_id), {}, request.dict())
        return {"message": "Weekly roster assigned successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error assigning weekly roster: {str(e)}")
    finally:
        db.close()

@router.get("/weekly-calendar")
def get_weekly_calendar(
    week_start_date: str,
    department: Optional[str] = None,
    user=Depends(get_current_user)  # Remove permission requirement
):
    """Get weekly roster calendar view"""
    db = get_tenant_session(user)
    try:
        week_start = datetime.strptime(week_start_date, "%Y-%m-%d").date()
        week_end = week_start + timedelta(days=6)
        
        # Get all employees (or filter by department)
        emp_query = db.query(User).filter(User.status == "Active")
        if department:
            emp_query = emp_query.filter(User.department_id == int(department))
        employees = emp_query.all()
        
        # Get roster data for the week
        roster_data = db.query(EmployeeRoster).filter(
            EmployeeRoster.date >= week_start,
            EmployeeRoster.date <= week_end,
            EmployeeRoster.deleted_at.is_(None)
        ).all()
        
        # Get shifts
        shifts = db.query(Shift).all()
        shift_map = {shift.id: shift for shift in shifts}
        
        # Get employees who have ever been added to roster (including soft deleted)
        all_roster_entries = db.query(EmployeeRoster).all()
        employee_ids_in_roster = list(set([r.employee_id for r in all_roster_entries]))
        employees_with_roster = [emp for emp in employees if emp.id in employee_ids_in_roster]
        
        # Organize data
        result = []
        for emp in employees_with_roster:
            # Get employee code - prioritize user's employee_code field first
            employee_code = emp.id  # fallback to user ID
            try:
                # First try to get from user's employee_code field
                if hasattr(emp, 'employee_code') and emp.employee_code:
                    employee_code = emp.employee_code
                else:
                    # Then try onboarding candidate employee_id
                    from models.models_tenant import OnboardingCandidate
                    onboarding = db.query(OnboardingCandidate).filter(
                        OnboardingCandidate.application_id == emp.id
                    ).first()
                    if onboarding and onboarding.employee_id:
                        employee_code = onboarding.employee_id
            except Exception as e:
                print(f"Warning: Could not fetch employee code for user {emp.id}: {e}")
                # Keep the fallback value
            
            # Get roster entries for this employee
            emp_roster = [r for r in roster_data if r.employee_id == emp.id]
            roster_dict = {r.date: r for r in emp_roster}
            
            # Generate week schedule
            week_schedule = {}
            for i in range(7):
                current_date = week_start + timedelta(days=i)
                day_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                day_name = day_names[i]
                
                roster_entry = roster_dict.get(current_date)
                if roster_entry:
                    shift_info = shift_map.get(roster_entry.shift_id)
                    week_schedule[day_name] = {
                        "shift_id": roster_entry.shift_id,
                        "shift_name": shift_info.name if shift_info else "Unknown",
                        "start_time": str(shift_info.start_time) if shift_info else None,
                        "end_time": str(shift_info.end_time) if shift_info else None,
                        "status": "Assigned"
                    }
                else:
                    week_schedule[day_name] = {
                        "shift_id": None,
                        "shift_name": "Assign",
                        "start_time": None,
                        "end_time": None,
                        "status": "Unassigned"
                    }
            
            result.append({
                "employee_id": emp.id,
                "employee_name": emp.name,
                "employee_code": employee_code,
                "department": getattr(emp, 'department_name', 'Unknown'),
                "week_schedule": week_schedule
            })
        
        return {"weekly_roster": result, "week_start": str(week_start), "week_end": str(week_end)}
        
    except Exception as e:
        raise HTTPException(500, f"Error fetching weekly calendar: {str(e)}")
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
    user=Depends(require_permission("MANAGE_NIGHT_SHIFT_RULES"))
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
        audit_crud(req, db, user, "UPDATE_NIGHT_SHIFT_RULES", "night_shift_rules", str(getattr(rules, 'id', 0)), {}, request.dict())
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
        audit_crud(req, db, user, "UPDATE_NIGHT_SHIFT_RULE", "night_shift_rules", str(rule_id), {}, request.dict())
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
        audit_crud(request, db, user, "DELETE_NIGHT_SHIFT_RULE", "night_shift_rules", str(rule_id), old_values, {})
        return {"message": "Night shift rule deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error deleting night shift rule: {str(e)}")
    finally:
        db.close()

# -------------------------------------------------------------------------
# ADD EMPLOYEE TO ROSTER
# -------------------------------------------------------------------------
class AddEmployeeRequest(BaseModel):
    employee_id: int
    week_start_date: str

@router.post("/add-employee-json")
def add_employee_to_roster_json(
    request: AddEmployeeRequest,
    req: Request,
    user=Depends(require_permission("MANAGE_ROSTER"))
):
    """Add an employee to the weekly roster via JSON payload"""
    return add_employee_to_roster(request.employee_id, request.week_start_date, req, user)

@router.post("/add-employee")
def add_employee_to_roster(
    employee_id: int,
    week_start_date: str,
    req: Request,
    user=Depends(require_permission("MANAGE_ROSTER"))
):
    """Add an employee to the weekly roster with default 'Assign' status"""
    db = get_tenant_session(user)
    try:
        week_start = datetime.strptime(week_start_date, "%Y-%m-%d").date()
        
        # Check if employee exists
        employee = db.query(User).filter(User.id == employee_id).first()
        if not employee:
            raise HTTPException(404, "Employee not found")
        
        # Create roster entries for the week (7 days) with no shifts assigned
        entries_created = 0
        for i in range(7):
            roster_date = week_start + timedelta(days=i)
            
            # Check if entry already exists (including soft deleted)
            existing = db.query(EmployeeRoster).filter(
                EmployeeRoster.employee_id == employee_id,
                EmployeeRoster.date == roster_date
            ).first()
            
            if existing:
                # Restore if soft deleted
                if existing.deleted_at:
                    existing.deleted_at = None
                    existing.status = "Unscheduled"
                    entries_created += 1
            else:
                # Create new entry
                new_roster = EmployeeRoster(
                    employee_id=employee_id,
                    shift_id=None,
                    date=roster_date,
                    status="Unscheduled"
                )
                db.add(new_roster)
                entries_created += 1
        
        db.commit()
        audit_crud(req, db, user, "ADD_EMPLOYEE_TO_ROSTER", "employee_roster", str(employee_id), {}, {"week_start_date": week_start_date, "entries_created": entries_created})
        return {"message": f"Employee {employee.name} added to roster successfully", "entries_created": entries_created}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error adding employee to roster: {str(e)}")
    finally:
        db.close()

@router.post("/assign-shift")
def assign_shift_to_employee(
    employee_id: int,
    date: str,
    shift_id: int,
    req: Request,
    user=Depends(require_permission("MANAGE_ROSTER"))
):
    """Assign a specific shift to an employee for a specific date"""
    db = get_tenant_session(user)
    try:
        roster_date = datetime.strptime(date, "%Y-%m-%d").date()
        
        # Check if shift exists
        shift = db.query(Shift).filter(Shift.id == shift_id).first()
        if not shift:
            raise HTTPException(404, "Shift not found")
        
        # Find or create roster entry
        existing = db.query(EmployeeRoster).filter(
            EmployeeRoster.employee_id == employee_id,
            EmployeeRoster.date == roster_date
        ).first()
        
        if existing:
            existing.shift_id = shift_id
            existing.status = "Scheduled"
            existing.deleted_at = None
        else:
            new_roster = EmployeeRoster(
                employee_id=employee_id,
                shift_id=shift_id,
                date=roster_date,
                status="Scheduled"
            )
            db.add(new_roster)
        
        db.commit()
        audit_crud(req, db, user, "ASSIGN_SHIFT", "employee_roster", str(employee_id), {}, {"date": date, "shift_id": shift_id})
        return {"message": f"Shift {shift.name} assigned successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error assigning shift: {str(e)}")
    finally:
        db.close()

@router.delete("/clear-shift")
def clear_shift_assignment(
    employee_id: int,
    date: str,
    req: Request,
    user=Depends(require_permission("MANAGE_ROSTER"))
):
    """Clear shift assignment for an employee on a specific date"""
    db = get_tenant_session(user)
    try:
        roster_date = datetime.strptime(date, "%Y-%m-%d").date()
        
        # Find roster entry
        existing = db.query(EmployeeRoster).filter(
            EmployeeRoster.employee_id == employee_id,
            EmployeeRoster.date == roster_date
        ).first()
        
        if existing:
            existing.shift_id = None
            existing.status = "Unscheduled"
            # Don't delete, just clear the assignment
        
        db.commit()
        audit_crud(req, db, user, "CLEAR_SHIFT", "employee_roster", str(employee_id), {}, {"date": date})
        return {"message": "Shift assignment cleared successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error clearing shift: {str(e)}")
    finally:
        db.close()

# -------------------------------------------------------------------------
# DEBUG: CHECK ROSTER TABLE
# -------------------------------------------------------------------------
@router.post("/create-sample-data")
def create_sample_roster_data(user=Depends(get_current_user)):
    """Create sample roster data for current user (for testing view_self permission)"""
    db = get_tenant_session(user)
    try:
        current_user_id = user.get('user_id')
        if not current_user_id:
            raise HTTPException(400, "No user ID found")
        
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(404, "User not found")
        
        employee_code = getattr(current_user, 'employee_code', None)
        if not employee_code:
            raise HTTPException(400, "User has no employee code")
        
        # Get current week dates (Monday to Sunday)
        from datetime import datetime, timedelta
        today = datetime.now().date()
        monday = today - timedelta(days=today.weekday())
        
        entries_created = 0
        for i in range(7):  # Create entries for the whole week
            roster_date = monday + timedelta(days=i)
            
            # Check if entry already exists
            existing = db.query(EmployeeRoster).filter(
                EmployeeRoster.employee_id == current_user_id,
                EmployeeRoster.date == roster_date
            ).first()
            
            if not existing:
                # Create new roster entry with shift_id=1 (assuming shift 1 exists)
                new_roster = EmployeeRoster(
                    employee_id=current_user_id,
                    shift_id=1,  # Default to shift 1
                    date=roster_date,
                    status="Scheduled",
                    employee_name=current_user.name,
                    employee_code=str(employee_code)
                )
                db.add(new_roster)
                entries_created += 1
        
        db.commit()
        return {
            "message": f"Created {entries_created} roster entries for {current_user.name} (code: {employee_code})",
            "entries_created": entries_created,
            "week_start": str(monday)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error creating sample data: {str(e)}")
    finally:
        db.close()

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
                "employee_name": getattr(entry, 'employee_name', None),
                "employee_code": getattr(entry, 'employee_code', None),
                "deleted_at": str(entry.deleted_at) if entry.deleted_at else None,
                "created_at": str(entry.created_at)
            })
        
        # Also get all users
        users = db.query(User).all()
        user_info = []
        for user_obj in users:
            user_info.append({
                "id": user_obj.id,
                "name": user_obj.name,
                "employee_code": getattr(user_obj, 'employee_code', None),
                "status": getattr(user_obj, 'status', None)
            })
        
        return {
            "total_entries": len(result),
            "entries": result,
            "users": user_info
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
    user=Depends(require_permission("MANAGE_ON_CALL_DUTY"))
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
        
        audit_crud(req, db, user, "CREATE_ON_CALL_DUTY", "on_call_duties", str(new_duty.id), {}, request.dict())
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
        audit_crud(req, db, user, "UPDATE_ON_CALL_DUTY", "on_call_duties", str(duty_id), {}, request.dict())
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
        
        audit_crud(request, db, user, "DELETE_ON_CALL_DUTY", "on_call_duties", str(duty_id), old_values, {})
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
        
        audit_crud(req, db, user, "LOG_EMERGENCY_CALL", "emergency_call_logs", str(new_call.id), {}, request.dict())
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