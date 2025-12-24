from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_
from database import get_tenant_db
from typing import List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel

router = APIRouter(prefix="/payroll/validation", tags=["Payroll Validation"])

class ValidationIssue(BaseModel):
    employee_id: str
    employee_name: str
    issue_type: str
    issue_description: str
    date: str
    severity: str  # "critical", "warning", "info"
    action_required: str

class PayrollValidationResponse(BaseModel):
    can_run_payroll: bool
    total_issues: int
    critical_issues: int
    warning_issues: int
    issues: List[ValidationIssue]

@router.post("/check/{month}/{year}")
def validate_payroll_readiness(
    month: int, 
    year: int,
    db: Session = Depends(get_tenant_db)
) -> PayrollValidationResponse:
    """
    Comprehensive payroll validation with smart attendance logic
    - Blocks only for critical issues (pending approvals, incomplete punches without regularization)
    - Allows payroll with absent days (warnings)
    """
    issues = []
    
    # Debug: Check salary structures and their employee links
    ss_debug = text("SELECT id, name, employee_ids FROM salary_structures")
    structures = db.execute(ss_debug).fetchall()
    print(f"DEBUG: Salary structures:")
    for ss in structures:
        print(f"  - ID: {ss.id}, Name: {ss.name}, Employee IDs: {ss.employee_ids}")
    
    # Get employees linked to salary structures using precise matching
    employees_query = text("""
        SELECT DISTINCT u.id, u.employee_code, u.name, u.status
        FROM users u
        JOIN salary_structures ss ON (
            CONCAT(',', ss.employee_ids, ',') LIKE CONCAT('%,', u.id, ',%') OR 
            CONCAT(',', ss.employee_ids, ',') LIKE CONCAT('%,user_', u.id, ',%') OR
            (u.employee_code IS NOT NULL AND CONCAT(',', ss.employee_ids, ',') LIKE CONCAT('%,', u.employee_code, ',%'))
        )
    """)
    employees = db.execute(employees_query).fetchall()
    
    print(f"DEBUG: Found {len(employees)} employees linked to salary structures for validation")
    for emp in employees:
        print(f"DEBUG: Employee - ID: {emp.id}, Code: {emp.employee_code}, Name: {emp.name}")
    
    # Debug: Check what's in attendance_punches table
    punch_debug = text("SELECT employee_id, date, in_time, out_time FROM attendance_punches WHERE date >= '2025-12-01' ORDER BY date DESC LIMIT 10")
    punch_records = db.execute(punch_debug).fetchall()
    print(f"DEBUG: Recent punch records:")
    for pr in punch_records:
        print(f"  - employee_id: {pr.employee_id}, date: {pr.date}, in: {pr.in_time}, out: {pr.out_time}")
    
    # Debug: Check if employee 5 exists
    emp5_debug = text("SELECT id, employee_code, name, status FROM users WHERE id = 5")
    emp5 = db.execute(emp5_debug).fetchone()
    print(f"DEBUG: Employee 5 details: {dict(emp5._mapping) if emp5 else 'NOT FOUND'}")
    
    for emp in employees:
        emp_issues = []
        print(f"\nDEBUG: Processing employee {emp.id} ({emp.name})")
        
        # 1. Check pending leave applications (CRITICAL)
        pending_leaves = check_pending_leaves(db, emp.id, month, year)
        emp_issues.extend(pending_leaves)
        
        # 2. Check comprehensive attendance (includes absent days as warnings)
        attendance_issues = check_missing_attendance(db, emp.id, emp.employee_code, month, year)
        emp_issues.extend(attendance_issues)
        
        # 3. Check pending OD approvals (CRITICAL)
        pending_od = check_pending_od_approvals(db, emp.id, month, year)
        emp_issues.extend(pending_od)
        
        # 4. Check pending regularization (CRITICAL)
        pending_regularization = check_pending_regularization(db, emp.id, month, year)
        emp_issues.extend(pending_regularization)
        
        # Add employee info to issues
        for issue in emp_issues:
            issue.update({
                'employee_id': emp.employee_code or str(emp.id),
                'employee_name': emp.name
            })
            issues.append(ValidationIssue(**issue))
    
    # Count issues by severity
    critical_count = sum(1 for issue in issues if issue.severity == "critical")
    warning_count = sum(1 for issue in issues if issue.severity == "warning")
    
    # Payroll can run with warnings (absent days) but not with critical issues
    can_run = critical_count == 0
    
    return PayrollValidationResponse(
        can_run_payroll=can_run,
        total_issues=len(issues),
        critical_issues=critical_count,
        warning_issues=warning_count,
        issues=issues
    )

