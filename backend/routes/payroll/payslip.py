from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from datetime import datetime
from sqlalchemy import func

from models.models_tenant import (
    PayrollRun, User, SalaryStructure, StatutoryRule, 
    AttendancePunch, LeaveApplication, PayrollAdjustment,
    Employee, EmployeeSalary, EmployeeBankDetails, Grade
)

router = APIRouter(
    prefix="/payroll/payslips",
    tags=["Payroll - Payslips"]
)

@router.post("/generate/{employee_id}")
def generate_payslip(
    employee_id: int,
    month: str,
    db: Session = Depends(get_tenant_db)
):
    """Generate complete payslip with full workflow"""
    try:
        # Step 1: Get Employee from Employee Directory
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            # Fallback to User table if not found in Employee
            employee = db.query(User).filter(User.id == employee_id).first()
            if not employee:
                raise HTTPException(404, "Employee not found in directory")
        
        # Step 2: Get Attendance Data
        year, month_num = month.split('-')
        attendance_data = get_attendance_data(db, employee_id, int(year), int(month_num))
        
        # Step 3: Get Leave Data
        leave_data = get_leave_data(db, employee_id, int(year), int(month_num))
        
        # Step 4: Get Salary Structure
        salary_structure = get_salary_structure(db, employee_id)
        
        # Step 5: Calculate Payroll
        payroll_data = calculate_payroll(db, employee_id, attendance_data, leave_data, salary_structure)
        
        # Step 6: Apply Deductions
        final_payroll = apply_deductions(db, payroll_data)
        
        # Step 7: Generate Payslip
        payslip = create_payslip_data(employee, final_payroll, month)
        
        return payslip
        
    except Exception as e:
        raise HTTPException(500, f"Payslip generation failed: {str(e)}")

def get_attendance_data(db: Session, employee_id: int, year: int, month: int):
    """Get comprehensive attendance data from attendance module"""
    from calendar import monthrange
    
    # Get actual working days for the month
    working_days = monthrange(year, month)[1]
    
    # Get present days (including late arrivals)
    present_days = db.query(func.count(AttendancePunch.id)).filter(
        AttendancePunch.employee_id == employee_id,
        func.extract('year', AttendancePunch.date) == year,
        func.extract('month', AttendancePunch.date) == month,
        AttendancePunch.status.in_(['Present', 'Late'])
    ).scalar() or 0
    
    # Get overtime hours
    ot_hours = db.query(func.sum(
        func.extract('hour', AttendancePunch.out_time) - func.extract('hour', AttendancePunch.in_time)
    )).filter(
        AttendancePunch.employee_id == employee_id,
        func.extract('year', AttendancePunch.date) == year,
        func.extract('month', AttendancePunch.date) == month,
        AttendancePunch.out_time.isnot(None)
    ).scalar() or 0
    
    # Calculate overtime beyond 8 hours per day
    ot_hours = max(0, ot_hours - (present_days * 8))
    
    return {
        "present_days": present_days, 
        "working_days": working_days,
        "ot_hours": ot_hours
    }

def get_leave_data(db: Session, employee_id: int, year: int, month: int):
    """Get comprehensive leave data from leave module"""
    from models.models_tenant import LeaveType
    
    # Get approved leave days with type breakdown
    leaves = db.query(LeaveApplication, LeaveType).join(
        LeaveType, LeaveApplication.leave_type_id == LeaveType.id
    ).filter(
        LeaveApplication.employee_id == employee_id,
        func.extract('year', LeaveApplication.from_date) == year,
        func.extract('month', LeaveApplication.from_date) == month,
        LeaveApplication.status == 'Approved'
    ).all()
    
    total_leave_days = 0
    paid_leave_days = 0
    unpaid_leave_days = 0
    
    for leave_app, leave_type in leaves:
        total_leave_days += leave_app.total_days
        if leave_type.is_paid:
            paid_leave_days += leave_app.total_days
        else:
            unpaid_leave_days += leave_app.total_days
    
    return {
        "leave_days": total_leave_days,
        "paid_leave_days": paid_leave_days,
        "unpaid_leave_days": unpaid_leave_days
    }

def get_salary_structure(db: Session, employee_id: int):
    """Get employee salary structure from multiple sources"""
    # First try employee-specific salary
    emp_salary = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == employee_id).first()
    if emp_salary:
        return {
            "ctc": emp_salary.ctc,
            "basic_percent": emp_salary.basic_percent,
            "hra_percent": emp_salary.hra_percent
        }
    
    # Then try employee grade-based salary
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee and employee.grade:
        grade = db.query(Grade).filter(Grade.code == employee.grade).first()
        if grade:
            return {
                "ctc": (grade.min_salary + grade.max_salary) / 2,
                "basic_percent": grade.basic_percent,
                "hra_percent": grade.hra_percent
            }
    
    # Finally fallback to general salary structure
    structure = db.query(SalaryStructure).filter(SalaryStructure.is_active == True).first()
    if structure:
        return {
            "ctc": structure.ctc,
            "basic_percent": structure.basic_percent,
            "hra_percent": structure.hra_percent
        }
    
    # Default fallback
    return {"ctc": 50000, "basic_percent": 40, "hra_percent": 20}

