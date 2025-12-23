from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import base64
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO

from database import master_engine, logger
from utils.audit_logger import log_audit, log_error
from utils.email import send_email

import models.models_master as models_master
import models.models_tenant as models_tenant

# ---------------- CORE ROUTERS ----------------
from routes.hospital import router as hospital_router
from routes.department import router as department_router
from routes.roles import router as roles_router
from routes.users import router as users_router

# ---------------- ORGANIZATION ----------------
from routes.organization.company_profile import router as company_profile_router
from routes.organization.branch import router as branch_router
from routes.organization.shifts import router as shift_router
from routes.organization.grades import router as grade_router
from routes.organization.holiday import router as holiday_router
from routes.organization.policy import router as policy_router
from routes.organization.reporting import router as reporting_router

# ---------------- RECRUITMENT ----------------
from routes.recruitment.recruitment import router as recruitment_router
from routes.recruitment.recruitment_import import router as recruitment_import_router
from routes.recruitment.ats import router as ats_router
from routes.recruitment.offer import router as offer_router
from routes.recruitment.onboarding import router as onboarding_router
from routes.recruitment.recruitment_public import router as public_router
from routes.recruitment.screening import router as screening_router
from routes.recruitment.dashboard import router as dashboard_router

# ======================= 🔥 EIS ROUTERS =======================
from routes.EIS.employee import router as employee_router
from routes.EIS.family import router as family_router
from routes.EIS.education import router as education_router
from routes.EIS.experience import router as experience_router
from routes.EIS.skills import router as skills_router
from routes.EIS.certification import router as certifications_router
from routes.EIS.id_docs import router as id_docs_router
from routes.EIS.medical import router as medical_router
from routes.EIS.salary import router as salary_router
from routes.EIS.documents import router as documents_router
from routes.EIS.exit import router as exit_router
from routes.EIS.bank_details import router as bank_details_router
from routes.EIS.resignation_tracking import router as resignation_tracking_router
from routes.exit.settlement_documents import router as settlement_documents_router

# ======================= 🔥 ATTENDANCE ROUTERS =======================
from routes.attendance.roster import router as roster_router
from routes.attendance.punch_logs import router as attendance_punch_router
from routes.attendance.regularization import router as attendance_regularization_router
from routes.attendance.rules import router as attendance_rules_router
from routes.attendance.locations import router as attendance_locations_router
from routes.attendance.reports import router as attendance_reports_router

# ======================= 🔥 LEAVE ROUTERS =======================
from routes.leave.leave_types import router as leave_types_router
from routes.leave.leave_rules import router as leave_rules_router
from routes.leave.leave_applications import router as leave_applications_router
from routes.leave.leave_balances import router as leave_balances_router
from routes.leave.leave_reports import router as leave_reports_router

# ======================= 🔥 PAYROLL ROUTERS =======================
from routes.payroll.salary_structure import router as salary_structure_router
from routes.payroll.statutory_rules import router as statutory_rules_router
from routes.payroll.payroll_run import router as payroll_run_router
from routes.payroll.adjustments import router as payroll_adjustments_router
from routes.payroll.payslip import router as payroll_payslip_router
from routes.payroll.reports import router as payroll_reports_router

# ======================= 🔥 HR OPERATIONS ROUTERS =======================
from routes.hr.lifecycle import router as hr_lifecycle_router
from routes.hr.communication import router as hr_communication_router
from routes.hr.grievances import router as hr_grievances_router
from routes.hr.assets import router as hr_assets_router
from routes.hr.insurance import router as hr_insurance_router

# ======================= 🔥 PMS ROUTERS =======================
from routes.pms.goals import router as pms_goals_router
from routes.pms.review import router as pms_review_router
from routes.pms.feedback import router as pms_feedback_router
from routes.pms.appraisal import router as pms_appraisal_router

# ======================= 🔥 TRAINING & DEVELOPMENT ROUTERS =======================
from routes.training.programs import router as training_programs_router
from routes.training.requests import router as training_requests_router
from routes.training.attendance import router as training_attendance_router
from routes.training.certificates import router as training_certificates_router