def check_pending_leaves(db: Session, employee_id: int, month: int, year: int) -> List[Dict]:
    """Check for pending leave applications"""
    try:
        query = text("""
            SELECT la.id, la.from_date, la.to_date, la.status, la.employee_id
            FROM leave_applications la
            WHERE la.employee_id = :emp_id
            AND LOWER(la.status) = 'pending'
            AND (
                (MONTH(la.from_date) = :month AND YEAR(la.from_date) = :year) OR
                (MONTH(la.to_date) = :month AND YEAR(la.to_date) = :year) OR
                (la.from_date <= :end_date AND la.to_date >= :start_date)
            )
        """)
        
        start_date = f"{year}-{month:02d}-01"
        end_date = f"{year}-{month:02d}-31"
        
        results = db.execute(query, {
            'emp_id': employee_id,
            'month': month,
            'year': year,
            'start_date': start_date,
            'end_date': end_date
        }).fetchall()
        
        issues = []
        for row in results:
            issues.append({
                'issue_type': 'Pending Leave Application',
                'issue_description': f"Leave application from {row.from_date} to {row.to_date} is pending approval",
                'date': str(row.from_date),
                'severity': 'critical',
                'action_required': 'Approve or reject leave application before running payroll'
            })
        
        return issues
    except Exception as e:
        print(f"Error checking pending leaves: {e}")
        return []

def check_missing_attendance(db: Session, employee_id: int, employee_code: str, month: int, year: int) -> List[Dict]:
    """Comprehensive attendance validation with all scenarios"""
    try:
        query = text("""
            SELECT DATE(d.date) as check_date
            FROM (
                SELECT DATE_ADD(:start_date, INTERVAL seq.seq DAY) as date
                FROM (
                    SELECT 0 as seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION 
                    SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION 
                    SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION 
                    SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION 
                    SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION 
                    SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION 
                    SELECT 30
                ) seq
            ) d
            WHERE d.date <= :end_date
            AND WEEKDAY(d.date) NOT IN (5, 6)  -- Exclude weekends
            AND d.date NOT IN (
                SELECT date FROM holidays WHERE date BETWEEN :start_date AND :end_date
            )
            AND d.date <= CURDATE()
        """)
        
        start_date = f"{year}-{month:02d}-01"
        end_date = f"{year}-{month:02d}-31"
        
        working_days = db.execute(query, {
            'start_date': start_date,
            'end_date': end_date
        }).fetchall()
        
        issues = []
        
        for day_row in working_days:
            check_date = day_row.check_date
            date_str = str(check_date)
            
            # 1. Check approved leaves
            leave_query = text("""
                SELECT id FROM leave_applications 
                WHERE employee_id = :emp_id AND status = 'approved'
                AND :check_date BETWEEN from_date AND to_date
            """)
            approved_leave = db.execute(leave_query, {'emp_id': employee_id, 'check_date': check_date}).fetchone()
            
            if approved_leave:
                continue  # Skip - approved leave
            
            # 2. Check approved OD applications
            od_query = text("""
                SELECT id FROM od_applications 
                WHERE employee_id = :emp_id AND status = 'approved'
                AND od_date = :check_date
            """)
            approved_od = db.execute(od_query, {'emp_id': employee_id, 'check_date': check_date}).fetchone()
            
            if approved_od:
                continue  # Skip - approved OD (counts as present)
            
            # 3. Check attendance punches - try multiple employee ID formats
            punch_query = text("""
                SELECT in_time, out_time, employee_id FROM attendance_punches 
                WHERE (employee_id = :emp_id OR employee_id = :emp_code OR employee_id = :emp_str) 
                AND date = :check_date
            """)
            punch_record = db.execute(punch_query, {
                'emp_id': employee_id, 
                'emp_code': employee_code or '',
                'emp_str': str(employee_id),
                'check_date': check_date
            }).fetchone()
            
            print(f"DEBUG: Employee {employee_id} (code: {employee_code}), Date {check_date}, Punch: {punch_record}")
            
            if punch_record:
                # Check for incomplete punches (missing in or out)
                # Handle both NULL and empty string cases
                has_in_time = punch_record.in_time is not None and str(punch_record.in_time).strip() != '' and str(punch_record.in_time) != '-'
                has_out_time = punch_record.out_time is not None and str(punch_record.out_time).strip() != '' and str(punch_record.out_time) != '-'
                
                print(f"DEBUG: has_in_time={has_in_time}, has_out_time={has_out_time}, in_time={punch_record.in_time}, out_time={punch_record.out_time}, stored_emp_id={punch_record.employee_id}")
                
                if not has_in_time or not has_out_time:
                    # Check if there's approved regularization for this
                    reg_query = text("""
                        SELECT id FROM attendance_regularizations 
                        WHERE employee_id = :emp_id AND status = 'approved'
                        AND punch_date = :check_date
                    """)
                    approved_reg = db.execute(reg_query, {'emp_id': employee_id, 'check_date': check_date}).fetchone()
                    
                    print(f"DEBUG: approved_reg={approved_reg}")
                    
                    if not approved_reg:
                        # Incomplete punch without approved regularization - CRITICAL
                        missing_type = "Missing OUT" if has_in_time else "Missing IN"
                        print(f"DEBUG: Adding critical issue - {missing_type}")
                        issues.append({
                            'issue_type': 'Incomplete Punch',
                            'issue_description': f"{missing_type} punch for {date_str} - requires regularization",
                            'date': date_str,
                            'severity': 'critical',
                            'action_required': 'Apply for attendance regularization'
                        })
                continue  # Has punch record (complete or handled)
            
            # 4. No punch record - check for pending requests
            # Check pending leave applications
            pending_leave_query = text("""
                SELECT id FROM leave_applications 
                WHERE employee_id = :emp_id AND status = 'pending'
                AND :check_date BETWEEN from_date AND to_date
            """)
            pending_leave = db.execute(pending_leave_query, {'emp_id': employee_id, 'check_date': check_date}).fetchone()
            
            if pending_leave:
                continue  # Skip - pending leave application exists
            
            # Check pending OD applications
            pending_od_query = text("""
                SELECT id FROM od_applications 
                WHERE employee_id = :emp_id AND status = 'pending'
                AND od_date = :check_date
            """)
            pending_od = db.execute(pending_od_query, {'emp_id': employee_id, 'check_date': check_date}).fetchone()
            
            if pending_od:
                continue  # Skip - pending OD application exists
            
            # Check pending regularization
            pending_reg_query = text("""
                SELECT id FROM attendance_regularizations 
                WHERE employee_id = :emp_id AND status = 'pending'
                AND punch_date = :check_date
            """)
            pending_reg = db.execute(pending_reg_query, {'emp_id': employee_id, 'check_date': check_date}).fetchone()
            
            if pending_reg:
                continue  # Skip - pending regularization exists
            
            # 5. No record and no pending requests = ABSENT (WARNING - allows payroll with LOP)
            issues.append({
                'issue_type': 'Absent',
                'issue_description': f"No attendance record for {date_str} - marked as absent",
                'date': date_str,
                'severity': 'warning',  # Always warning - allows payroll to run with LOP deduction
                'action_required': 'Apply for leave, OD, or regularization if employee was present'
            })
        
        return issues
    except Exception as e:
        print(f"Error in attendance validation: {e}")
        return []

