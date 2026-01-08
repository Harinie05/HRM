from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud
from utils.permission import require_permission
from routes.hospital import get_current_user
from datetime import datetime
from sqlalchemy import func
import io
from utils.pdf_format import PDFHeaderFooterTemplate
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

def number_to_words(n):
    """Convert number to words for Indian currency"""
    if n == 0:
        return "zero"
    
    ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
            "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
            "seventeen", "eighteen", "nineteen"]
    
    tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
    
    def convert_hundreds(num):
        result = ""
        if num >= 100:
            result += ones[num // 100] + " hundred "
            num %= 100
        if num >= 20:
            result += tens[num // 10] + " "
            num %= 10
        if num > 0:
            result += ones[num] + " "
        return result
    
    if n < 0:
        return "minus " + number_to_words(-n)
    
    if n < 20:
        return ones[n]
    elif n < 100:
        return tens[n // 10] + (" " + ones[n % 10] if n % 10 != 0 else "")
    elif n < 1000:
        return convert_hundreds(n).strip()
    elif n < 100000:
        return convert_hundreds(n // 1000) + "thousand " + convert_hundreds(n % 1000)
    elif n < 10000000:
        return convert_hundreds(n // 100000) + "lakh " + convert_hundreds((n % 100000) // 1000) + ("thousand " if (n % 100000) // 1000 > 0 else "") + convert_hundreds(n % 1000)
    else:
        return convert_hundreds(n // 10000000) + "crore " + convert_hundreds((n % 10000000) // 100000) + ("lakh " if (n % 10000000) // 100000 > 0 else "") + convert_hundreds(((n % 10000000) % 100000) // 1000) + ("thousand " if ((n % 10000000) % 100000) // 1000 > 0 else "") + convert_hundreds(n % 1000)

from models.models_tenant import (
    PayrollRun, User, SalaryStructure, StatutoryRule, 
    AttendancePunch, LeaveApplication, PayrollAdjustment,
    Employee, EmployeeSalary, EmployeeBankDetails
)

router = APIRouter(
    prefix="/payroll/payslips",
    tags=["Payroll - Payslips"]
)

@router.post("/generate/{employee_id}")
def generate_payslip(
    employee_id: int,
    month: str,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("view_salary_slips"))
):
    """Generate complete payslip with full workflow"""
    try:
        # Check if user has view_self permission and restrict to own records
        user_permissions = user.get('permissions', [])
        if 'view_self' in user_permissions:
            current_user_id = user.get('user_id')
            if current_user_id and employee_id != current_user_id:
                raise HTTPException(status_code=403, detail="You can only generate payslips for yourself")
        
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
        audit_crud(request, db, user, "GENERATE_PAYSLIP", "payslips", str(employee_id), {}, {"month": month, "net_salary": payslip["net_salary"]})
        
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
    
    # Remove grade-based salary logic since Grade model is deleted
    # Fallback to general salary structure
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
    pf = payroll["basic"] * 0.12 if statutory and getattr(statutory, 'pf_enabled', False) else 0
    esi = payroll["gross_salary"] * 0.0175 if statutory and getattr(statutory, 'esi_enabled', False) else 0
    pt = 200 if statutory and getattr(statutory, 'pt_amount', False) else 0
    
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
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("process_payments"))
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
            
            if employee is not None and getattr(payroll, 'net_salary', None):
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

@router.get("/payslip/{payslip_id}/download")
def download_payslip_pdf(
    payslip_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("download_salary_slips"))
):
    """Download payslip as PDF"""
    try:
        # Check if reportlab is available
        try:
            from reportlab.lib.pagesizes import A4
        except ImportError:
            raise HTTPException(500, "PDF generation library not installed. Please install reportlab.")
        
        # Get payroll run data
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payslip_id).first()
        if not payroll_run:
            raise HTTPException(404, "Payslip not found")
        
        # Get employee details
        employee = db.query(Employee).filter(Employee.id == payroll_run.employee_id).first()
        if not employee:
            employee = db.query(User).filter(User.id == payroll_run.employee_id).first()
        
        if not employee:
            raise HTTPException(404, "Employee not found")
        
        # Get adjustments
        adjustments = db.query(PayrollAdjustment).filter(
            PayrollAdjustment.employee_id == payroll_run.employee_id,
            PayrollAdjustment.month == payroll_run.month
        ).all()
        
        # Generate PDF
        pdf_buffer = generate_payslip_pdf(employee, payroll_run, adjustments, db)
        
        # Return as streaming response
        # Extract year for filename
        if hasattr(payroll_run, 'year') and payroll_run.year:
            year_for_filename = payroll_run.year
        else:
            year_for_filename = datetime.now().year
            
        filename = f"payslip_{getattr(employee, 'name', 'employee').replace(' ', '_')}_{payroll_run.month}_{year_for_filename}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"PDF generation error: {str(e)}")
        raise HTTPException(500, f"PDF generation failed: {str(e)}")

def generate_payslip_pdf(employee, payroll_run, adjustments, db: Session):
    """Generate PDF payslip using reportlab with organization header"""
    try:
        buffer = io.BytesIO()
        
        # Create document with minimal margins for single page
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            topMargin=120,  # Reduced for single page
            bottomMargin=40,  # Reduced for single page
            leftMargin=40,
            rightMargin=40
        )
        
        # Create header/footer template
        template = PDFHeaderFooterTemplate(db, "SALARY SLIP")
        
        styles = getSampleStyleSheet()
        story = []
        
        # Employee Info Section
        month_display = payroll_run.month
        if hasattr(payroll_run, 'year') and payroll_run.year:
            year_display = payroll_run.year
        else:
            year_display = datetime.now().year
        
        # Handle department
        department = getattr(employee, 'department', 'N/A')
        if hasattr(department, 'name'):
            department_name = department.name
        elif hasattr(department, 'department_name'):
            department_name = department.department_name
        else:
            department_name = str(department) if department != 'N/A' else 'N/A'
        
        # Calculate values
        gross_salary = getattr(payroll_run, 'gross_salary', 0)
        bonus_total = sum(adj.amount or 0 for adj in adjustments if adj.adjustment_type != 'Deduction' and (adj.amount or 0) > 0)
        total_deductions = (getattr(payroll_run, 'lop_deduction', 0) + 
                           getattr(payroll_run, 'basic_salary', 0) * 0.12 + 
                           gross_salary * 0.0175 + 200 +
                           sum(adj.amount or 0 for adj in adjustments if adj.adjustment_type == 'Deduction'))
        net_salary = (gross_salary + bonus_total - total_deductions)
        
        # Single comprehensive payslip table
        payslip_data = [
            # Employee Information Header
            ['EMPLOYEE INFORMATION', '', 'PAYROLL PERIOD', ''],
            ['Employee Name:', getattr(employee, 'name', 'N/A'), 'Pay Period:', f"{month_display} {year_display}"],
            ['Employee ID:', getattr(employee, 'employee_code', 'N/A'), 'Pay Date:', datetime.now().strftime('%d-%b-%Y')],
            ['Department:', department_name, 'Working Days:', '30'],
            ['Designation:', getattr(employee, 'designation', 'N/A'), 'Days Worked:', f"{getattr(payroll_run, 'present_days', 30)}"],
            
            # Separator
            ['', '', '', ''],
            
            # Earnings and Deductions Header
            ['EARNINGS', 'AMOUNT (₹)', 'DEDUCTIONS', 'AMOUNT (₹)'],
            ['Basic Salary', f"{getattr(payroll_run, 'basic_salary', 0):,.2f}", 'Provident Fund (PF)', f"{(getattr(payroll_run, 'basic_salary', 0) * 0.12):,.2f}"],
            ['House Rent Allowance', f"{getattr(payroll_run, 'hra_salary', 0):,.2f}", 'Employee State Insurance', f"{(gross_salary * 0.0175):,.2f}"],
            ['Special Allowance', f"{getattr(payroll_run, 'allowances', 0):,.2f}", 'Professional Tax', "200.00"],
            ['Bonus/Incentives', f"{bonus_total:,.2f}", 'Income Tax (TDS)', "0.00"],
            
            # Separator
            ['', '', '', ''],
            
            # Totals
            ['GROSS EARNINGS', f"{(gross_salary + bonus_total):,.2f}", 'TOTAL DEDUCTIONS', f"{total_deductions:,.2f}"],
            
            # Separator
            ['', '', '', ''],
            
            # Net Salary
            ['NET SALARY PAYABLE', f"₹ {net_salary:,.2f}", '', ''],
            ['Amount in Words:', '', '', ''],
            [f"{number_to_words(int(net_salary)).upper()} RUPEES ONLY", '', '', ''],
            
            # Separator
            ['', '', '', ''],
            
            # Signature Section
            ['EMPLOYER VERIFICATION', '', 'EMPLOYEE ACKNOWLEDGMENT', ''],
            ['', '', '', ''],
            ['Authorized Signatory', 'Date: __________', 'Employee Signature', 'Date: __________'],
        ]
        
        # Create single table with elegant styling
        payslip_table = Table(payslip_data, colWidths=[2.2*inch, 1.8*inch, 2.2*inch, 1.8*inch])
        payslip_table.setStyle(TableStyle([
            # Employee info header - elegant dark grey
            ('BACKGROUND', (0, 0), (1, 0), colors.Color(0.3, 0.3, 0.3)),
            ('BACKGROUND', (2, 0), (3, 0), colors.Color(0.3, 0.3, 0.3)),
            ('TEXTCOLOR', (0, 0), (3, 0), colors.white),
            ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (3, 0), 10),
            
            # Earnings/Deductions header - professional grey
            ('BACKGROUND', (0, 7), (3, 7), colors.Color(0.4, 0.4, 0.4)),
            ('TEXTCOLOR', (0, 7), (3, 7), colors.white),
            ('FONTNAME', (0, 7), (3, 7), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 7), (3, 7), 10),
            
            # Totals row - subtle highlight
            ('BACKGROUND', (0, 14), (3, 14), colors.Color(0.85, 0.85, 0.85)),
            ('FONTNAME', (0, 14), (3, 14), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 14), (3, 14), 10),
            
            # Net salary rows - light grey background with dark text
            ('BACKGROUND', (0, 16), (3, 18), colors.Color(0.9, 0.9, 0.9)),
            ('TEXTCOLOR', (0, 16), (3, 18), colors.black),
            ('FONTNAME', (0, 16), (3, 18), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 16), (3, 18), 11),
            
            # Signature header - professional finish
            ('BACKGROUND', (0, 20), (3, 20), colors.Color(0.35, 0.35, 0.35)),
            ('TEXTCOLOR', (0, 20), (3, 20), colors.white),
            ('FONTNAME', (0, 20), (3, 20), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 20), (3, 20), 9),
            
            # General elegant styling
            ('TEXTCOLOR', (0, 1), (3, 19), colors.Color(0.1, 0.1, 0.1)),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (3, 19), 'Helvetica'),
            ('FONTSIZE', (0, 1), (3, 19), 9),
            
            # Compact padding for single page
            ('BOTTOMPADDING', (0, 0), (3, -1), 6),
            ('TOPPADDING', (0, 0), (3, -1), 6),
            ('LEFTPADDING', (0, 0), (3, -1), 6),
            ('RIGHTPADDING', (0, 0), (3, -1), 6),
            
            # Professional grid lines
            ('GRID', (0, 0), (3, -1), 0.5, colors.Color(0.6, 0.6, 0.6)),
            ('LINEBELOW', (0, 0), (3, 0), 2, colors.Color(0.3, 0.3, 0.3)),
            ('LINEBELOW', (0, 7), (3, 7), 2, colors.Color(0.4, 0.4, 0.4)),
            ('LINEBELOW', (0, 14), (3, 14), 1.5, colors.Color(0.5, 0.5, 0.5)),
            ('LINEBELOW', (0, 18), (3, 18), 2, colors.Color(0.7, 0.7, 0.7)),
            ('LINEBELOW', (0, 20), (3, 20), 2, colors.Color(0.35, 0.35, 0.35)),
            
            ('VALIGN', (0, 0), (3, -1), 'MIDDLE'),
            
            # Special styling for amount in words - black text on light background
            ('SPAN', (0, 17), (3, 17)),
            ('ALIGN', (0, 17), (3, 17), 'CENTER'),
            ('FONTSIZE', (0, 17), (3, 17), 8),
            ('FONTNAME', (0, 17), (3, 17), 'Helvetica'),
            ('TEXTCOLOR', (0, 17), (3, 17), colors.black),
        ]))
        
        story.append(payslip_table)
        story.append(Spacer(1, 10))
        
        # Government compliance note
        compliance_text = Paragraph(
            "<b>IMPORTANT NOTICE:</b> This payslip is generated electronically and is valid without signature. "
            "All statutory deductions are computed as per prevailing Government of India regulations including "
            "Provident Fund Act 1952, ESI Act 1948, and Income Tax Act 1961. For any discrepancies, "
            "contact HR Department within 7 days of receipt.",
            ParagraphStyle('Compliance', parent=styles['Normal'], fontSize=8, textColor=colors.darkblue, 
                         leftIndent=10, rightIndent=10, spaceAfter=10)
        )
        story.append(compliance_text)
        
        # Build PDF with header and footer
        doc.build(story, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
        
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        print(f"PDF generation error: {str(e)}")
        raise Exception(f"Failed to generate PDF: {str(e)}")

@router.post("/send-email")
async def send_payslip_email(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("email_salary_slips"))
):
    """Send payslip via email"""
    try:
        from utils.email import send_email
        
        # Get form data
        body = await request.json()
        payslip_id = body.get('payslip_id')
        email = body.get('email')
        
        if not payslip_id or not email:
            raise HTTPException(400, "Payslip ID and email are required")
        
        # Get payroll run data
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payslip_id).first()
        if not payroll_run:
            raise HTTPException(404, "Payslip not found")
        
        # Get employee details
        employee = db.query(Employee).filter(Employee.id == payroll_run.employee_id).first()
        if not employee:
            employee = db.query(User).filter(User.id == payroll_run.employee_id).first()
        
        if not employee:
            raise HTTPException(404, "Employee not found")
        
        # Get adjustments
        adjustments = db.query(PayrollAdjustment).filter(
            PayrollAdjustment.employee_id == payroll_run.employee_id,
            PayrollAdjustment.month == payroll_run.month
        ).all()
        
        # Generate PDF
        pdf_buffer = generate_payslip_pdf(employee, payroll_run, adjustments, db)
        
        # Prepare email content
        employee_name = getattr(employee, 'name', 'Employee')
        subject = f"Payslip for {employee_name} - {payroll_run.month}"
        
        html_content = f"""
        <html>
        <body>
            <h2>Payslip - {payroll_run.month}</h2>
            <p>Dear {employee_name},</p>
            <p>Please find attached your payslip for <strong>{payroll_run.month}</strong>.</p>
            <p>If you have any questions, please contact the HR department.</p>
            <br>
            <p>Best regards,<br>
            HR Department<br>
            NUTRYAH</p>
        </body>
        </html>
        """
        
        # Prepare attachment
        filename = f"payslip_{employee_name.replace(' ', '_')}_{payroll_run.month}.pdf"
        attachments = [{
            'filename': filename,
            'content': pdf_buffer.getvalue()
        }]
        
        # Send email using existing utility
        success = send_email(email, subject, html_content, attachments)
        
        if success:
            return {"message": f"Payslip sent successfully to {email}"}
        else:
            raise HTTPException(500, "Failed to send email")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Email sending error: {str(e)}")
        raise HTTPException(500, f"Failed to send email: {str(e)}")