# ======================= 🔥 COMPLIANCE ROUTERS =======================
from routes.compliance.statutory import router as statutory_router
from routes.compliance.labour_register import router as labour_register_router
from routes.compliance.leave_compliance import router as leave_compliance_router
from routes.compliance.nabh_compliance import router as nabh_compliance_router

# ======================= 🔥 EXIT MANAGEMENT ROUTERS =======================
from routes.exit.exit_management import router as exit_management_router

# ============================================================

app = FastAPI(title="Nutryah HRM - Multi Tenant Backend")

logger.info("🚀 FastAPI HRM Backend started")

# ---------------- AUDIT MIDDLEWARE ----------------
class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            tenant_id = request.headers.get("tenant-id") or request.cookies.get("tenant_db")
            user_id = request.headers.get("user-id")
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

            request.state.tenant_id = tenant_id
            request.state.user_id = user_id
            request.state.ip_address = ip_address
            request.state.user_agent = user_agent

            response = await call_next(request)
            return response

        except Exception as e:
            log_error(
                tenant_id=getattr(request.state, "tenant_id", None),
                error_type="RequestError",
                error_message=str(e),
                request_url=str(request.url),
                request_method=request.method,
                user_id=getattr(request.state, "user_id", None),
                ip_address=getattr(request.state, "ip_address", None)
            )
            raise

app.add_middleware(AuditMiddleware)

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DIRECTORIES ----------------
Path("uploads/policies").mkdir(parents=True, exist_ok=True)
Path("uploads/resumes").mkdir(parents=True, exist_ok=True)

# ---------------- STATIC FILES ----------------
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ---------------- STARTUP ----------------
@app.on_event("startup")
def create_tables():
    logger.info("Creating master database tables...")
    models_master.MasterBase.metadata.create_all(bind=master_engine)
    logger.info("Master tables created.")

    try:
        from database import create_tenant_database, get_tenant_engine, get_master_db

        master_db = next(get_master_db())
        hospitals = master_db.query(models_master.Hospital).all()

        for hospital in hospitals:
            try:
                logger.info(f"Ensuring tenant database exists: {hospital.db_name}")
                create_tenant_database(hospital.db_name)

                tenant_engine = get_tenant_engine(hospital.db_name)
                models_tenant.MasterBase.metadata.create_all(bind=tenant_engine)
                logger.info(f"Tenant tables created/verified for {hospital.db_name}")
            except Exception as e:
                logger.error(f"Error creating tenant DB {hospital.db_name}: {str(e)}")

        master_db.close()
    except Exception as e:
        logger.error(f"Error during tenant database setup: {str(e)}")

# ---------------- REGISTER ROUTERS ----------------
app.include_router(hospital_router, prefix="/auth", tags=["Hospitals"])
app.include_router(department_router, prefix="/hospitals", tags=["Departments"])
app.include_router(roles_router, prefix="/hospitals", tags=["Roles"])
app.include_router(users_router, prefix="/hospitals", tags=["Users"])

app.include_router(company_profile_router)
app.include_router(branch_router)
app.include_router(shift_router)
app.include_router(grade_router)
app.include_router(holiday_router)
app.include_router(policy_router)
app.include_router(reporting_router)

# ---------------- RECRUITMENT ----------------
app.include_router(recruitment_router)
app.include_router(recruitment_import_router)
app.include_router(ats_router, prefix="/recruitment")
app.include_router(offer_router, prefix="/recruitment")
app.include_router(onboarding_router, prefix="/recruitment")
app.include_router(public_router)
app.include_router(screening_router)
app.include_router(dashboard_router)

# ======================= 🔥 EIS MODULE =======================
app.include_router(employee_router)
app.include_router(family_router)
app.include_router(education_router)
app.include_router(experience_router)
app.include_router(skills_router)
app.include_router(certifications_router)
app.include_router(id_docs_router)
app.include_router(medical_router)
app.include_router(salary_router)
app.include_router(documents_router)
app.include_router(exit_router)
app.include_router(bank_details_router)
app.include_router(resignation_tracking_router, prefix="/api")
app.include_router(settlement_documents_router, prefix="/api")