def check_pending_od_approvals(db: Session, employee_id: int, month: int, year: int) -> List[Dict]:
    """Check for pending OD (On Duty) approvals"""
    try:
        query = text("""
            SELECT od.id, od.od_date, od.purpose, od.status
            FROM od_applications od
            WHERE od.employee_id = :emp_id 
            AND od.status = 'pending'
            AND MONTH(od.od_date) = :month 
            AND YEAR(od.od_date) = :year
        """)
        
        results = db.execute(query, {
            'emp_id': employee_id,
            'month': month,
            'year': year
        }).fetchall()
        
        issues = []
        for row in results:
            issues.append({
                'issue_type': 'Pending OD Approval',
                'issue_description': f"OD application for {row.od_date} is pending approval - {row.purpose}",
                'date': str(row.od_date),
                'severity': 'critical',
                'action_required': 'Approve or reject OD application'
            })
        
        return issues
    except Exception:
        return []

def check_pending_regularization(db: Session, employee_id: int, month: int, year: int) -> List[Dict]:
    """Check for pending attendance regularization requests"""
    try:
        query = text("""
            SELECT ar.id, ar.punch_date, ar.reason, ar.status, ar.issue_type
            FROM attendance_regularizations ar
            WHERE ar.employee_id = :emp_id 
            AND ar.status = 'pending'
            AND MONTH(ar.punch_date) = :month 
            AND YEAR(ar.punch_date) = :year
        """)
        
        results = db.execute(query, {
            'emp_id': employee_id,
            'month': month,
            'year': year
        }).fetchall()
        
        issues = []
        for row in results:
            issues.append({
                'issue_type': 'Pending Regularization',
                'issue_description': f"Attendance regularization for {row.punch_date} is pending - {row.issue_type}: {row.reason}",
                'date': str(row.punch_date),
                'severity': 'critical',
                'action_required': 'Approve or reject regularization request'
            })
        
        return issues
    except Exception:
        return []