def calculate_payroll(db: Session, employee_id: int, attendance: dict, leave: dict, salary: dict):
    """Enhanced payroll engine with comprehensive calculations"""
    working_days = attendance["working_days"]
    present_days = attendance["present_days"]
    paid_leave_days = leave["paid_leave_days"]
    unpaid_leave_days = leave["unpaid_leave_days"]
    ot_hours = attendance.get("ot_hours", 0)
    
    # Calculate effective working days (present + paid leave)
    effective_days = present_days + paid_leave_days
    lop_days = max(0, working_days - effective_days)
    
    # Calculate base salary components
    monthly_ctc = salary["ctc"] / 12
    basic = monthly_ctc * (salary["basic_percent"] / 100)
    hra = monthly_ctc * (salary["hra_percent"] / 100)
    allowances = monthly_ctc - basic - hra
    
    # Apply LOP deduction for unpaid leaves and absences
    if lop_days > 0:
        lop_factor = lop_days / working_days
        basic -= basic * lop_factor
        hra -= hra * lop_factor
        allowances -= allowances * lop_factor
    
    # Calculate overtime pay (1.5x of hourly basic)
    hourly_basic = basic / (working_days * 8)  # 8 hours per day
    ot_pay = ot_hours * hourly_basic * 1.5
    
    # Get any adjustments
    adjustments = db.query(func.sum(PayrollAdjustment.amount)).filter(
        PayrollAdjustment.employee_id == employee_id
    ).scalar() or 0
    
    gross_salary = basic + hra + allowances + ot_pay + adjustments
    
    return {
        "basic": round(basic, 2),
        "hra": round(hra, 2),
        "allowances": round(allowances, 2),
        "ot_pay": round(ot_pay, 2),
        "adjustments": round(adjustments, 2),
        "gross_salary": round(gross_salary, 2),
        "lop_days": lop_days,
        "present_days": effective_days,
        "ot_hours": ot_hours
    }

def apply_deductions(db: Session, payroll: dict):
    """Apply statutory and other deductions"""
    statutory = db.query(StatutoryRule).first()
    
    # Calculate deductions
    pf = payroll["basic"] * 0.12 if statutory and statutory.pf_enabled else 0
    esi = payroll["gross_salary"] * 0.0175 if statutory and statutory.esi_enabled else 0
    pt = 200 if statutory and statutory.pt_amount else 0
    
    total_deductions = pf + esi + pt
    net_salary = payroll["gross_salary"] - total_deductions
    
    payroll.update({
        "pf": round(pf, 2),
        "esi": round(esi, 2),
        "pt": round(pt, 2),
        "total_deductions": round(total_deductions, 2),
        "net_salary": round(net_salary, 2)
    })
    
    return payroll

def create_payslip_data(employee, payroll: dict, month: str):
    """Create comprehensive payslip structure with all module data"""
    # Handle both Employee and User model attributes
    employee_name = getattr(employee, 'name', 'Unknown')
    employee_code = getattr(employee, 'employee_code', 'N/A')
    employee_email = getattr(employee, 'email', getattr(employee, 'contact', 'N/A'))
    department = getattr(employee, 'department', 'N/A')
    designation = getattr(employee, 'designation', 'N/A')
    
    return {
        "employee_name": employee_name,
        "employee_code": employee_code,
        "employee_email": employee_email,
        "department": department,
        "designation": designation,
        "month": month,
        "earnings": {
            "basic": payroll["basic"],
            "hra": payroll["hra"],
            "allowances": payroll["allowances"],
            "ot_pay": payroll.get("ot_pay", 0),
            "adjustments": payroll.get("adjustments", 0),
            "gross": payroll["gross_salary"]
        },
        "deductions": {
            "pf": payroll["pf"],
            "esi": payroll["esi"],
            "pt": payroll["pt"],
            "total": payroll["total_deductions"]
        },
        "net_salary": payroll["net_salary"],
        "attendance": {
            "present_days": payroll["present_days"],
            "lop_days": payroll["lop_days"],
            "ot_hours": payroll.get("ot_hours", 0)
        },
        "workflow_status": "Generated via Complete Workflow",
        "modules_integrated": [
            "Employee Management",
            "Attendance System", 
            "Leave Management",
            "Salary Structure",
            "Statutory Rules",
            "Bank Details"
        ]
    }

@router.get("/bank-file/{month}")
def generate_bank_file(
    month: str,
    db: Session = Depends(get_tenant_db)
):
    """Generate bank file for salary transfer"""
    try:
        year, month_num = month.split('-')
        
        # Get all payroll runs for the month
        payrolls = db.query(PayrollRun).filter(PayrollRun.month == month).all()
        
        bank_records = []
        for payroll in payrolls:
            # Get employee from Employee directory first
            employee = db.query(Employee).filter(Employee.id == payroll.employee_id).first()
            if not employee:
                employee = db.query(User).filter(User.id == payroll.employee_id).first()
            
            if employee and payroll.net_salary:
                # Get actual bank details from employee bank details
                bank_details = db.query(EmployeeBankDetails).filter(
                    EmployeeBankDetails.employee_id == payroll.employee_id
                ).first()
                
                # Use employee code or ID for identification
                emp_code = getattr(employee, 'employee_code', f"EMP{employee.id:03d}")
                
                bank_records.append({
                    "employee_code": emp_code,
                    "employee_name": getattr(employee, 'name', 'Unknown'),
                    "account_number": bank_details.account_number if bank_details else "XXXXXXXXXX",
                    "amount": payroll.net_salary,
                    "ifsc": bank_details.ifsc_code if bank_details else "XXXXXXX",
                    "bank_name": bank_details.bank_name if bank_details else "Unknown Bank"
                })
        
        return {
            "month": month,
            "total_employees": len(bank_records),
            "total_amount": sum(r["amount"] for r in bank_records),
            "bank_records": bank_records
        }
        
    except Exception as e:
        raise HTTPException(500, f"Bank file generation failed: {str(e)}")