# ======================= 🔥 ATTENDANCE MODULE =======================
app.include_router(roster_router, prefix="/api")
app.include_router(attendance_punch_router, prefix="/api")
app.include_router(attendance_regularization_router, prefix="/api")
app.include_router(attendance_rules_router, prefix="/api")
app.include_router(attendance_locations_router, prefix="/api")
app.include_router(attendance_reports_router, prefix="/api")

# ======================= 🔥 LEAVE MODULE =======================
app.include_router(leave_types_router, prefix="/api")
app.include_router(leave_rules_router, prefix="/api")
app.include_router(leave_applications_router, prefix="/api")
app.include_router(leave_balances_router, prefix="/api")
app.include_router(leave_reports_router, prefix="/api")

# ======================= 🔥 PAYROLL MODULE =======================
app.include_router(salary_structure_router, prefix="/api")
app.include_router(statutory_rules_router, prefix="/api")
app.include_router(payroll_run_router, prefix="/api")
app.include_router(payroll_adjustments_router, prefix="/api")
app.include_router(payroll_payslip_router, prefix="/api")
app.include_router(payroll_reports_router, prefix="/api")

# ======================= 🔥 HR OPERATIONS MODULE =======================
app.include_router(hr_lifecycle_router)
app.include_router(hr_communication_router)
app.include_router(hr_grievances_router)
app.include_router(hr_assets_router)
app.include_router(hr_insurance_router)

# ======================= 🔥 PMS MODULE =======================
app.include_router(pms_goals_router, prefix="/api/pms")
app.include_router(pms_review_router, prefix="/api/pms")
app.include_router(pms_feedback_router, prefix="/api/pms")
app.include_router(pms_appraisal_router, prefix="/api/pms")

# ======================= 🔥 TRAINING & DEVELOPMENT MODULE =======================
app.include_router(training_programs_router, prefix="/api/training")
app.include_router(training_requests_router, prefix="/api/training")
app.include_router(training_attendance_router, prefix="/api/training")
app.include_router(training_certificates_router, prefix="/api/training")

# ======================= 🔥 COMPLIANCE MODULE =======================
app.include_router(statutory_router, prefix="/api")
app.include_router(labour_register_router, prefix="/api")
app.include_router(leave_compliance_router, prefix="/api")
app.include_router(nabh_compliance_router, prefix="/api")

# ======================= 🔥 EXIT MANAGEMENT MODULE =======================
app.include_router(exit_management_router, prefix="/api")

logger.info("All routers loaded successfully")

# ======================= 📧 EMAIL ENDPOINT =======================
class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    attachment: Optional[dict] = None
    employee_data: Optional[dict] = None

class PDFRequest(BaseModel):
    employee_name: str
    employee_code: str
    company_name: str
    designation: str
    department: str
    joining_date: str
    last_working_day: str
    place: str = "Bangalore"
    issued_by: str = "HR Department"
    authorized_signatory: str = "HR Manager"
    issued_date: str