def check_incomplete_punches(db: Session, employee_id: int, employee_code: str, month: int, year: int) -> List[Dict]:
    """Check for incomplete punch records (only in/out without pair)"""
    try:
        print(f"Checking incomplete punches for employee_id: {employee_id}, employee_code: {employee_code}")
        
        # Check both employee_id and employee_code matching
        query = text("""
            SELECT DATE(CONCAT(date, ' ', COALESCE(in_time, '00:00:00'))) as punch_date, 
                   COUNT(CASE WHEN in_time IS NOT NULL THEN 1 END) as in_count,
                   COUNT(CASE WHEN out_time IS NOT NULL THEN 1 END) as out_count,
                   GROUP_CONCAT(COALESCE(TIME(in_time), 'NULL') ORDER BY date) as in_times,
                   GROUP_CONCAT(COALESCE(TIME(out_time), 'NULL') ORDER BY date) as out_times,
                   employee_id
            FROM attendance_punches 
            WHERE (employee_id = :emp_id OR employee_id = :emp_code)
            AND MONTH(date) = :month 
            AND YEAR(date) = :year
            GROUP BY DATE(date), employee_id
            HAVING (COUNT(CASE WHEN in_time IS NOT NULL THEN 1 END) != COUNT(CASE WHEN out_time IS NOT NULL THEN 1 END))
               OR (COUNT(CASE WHEN in_time IS NOT NULL THEN 1 END) = 0 AND COUNT(CASE WHEN out_time IS NOT NULL THEN 1 END) = 0)
        """)
        
        results = db.execute(query, {
            'emp_id': employee_id,
            'emp_code': employee_code,
            'month': month,
            'year': year
        }).fetchall()
        
        print(f"Found {len(results)} incomplete punch records")
        for r in results:
            print(f"Incomplete punch: date={r.punch_date}, in_count={r.in_count}, out_count={r.out_count}, emp_id={r.employee_id}")
        
        issues = []
        for row in results:
            if row.in_count != row.out_count:
                issues.append({
                    'issue_type': 'Incomplete Punch Record',
                    'issue_description': f"Incomplete punches on {row.punch_date} - {row.in_count} check-ins, {row.out_count} check-outs (In: {row.in_times}, Out: {row.out_times})",
                    'date': str(row.punch_date).split()[0],  # Extract just the date part
                    'severity': 'critical',
                    'action_required': 'Add missing punch record or apply for regularization'
                })
        
        return issues
    except Exception as e:
        print(f"Error checking incomplete punches: {e}")
        return []

@router.get("/debug/punches/{employee_id}/{month}/{year}")
def debug_punch_records(
    employee_id: str,
    month: int,
    year: int,
    db: Session = Depends(get_tenant_db)
):
    """Debug punch records for specific employee"""
    try:
        # Get all punch records for this employee
        query = text("""
            SELECT employee_id, date, in_time, out_time
            FROM attendance_punches 
            WHERE employee_id = :emp_id
            AND MONTH(date) = :month 
            AND YEAR(date) = :year
            ORDER BY date
        """)
        
        punches = db.execute(query, {
            'emp_id': employee_id,
            'month': month,
            'year': year
        }).fetchall()
        
        # Group by date and count
        daily_counts = {}
        for punch in punches:
            date_str = str(punch.date)
            if date_str not in daily_counts:
                daily_counts[date_str] = {'in_time': None, 'out_time': None}
            daily_counts[date_str]['in_time'] = str(punch.in_time) if punch.in_time else None
            daily_counts[date_str]['out_time'] = str(punch.out_time) if punch.out_time else None
        
        # Also check if user exists
        user_query = text("SELECT id, employee_code, name FROM users WHERE employee_code = :emp_code OR id = :emp_id")
        user = db.execute(user_query, {'emp_code': employee_id, 'emp_id': employee_id}).fetchone()
        
        return {
            "employee_id": employee_id,
            "month": month,
            "year": year,
            "user_found": dict(user._mapping) if user else None,
            "total_punches": len(punches),
            "punch_records": [dict(p._mapping) for p in punches],
            "daily_summary": {date: {"in_time": times['in_time'], "out_time": times['out_time'], "complete": times['in_time'] is not None and times['out_time'] is not None} for date, times in daily_counts.items()},
            "incomplete_days": [date for date, times in daily_counts.items() if times['in_time'] is None or times['out_time'] is None]
        }
    except Exception as e:
        return {"error": str(e)}

