from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta

from routes.hospital import get_current_user
from database import get_tenant_engine
from utils.audit_logger import audit_crud
from models.models_tenant import EmployeeRoster, NightShiftRule, Shift, Employee, User

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