@app.post("/api/generate-experience-pdf")
def generate_experience_pdf(pdf_request: PDFRequest):
    try:
        from datetime import datetime
        
        buffer = BytesIO()
        
        # Create PDF using canvas
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Title
        p.setFont("Helvetica-Bold", 18)
        title_text = "EXPERIENCE CERTIFICATE"
        title_width = p.stringWidth(title_text, "Helvetica-Bold", 18)
        p.drawString((width - title_width) / 2, height-100, title_text)
        
        # Content
        p.setFont("Helvetica", 12)
        y_position = height - 180
        line_height = 20
        
        # Format dates
        joining_date = datetime.strptime(pdf_request.joining_date, '%Y-%m-%d').strftime('%d/%m/%Y')
        last_working_day = datetime.strptime(pdf_request.last_working_day, '%Y-%m-%d').strftime('%d/%m/%Y')
        issued_date = datetime.strptime(pdf_request.issued_date, '%Y-%m-%d').strftime('%d/%m/%Y')
        
        # Paragraph 1
        text1 = f"This is to certify that {pdf_request.employee_name} (Employee Code: {pdf_request.employee_code})"
        p.drawString(50, y_position, text1)
        y_position -= line_height
        
        text2 = f"was employed with {pdf_request.company_name} as {pdf_request.designation}"
        p.drawString(50, y_position, text2)
        y_position -= line_height
        
        text3 = f"in the {pdf_request.department}."
        p.drawString(50, y_position, text3)
        y_position -= line_height * 2
        
        # Paragraph 2
        text4 = f"The period of employment was from {joining_date} to {last_working_day}."
        p.drawString(50, y_position, text4)
        y_position -= line_height * 2
        
        # Paragraph 3
        text5 = f"During the tenure with our organization, {pdf_request.employee_name} demonstrated"
        p.drawString(50, y_position, text5)
        y_position -= line_height
        
        text6 = "professionalism and contributed effectively to the team. The employee's conduct"
        p.drawString(50, y_position, text6)
        y_position -= line_height
        
        text7 = "and performance were satisfactory throughout the employment period."
        p.drawString(50, y_position, text7)
        y_position -= line_height * 2
        
        # Paragraph 4
        text8 = f"We wish {pdf_request.employee_name} all the best for future endeavors."
        p.drawString(50, y_position, text8)
        y_position -= line_height * 3
        
        # Signature section
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y_position, f"For {pdf_request.company_name}")
        y_position -= line_height * 3
        
        # Signature line
        p.line(50, y_position, 200, y_position)
        y_position -= line_height
        
        p.setFont("Helvetica", 10)
        p.drawString(50, y_position, pdf_request.authorized_signatory)
        y_position -= 15
        p.drawString(50, y_position, pdf_request.issued_by)
        
        # Date and place (right aligned)
        date_text = f"Date: {issued_date}"
        place_text = f"Place: {pdf_request.place}"
        p.drawString(width-200, y_position + 30, date_text)
        p.drawString(width-200, y_position + 15, place_text)
        
        p.save()
        buffer.seek(0)
        
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Experience_Certificate_{pdf_request.employee_code}.pdf",
                "Content-Type": "application/pdf"
            }
        )
        
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/send-email")
def send_email_endpoint(email_request: EmailRequest):
    try:
        attachments = None
        if email_request.attachment and email_request.attachment.get('filename'):
            # Generate real PDF content for email attachment
            if 'Experience_Certificate_' in email_request.attachment['filename']:
                # Extract employee data from the request (assuming it's passed in attachment content)
                try:
                    # Create a proper PDF for the email attachment
                    from datetime import datetime
                    
                    buffer = BytesIO()
                    p = canvas.Canvas(buffer, pagesize=letter)
                    width, height = letter
                    
                    # Title
                    p.setFont("Helvetica-Bold", 18)
                    title_text = "EXPERIENCE CERTIFICATE"
                    title_width = p.stringWidth(title_text, "Helvetica-Bold", 18)
                    p.drawString((width - title_width) / 2, height-100, title_text)
                    
                    # Generate complete experience certificate PDF
                    if email_request.employee_data:
                        emp_data = email_request.employee_data
                        
                        # Format dates
                        joining_date = datetime.strptime(emp_data.get('joining_date', '2022-03-15'), '%Y-%m-%d').strftime('%d/%m/%Y')
                        last_working_day = datetime.strptime(emp_data.get('last_working_day', '2025-12-26'), '%Y-%m-%d').strftime('%d/%m/%Y')
                        issued_date = datetime.strptime(emp_data.get('issued_date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d').strftime('%d/%m/%Y')
                        
                        # Content with employee details
                        p.setFont("Helvetica", 12)
                        y_position = height - 180
                        line_height = 20
                        
                        # Paragraph 1
                        text1 = f"This is to certify that {emp_data.get('employee_name', 'Unknown')} (Employee Code: {emp_data.get('employee_code', 'EMP001')})"
                        p.drawString(50, y_position, text1)
                        y_position -= line_height
                        
                        text2 = f"was employed with {emp_data.get('company_name', 'Nutryah Healthcare Solutions')} as {emp_data.get('designation', 'Software Developer')}"
                        p.drawString(50, y_position, text2)
                        y_position -= line_height
                        
                        text3 = f"in the {emp_data.get('department', 'IT Department')}."
                        p.drawString(50, y_position, text3)
                        y_position -= line_height * 2
                        
                        # Paragraph 2
                        text4 = f"The period of employment was from {joining_date} to {last_working_day}."
                        p.drawString(50, y_position, text4)
                        y_position -= line_height * 2
                        
                        # Paragraph 3
                        text5 = f"During the tenure with our organization, {emp_data.get('employee_name', 'Unknown')} demonstrated"
                        p.drawString(50, y_position, text5)
                        y_position -= line_height
                        
                        text6 = "professionalism and contributed effectively to the team. The employee's conduct"
                        p.drawString(50, y_position, text6)
                        y_position -= line_height
                        
                        text7 = "and performance were satisfactory throughout the employment period."
                        p.drawString(50, y_position, text7)
                        y_position -= line_height * 2
                        
                        # Paragraph 4
                        text8 = f"We wish {emp_data.get('employee_name', 'Unknown')} all the best for future endeavors."
                        p.drawString(50, y_position, text8)
                        y_position -= line_height * 3
                        
                        # Signature section
                        p.setFont("Helvetica-Bold", 12)
                        p.drawString(50, y_position, f"For {emp_data.get('company_name', 'Nutryah Healthcare Solutions')}")
                        y_position -= line_height * 3
                        
                        # Signature line
                        p.line(50, y_position, 200, y_position)
                        y_position -= line_height
                        
                        p.setFont("Helvetica", 10)
                        p.drawString(50, y_position, emp_data.get('authorized_signatory', 'HR Manager'))
                        y_position -= 15
                        p.drawString(50, y_position, emp_data.get('issued_by', 'HR Department'))
                        
                        # Date and place
                        p.drawString(width-200, y_position + 30, f"Date: {issued_date}")
                        p.drawString(width-200, y_position + 15, f"Place: {emp_data.get('place', 'Bangalore')}")
                    else:
                        # Basic content for email attachment
                        p.setFont("Helvetica", 12)
                        y_position = height - 180
                        
                        p.drawString(50, y_position, "This is to certify that the employee was employed with our organization.")
                        y_position -= 40
                        p.drawString(50, y_position, "We wish them all the best for future endeavors.")
                        y_position -= 80
                        
                        p.setFont("Helvetica-Bold", 12)
                        p.drawString(50, y_position, "For Nutryah Healthcare Solutions")
                        y_position -= 60
                        
                        p.line(50, y_position, 200, y_position)
                        y_position -= 20
                        p.setFont("Helvetica", 10)
                        p.drawString(50, y_position, "HR Manager")
                        p.drawString(50, y_position-15, "HR Department")
                        
                        current_date = datetime.now().strftime('%d/%m/%Y')
                        p.drawString(width-200, y_position, f"Date: {current_date}")
                        p.drawString(width-200, y_position-15, "Place: Bangalore")
                    
                    p.save()
                    buffer.seek(0)
                    attachment_bytes = buffer.getvalue()
                    
                except Exception as pdf_error:
                    logger.error(f"PDF generation for email failed: {pdf_error}")
                    # Fallback to a simple text-based PDF
                    attachment_bytes = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF'
            else:
                # Handle other attachment types
                attachment_content = email_request.attachment.get('content', '')
                if attachment_content and attachment_content != 'base64_pdf_content':
                    try:
                        attachment_bytes = base64.b64decode(attachment_content)
                    except:
                        attachment_bytes = b'Invalid attachment content'
                else:
                    attachment_bytes = b'No attachment content provided'
            
            attachments = [{
                'content': attachment_bytes,
                'filename': email_request.attachment['filename']
            }]
        
        success = send_email(
            to_email=email_request.to,
            subject=email_request.subject,
            html_content=email_request.body.replace('\n', '<br>'),
            attachments=attachments
        )
        
        if success:
            return {"message": "Email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        logger.error(f"Email endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------- ROOT ----------------
@app.get("/")
def root():
    logger.info("Root endpoint hit")
    return {"message": "Nutryah HRM Backend Running 🚀"}