@router.put("/update-name/{employee_code}/{new_name}")
def update_employee_name(
    employee_code: str,
    new_name: str,
    db: Session = Depends(get_tenant_db)
):
    """Update employee name"""
    try:
        update_query = text("UPDATE users SET name = :name WHERE employee_code = :emp_code")
        result = db.execute(update_query, {'name': new_name, 'emp_code': employee_code})
        db.commit()
        
        return {"message": f"Updated employee {employee_code} name to {new_name}"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@router.post("/test-data/{employee_code}")
def create_test_data(
    employee_code: str,
    db: Session = Depends(get_tenant_db)
):
    """Create test data for validation testing"""
    try:
        from datetime import date, time
        
        # Create or update user with employee code
        user_query = text("SELECT id FROM users WHERE employee_code = :emp_code")
        existing_user = db.execute(user_query, {'emp_code': employee_code}).fetchone()
        
        if not existing_user:
            # Create new user
            insert_user = text("""
                INSERT INTO users (name, email, password, role_id, department_id, employee_code, status)
                VALUES (:name, :email, 'password', 1, 1, :emp_code, 'active')
            """)
            db.execute(insert_user, {
                'name': f'Employee {employee_code}',
                'email': f'emp{employee_code}@company.com',
                'emp_code': employee_code
            })
            db.commit()
            
            # Get the new user ID
            user_result = db.execute(user_query, {'emp_code': employee_code}).fetchone()
            user_id = user_result.id
        else:
            user_id = existing_user.id
        
        # Create incomplete punch record (only check-in, no check-out)
        insert_punch = text("""
            INSERT INTO attendance_punches (employee_id, date, in_time, location, source, status)
            VALUES (:emp_id, :punch_date, :in_time, 'Coimbatore', 'WEB', 'Present')
            ON DUPLICATE KEY UPDATE in_time = :in_time
        """)
        
        db.execute(insert_punch, {
            'emp_id': user_id,
            'punch_date': '2025-12-23',
            'in_time': '23:12:18'
        })
        db.commit()
        
        return {
            "message": f"Test data created for employee {employee_code}",
            "user_id": user_id,
            "employee_code": employee_code,
            "note": "Use /update-name endpoint to change employee name"
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@router.get("/debug/{month}/{year}")
def debug_validation(
    month: int,
    year: int,
    db: Session = Depends(get_tenant_db)
):
    """Debug validation - check what data exists"""
    try:
        # Check users
        users_query = text("SELECT id, employee_code, name FROM users WHERE status = 'active'")
        users = db.execute(users_query).fetchall()
        
        # Check leave applications
        leaves_query = text("SELECT * FROM leave_applications WHERE status = 'pending'")
        leaves = db.execute(leaves_query).fetchall()
        
        # Also check attendance punches
        punches_query = text("SELECT * FROM attendance_punches WHERE MONTH(date) = :month AND YEAR(date) = :year")
        punches = db.execute(punches_query, {'month': month, 'year': year}).fetchall()
        
        return {
            "users": [dict(u._mapping) for u in users],
            "pending_leaves": [dict(l._mapping) for l in leaves],
            "attendance_punches": [dict(p._mapping) for p in punches],
            "month": month,
            "year": year
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/issues/{employee_id}/{month}/{year}")
def get_employee_issues(
    employee_id: str,
    month: int,
    year: int,
    db: Session = Depends(get_tenant_db)
):
    """Get validation issues for a specific employee"""
    # Find employee
    emp_query = text("""
        SELECT id, employee_code, name 
        FROM users 
        WHERE (employee_code = :emp_id OR id = :emp_id) 
        AND status = 'active'
    """)
    
    emp = db.execute(emp_query, {'emp_id': employee_id}).fetchone()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    issues = []
    
    # Check all validation types
    issues.extend(check_pending_leaves(db, emp.id, month, year))
    issues.extend(check_missing_attendance(db, emp.id, emp.employee_code, month, year))
    issues.extend(check_pending_od_approvals(db, emp.id, month, year))
    issues.extend(check_pending_regularization(db, emp.id, month, year))
    issues.extend(check_incomplete_punches(db, emp.id, emp.employee_code, month, year))
    
    # Add employee info
    for issue in issues:
        issue.update({
            'employee_id': emp.employee_code or str(emp.id),
            'employee_name': emp.name
        })
    
    return {
        'employee': {
            'id': emp.employee_code or str(emp.id),
            'name': emp.name
        },
        'issues': [ValidationIssue(**issue) for issue in issues]
    }