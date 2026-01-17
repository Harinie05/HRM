from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from models.models_tenant import HRCommunication, User, Employee
from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user, require_permission
from utils.pdf_format import PDFHeaderFooterTemplate
import logging
from datetime import datetime
import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER

logger = logging.getLogger("HRM")

router = APIRouter(prefix="/hr/communication", tags=["HR Communication"])

@router.post("/", response_model=dict)
def create_communication(
    payload: dict,
    request: Request,
    db: Session = Depends(get_tenant_db),
    _: dict = Depends(require_permission("add_hr_letter"))
):
    try:
        # Map frontend fields to backend fields
        communication_data = {
            "letter_type": payload.get("letterType", "Notice"),
            "subject": payload.get("subject", ""),
            "content": payload.get("content", ""),
            "sent_to_type": "Single" if payload.get("employeeId") else "All",
            "sent_to_ids": [payload.get("employeeId")] if payload.get("employeeId") else None,
            "status": "Ready",
            "created_by": 1  # Default admin user
        }
        
        record = HRCommunication(**communication_data)
        db.add(record)
        db.commit()
        db.refresh(record)
        audit_crud(request, db, {"email": "system"}, "CREATE", "hr_communications", str(record.id), {}, record.__dict__)
        
        logger.info(f"✅ Communication created with ID: {record.id}")
        return {"message": "Communication sent", "id": record.id}
    except Exception as e:
        logger.error(f"❌ Error creating communication: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/draft", response_model=dict)
def save_draft(
    payload: dict,
    request: Request,
    db: Session = Depends(get_tenant_db)
):
    try:
        # Map frontend fields to backend fields for draft
        communication_data = {
            "letter_type": payload.get("letterType", "Notice"),
            "subject": payload.get("subject", ""),
            "content": payload.get("content", ""),
            "sent_to_type": "Single" if payload.get("employeeId") else "All",
            "sent_to_ids": [payload.get("employeeId")] if payload.get("employeeId") else None,
            "status": "Draft",
            "created_by": 1  # Default admin user
        }
        
        record = HRCommunication(**communication_data)
        db.add(record)
        db.commit()
        db.refresh(record)
        audit_crud(request, db, {"email": "system"}, "CREATE", "hr_communications", str(record.id), {}, record.__dict__)
        
        logger.info(f"✅ Draft saved with ID: {record.id}")
        return {"message": "Draft saved", "id": record.id}
    except Exception as e:
        logger.error(f"❌ Error saving draft: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{communication_id}", response_model=dict)
def get_communication(
    communication_id: int,
    db: Session = Depends(get_tenant_db)
):
    try:
        communication = db.query(HRCommunication).filter(
            HRCommunication.id == communication_id
        ).first()
        
        if not communication:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        return {
            "id": communication.id,
            "letter_type": communication.letter_type,
            "subject": communication.subject,
            "content": communication.content,
            "sent_to_ids": communication.sent_to_ids,
            "status": communication.status
        }
    except Exception as e:
        logger.error(f"❌ Error fetching communication: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{communication_id}", response_model=dict)
def update_communication(
    communication_id: int,
    payload: dict,
    request: Request,
    db: Session = Depends(get_tenant_db),
    _: dict = Depends(require_permission("edit_hr_letter"))
):
    try:
        communication = db.query(HRCommunication).filter(
            HRCommunication.id == communication_id
        ).first()
        
        if not communication:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        # Update fields
        communication.letter_type = payload.get("letterType", communication.letter_type)
        communication.subject = payload.get("subject", communication.subject)
        communication.content = payload.get("content", communication.content)
        if payload.get("employeeId"):
            setattr(communication, "sent_to_ids", [payload.get("employeeId")])
        communication.status = payload.get("status", communication.status)
        
        db.commit()
        audit_crud(request, db, {"email": "system"}, "UPDATE", "hr_communications", str(communication_id), {}, communication.__dict__)
        
        logger.info(f"✅ Communication {communication_id} updated successfully")
        return {"message": "Communication updated successfully", "id": communication.id}
    except Exception as e:
        logger.error(f"❌ Error updating communication: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{communication_id}/send", response_model=dict)
def send_draft_communication(
    communication_id: int,
    db: Session = Depends(get_tenant_db)
):
    try:
        communication = db.query(HRCommunication).filter(
            HRCommunication.id == communication_id,
            HRCommunication.status == "Draft"
        ).first()
        
        if not communication:
            raise HTTPException(status_code=404, detail="Draft communication not found")
        
        setattr(communication, "status", "Ready")
        db.commit()
        
        logger.info(f"✅ Draft communication {communication_id} sent successfully")
        return {"message": "Communication sent successfully", "id": communication.id}
    except Exception as e:
        logger.error(f"❌ Error sending draft communication: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{communication_id}", response_model=dict)
def delete_communication(
    communication_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    _: dict = Depends(require_permission("delete_hr_letter"))
):
    try:
        communication = db.query(HRCommunication).filter(
            HRCommunication.id == communication_id
        ).first()
        
        if not communication:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        old_values = communication.__dict__.copy()
        # Soft delete: set deleted_at timestamp
        communication.deleted_at = datetime.now()
        db.commit()
        audit_crud(request, db, {"email": "system"}, "SOFT_DELETE", "hr_communications", str(communication_id), old_values, {"deleted_at": communication.deleted_at})
        
        logger.info(f"✅ Communication {communication_id} soft deleted successfully")
        return {"message": "Communication deleted successfully"}
    except Exception as e:
        logger.error(f"❌ Error deleting communication: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=list)
def list_communications(db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    # Check permissions - allow both view_hr_letters and view_self
    user_permissions = user.get('permissions', [])
    if not any(perm in user_permissions for perm in ['view_hr_letters', 'view_self']) and user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        query = db.query(HRCommunication).filter(
            HRCommunication.deleted_at.is_(None)
        ).order_by(HRCommunication.created_at.desc())
        
        # view_self takes precedence - if user has view_self, restrict to own records regardless of other permissions
        if 'view_self' in user_permissions:
            current_user_id = user.get('user_id')
            if current_user_id:
                # Filter communications sent to current user
                query = query.filter(
                    (HRCommunication.sent_to_ids.contains([current_user_id])) |
                    (HRCommunication.sent_to_type == 'All')
                )
        
        communications = query.all()
        
        result = []
        for comm in communications:
            # Get employee details for sent_to_ids
            from models.models_tenant import User
            employee_names = []
            if comm.sent_to_ids:
                for emp_id in comm.sent_to_ids:
                    emp_user = db.query(User).filter(User.id == emp_id).first()
                    if emp_user:
                        employee_names.append(f"{emp_user.name} ({emp_user.employee_code})")
                    else:
                        employee_names.append(f"Employee {emp_id}")
            
            result.append({
                "id": comm.id,
                "employee": employee_names[0].split(' (')[1].replace(')', '') if employee_names and '(' in employee_names[0] else "All",
                "employeeType": comm.letter_type,
                "subject": comm.subject,
                "date": comm.created_at.strftime('%Y-%m-%d') if comm.created_at else None,
                "status": comm.status,
                "letter_type": comm.letter_type,
                "content": comm.content,
                "sent_to_type": comm.sent_to_type,
                "sent_to_ids": comm.sent_to_ids,
                "created_at": comm.created_at.isoformat() if comm.created_at is not None else None
            })
        
        return result
    except Exception as e:
        logger.error(f"❌ Error fetching communications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/deleted", response_model=list)
def list_deleted_communications(
    db: Session = Depends(get_tenant_db), 
    user = Depends(get_current_user)
):
    # Check permissions - allow admin or specific permission
    user_permissions = user.get('permissions', [])
    if not ('show_deleted_hr_letters' in user_permissions or user.get('role') == 'admin'):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        communications = db.query(HRCommunication).filter(
            HRCommunication.deleted_at.isnot(None)
        ).order_by(HRCommunication.deleted_at.desc()).all()
        
        result = []
        for comm in communications:
            from models.models_tenant import User
            employee_names = []
            if comm.sent_to_ids:
                for emp_id in comm.sent_to_ids:
                    emp_user = db.query(User).filter(User.id == emp_id).first()
                    if emp_user:
                        employee_names.append(f"{emp_user.name} ({emp_user.employee_code})")
                    else:
                        employee_names.append(f"Employee {emp_id}")
            
            result.append({
                "id": comm.id,
                "employee": employee_names[0].split(' (')[1].replace(')', '') if employee_names and '(' in employee_names[0] else "All",
                "employeeType": comm.letter_type,
                "subject": comm.subject,
                "date": comm.created_at.strftime('%Y-%m-%d') if comm.created_at else None,
                "status": "Deleted",
                "letter_type": comm.letter_type,
                "content": comm.content,
                "sent_to_type": comm.sent_to_type,
                "sent_to_ids": comm.sent_to_ids,
                "created_at": comm.created_at.isoformat() if comm.created_at is not None else None,
                "deleted_at": comm.deleted_at.isoformat() if comm.deleted_at is not None else None
            })
        
        return result
    except Exception as e:
        logger.error(f"❌ Error fetching deleted communications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/restore/{communication_id}", response_model=dict)
def restore_communication(
    communication_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    _: dict = Depends(require_permission("restore_hr_letter"))
):
    try:
        communication = db.query(HRCommunication).filter(
            HRCommunication.id == communication_id,
            HRCommunication.deleted_at.isnot(None)
        ).first()
        
        if not communication:
            raise HTTPException(status_code=404, detail="Deleted communication not found")
        
        old_values = {"deleted_at": communication.deleted_at}
        communication.deleted_at = None
        db.commit()
        audit_crud(request, db, {"email": "system"}, "RESTORE", "hr_communications", str(communication_id), old_values, {"deleted_at": None})
        
        logger.info(f"✅ Communication {communication_id} restored successfully")
        return {"message": "Communication restored successfully"}
    except Exception as e:
        logger.error(f"❌ Error restoring communication: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/employee-details/{employee_identifier}")
def get_employee_details(
    employee_identifier: str,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Get comprehensive employee details for printing"""
    try:
        from models.models_tenant import (
            User, Employee, OnboardingCandidate, EmployeeFamily, EmployeeEducation,
            EmployeeExperience, EmployeeMedical, EmployeeIDDocs, EmployeeSkills,
            EmployeeCertifications, EmployeeSalary, EmployeeBankDetails
        )
        
        # Find employee by different methods
        employee = None
        employee_data = {}
        
        # Try to find in User table first
        if employee_identifier.isdigit():
            employee = db.query(User).filter(User.id == int(employee_identifier)).first()
        else:
            employee = db.query(User).filter(User.employee_code == employee_identifier).first()
        
        if employee:
            employee_data = {
                "id": employee.id,
                "name": employee.name,
                "email": employee.email,
                "employee_code": employee.employee_code,
                "employee_type": employee.employee_type,
                "designation": employee.designation,
                "joining_date": employee.joining_date.isoformat() if employee.joining_date else None,
                "status": employee.status,
                "department": employee.department.name if employee.department else None,
                "role": employee.role.name if employee.role else None,
                "source": "user_management"
            }
            employee_id = employee.id
        else:
            # Try OnboardingCandidate table
            if employee_identifier.isdigit():
                onboarding = db.query(OnboardingCandidate).filter(
                    OnboardingCandidate.application_id == int(employee_identifier)
                ).first()
            else:
                onboarding = db.query(OnboardingCandidate).filter(
                    OnboardingCandidate.employee_id == employee_identifier
                ).first()
            
            if onboarding:
                employee_data = {
                    "id": onboarding.application_id,
                    "name": onboarding.candidate_name,
                    "employee_code": onboarding.employee_id,
                    "designation": onboarding.job_title,
                    "department": onboarding.department,
                    "joining_date": onboarding.joining_date.isoformat() if onboarding.joining_date else None,
                    "work_location": onboarding.work_location,
                    "reporting_manager": onboarding.reporting_manager,
                    "status": onboarding.status,
                    "source": "onboarding"
                }
                employee_id = onboarding.application_id
            else:
                raise HTTPException(status_code=404, detail="Employee not found")
        
        # Get additional details if employee found
        if employee_id:
            # Family details
            family = db.query(EmployeeFamily).filter(EmployeeFamily.employee_id == employee_id).all()
            employee_data["family"] = [{
                "name": f.name,
                "relationship": f.relationship,
                "age": f.age,
                "contact": f.contact,
                "dependent": f.dependent
            } for f in family]
            
            # Education details
            education = db.query(EmployeeEducation).filter(EmployeeEducation.employee_id == employee_id).all()
            employee_data["education"] = [{
                "degree": e.degree,
                "specialization": e.specialization,
                "university": e.university,
                "start_year": e.start_year,
                "end_year": e.end_year,
                "percentage_cgpa": e.percentage_cgpa
            } for e in education]
            
            # Experience details
            experience = db.query(EmployeeExperience).filter(EmployeeExperience.employee_id == employee_id).all()
            employee_data["experience"] = [{
                "company": ex.company,
                "job_title": ex.job_title,
                "department": ex.department,
                "employment_type": ex.employment_type,
                "start_date": ex.start_date.isoformat() if ex.start_date else None,
                "end_date": ex.end_date.isoformat() if ex.end_date else None,
                "current_job": ex.current_job,
                "salary": ex.salary,
                "location": ex.location
            } for ex in experience]
            
            # Medical details
            medical = db.query(EmployeeMedical).filter(EmployeeMedical.employee_id == employee_id).first()
            if medical:
                employee_data["medical"] = {
                    "blood_group": medical.blood_group,
                    "height": medical.height,
                    "weight": medical.weight,
                    "allergies": medical.allergies,
                    "emergency_contact_name": medical.emergency_contact_name,
                    "emergency_contact_phone": medical.emergency_contact_phone,
                    "emergency_contact_relation": medical.emergency_contact_relation
                }
            
            # Skills
            skills = db.query(EmployeeSkills).filter(EmployeeSkills.employee_id == employee_id).all()
            employee_data["skills"] = [{
                "skill_name": s.skill_name,
                "rating": s.rating
            } for s in skills]
            
            # Certifications
            certifications = db.query(EmployeeCertifications).filter(EmployeeCertifications.employee_id == employee_id).all()
            employee_data["certifications"] = [{
                "certification": c.certification,
                "issued_by": c.issued_by,
                "expiry_date": c.expiry_date.isoformat() if c.expiry_date else None
            } for c in certifications]
            
            # Salary details
            salary = db.query(EmployeeSalary).filter(EmployeeSalary.employee_id == employee_id).first()
            if salary:
                employee_data["salary"] = {
                    "ctc": salary.ctc,
                    "basic_percent": salary.basic_percent,
                    "hra_percent": salary.hra_percent,
                    "allowances_percent": salary.allowances_percent,
                    "pf_eligible": salary.pf_eligible,
                    "esi_eligible": salary.esi_eligible
                }
            
            # Bank details
            bank = db.query(EmployeeBankDetails).filter(EmployeeBankDetails.employee_id == employee_id).first()
            if bank:
                employee_data["bank_details"] = {
                    "account_holder_name": bank.account_holder_name,
                    "bank_name": bank.bank_name,
                    "account_number": bank.account_number,
                    "ifsc_code": bank.ifsc_code,
                    "branch_name": bank.branch_name,
                    "account_type": bank.account_type
                }
        
        return employee_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching employee details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee details: {str(e)}")

@router.get("/print/{communication_id}")
def print_hr_letter(
    communication_id: int,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(require_permission("print_hr_letter"))
):
    """Generate PDF for HR letter with organization header"""
    try:
        # Get communication details
        communication = db.query(HRCommunication).filter(
            HRCommunication.id == communication_id
        ).first()
        
        if not communication:
            raise HTTPException(status_code=404, detail="Communication not found")
        
        # Get comprehensive employee details if specific employee
        employee_details = None
        employee_name = "All Employees"
        employee_code = "ALL"
        
        if communication.sent_to_ids and len(communication.sent_to_ids) > 0:
            employee_identifier = communication.sent_to_ids[0]
            
            try:
                # Get comprehensive employee details
                employee_details = get_employee_details(str(employee_identifier), db, user)
                employee_name = employee_details.get('name', 'Unknown Employee')
                employee_code = employee_details.get('employee_code', str(employee_identifier))
            except:
                # Fallback to basic employee lookup
                employee = None
                
                # Try different approaches to find the employee
                if isinstance(employee_identifier, str):
                    employee = db.query(User).filter(User.employee_code == employee_identifier).first()
                
                if not employee:
                    try:
                        user_id = int(employee_identifier)
                        employee = db.query(User).filter(User.id == user_id).first()
                    except (ValueError, TypeError):
                        pass
                
                if not employee:
                    try:
                        emp_id = int(employee_identifier)
                        employee = db.query(Employee).filter(Employee.id == emp_id).first()
                    except (ValueError, TypeError):
                        pass
                
                if employee:
                    employee_name = getattr(employee, 'name', 'Unknown Employee')
                    employee_code = getattr(employee, 'employee_code', str(employee_identifier))
                else:
                    employee_name = f"Employee {employee_identifier}"
                    employee_code = str(employee_identifier)
        
        # Generate PDF with comprehensive employee details
        pdf_buffer = generate_hr_letter_pdf(communication, employee_name, employee_code, db, employee_details)
        
        # Return as streaming response
        filename = f"hr_letter_{communication.letter_type}_{employee_code}_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        audit_crud(request, db, user, "PRINT", "hr_communications", str(communication_id), {}, {"action": "print_pdf", "employee_details_included": employee_details is not None})
        
        return StreamingResponse(
            io.BytesIO(pdf_buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating HR letter PDF: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

def generate_hr_letter_pdf(communication, employee_name, employee_code, db: Session, employee_details=None):
    """Generate PDF for HR letter using organization header"""
    try:
        buffer = io.BytesIO()
        
        # Create document with proper margins for header
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=140,  # Space for header
            bottomMargin=60,  # Space for footer
            leftMargin=40,
            rightMargin=40
        )
        
        # Create header/footer template with letter type as title
        template = PDFHeaderFooterTemplate(db, f"{communication.letter_type.upper()} LETTER")
        
        styles = getSampleStyleSheet()
        story = []
        
        # Letter details section
        letter_info_style = ParagraphStyle(
            'LetterInfo',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            leftIndent=0
        )
        
        # Date
        story.append(Paragraph(f"<b>Date:</b> {communication.created_at.strftime('%B %d, %Y') if communication.created_at else datetime.now().strftime('%B %d, %Y')}", letter_info_style))
        
        # To field
        story.append(Paragraph(f"<b>To:</b> {employee_name} ({employee_code})", letter_info_style))
        
        story.append(Spacer(1, 20))
        
        # Subject
        subject_style = ParagraphStyle(
            'Subject',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=20,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER
        )
        story.append(Paragraph(f"<b>Subject: {communication.subject or 'No Subject'}</b>", subject_style))
        
        # Content
        content_style = ParagraphStyle(
            'Content',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=12,
            leading=16,
            alignment=TA_LEFT
        )
        
        # Add actual letter content
        if communication.content and communication.content.strip():
            # Handle different line break formats
            content_text = communication.content.strip()
            
            # Split by double line breaks first for paragraphs
            if '\n\n' in content_text:
                content_paragraphs = content_text.split('\n\n')
            else:
                # If no double breaks, treat as single paragraph
                content_paragraphs = [content_text]
            
            for para in content_paragraphs:
                if para.strip():
                    # Replace single line breaks with <br/> for proper formatting
                    formatted_para = para.strip().replace('\n', '<br/>')
                    story.append(Paragraph(formatted_para, content_style))
                    story.append(Spacer(1, 12))
        else:
            story.append(Paragraph("[No content provided]", content_style))
            story.append(Spacer(1, 12))
        
        story.append(Spacer(1, 40))
        
        # Add comprehensive employee details if available
        if employee_details:
            story.append(Spacer(1, 30))
            
            # Employee Details Section
            details_header_style = ParagraphStyle(
                'DetailsHeader',
                parent=styles['Normal'],
                fontSize=12,
                spaceAfter=15,
                fontName='Helvetica-Bold',
                alignment=TA_CENTER
            )
            story.append(Paragraph("<b>EMPLOYEE DETAILS</b>", details_header_style))
            
            details_style = ParagraphStyle(
                'Details',
                parent=styles['Normal'],
                fontSize=10,
                spaceAfter=6,
                leading=14
            )
            
            # Basic Information
            story.append(Paragraph("<b>Basic Information:</b>", details_style))
            story.append(Paragraph(f"Name: {employee_details.get('name', 'N/A')}", details_style))
            story.append(Paragraph(f"Employee Code: {employee_details.get('employee_code', 'N/A')}", details_style))
            story.append(Paragraph(f"Email: {employee_details.get('email', 'N/A')}", details_style))
            story.append(Paragraph(f"Designation: {employee_details.get('designation', 'N/A')}", details_style))
            story.append(Paragraph(f"Department: {employee_details.get('department', 'N/A')}", details_style))
            story.append(Paragraph(f"Joining Date: {employee_details.get('joining_date', 'N/A')}", details_style))
            story.append(Paragraph(f"Status: {employee_details.get('status', 'N/A')}", details_style))
            story.append(Spacer(1, 10))
            
            # Experience Details
            if employee_details.get('experience'):
                story.append(Paragraph("<b>Work Experience:</b>", details_style))
                for exp in employee_details['experience'][:3]:  # Show top 3 experiences
                    story.append(Paragraph(f"• {exp.get('job_title', 'N/A')} at {exp.get('company', 'N/A')} ({exp.get('start_date', 'N/A')} - {exp.get('end_date', 'Present')})", details_style))
                story.append(Spacer(1, 10))
            
            # Education Details
            if employee_details.get('education'):
                story.append(Paragraph("<b>Education:</b>", details_style))
                for edu in employee_details['education'][:2]:  # Show top 2 education records
                    story.append(Paragraph(f"• {edu.get('degree', 'N/A')} in {edu.get('specialization', 'N/A')} from {edu.get('university', 'N/A')} ({edu.get('end_year', 'N/A')})", details_style))
                story.append(Spacer(1, 10))
            
            # Skills
            if employee_details.get('skills'):
                story.append(Paragraph("<b>Skills:</b>", details_style))
                skills_text = ", ".join([f"{skill['skill_name']} ({skill['rating']}/5)" for skill in employee_details['skills'][:5]])
                story.append(Paragraph(f"• {skills_text}", details_style))
                story.append(Spacer(1, 10))
            
            # Medical Information (if available)
            if employee_details.get('medical'):
                medical = employee_details['medical']
                story.append(Paragraph("<b>Emergency Contact:</b>", details_style))
                story.append(Paragraph(f"• {medical.get('emergency_contact_name', 'N/A')} ({medical.get('emergency_contact_relation', 'N/A')}) - {medical.get('emergency_contact_phone', 'N/A')}", details_style))
                story.append(Spacer(1, 10))
            
            # Family Details
            if employee_details.get('family'):
                story.append(Paragraph("<b>Family Members:</b>", details_style))
                for family in employee_details['family'][:3]:  # Show top 3 family members
                    story.append(Paragraph(f"• {family.get('name', 'N/A')} ({family.get('relationship', 'N/A')}, Age: {family.get('age', 'N/A')})", details_style))
                story.append(Spacer(1, 10))
        
        story.append(Spacer(1, 30))
        
        # Signature section
        signature_style = ParagraphStyle(
            'Signature',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=8,
            alignment=TA_LEFT
        )
        
        story.append(Paragraph("Best regards,", signature_style))
        story.append(Spacer(1, 40))
        story.append(Paragraph("_________________________", signature_style))
        story.append(Paragraph("<b>Human Resources Department</b>", signature_style))
        
        # Build PDF with header and footer
        doc.build(story, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
        
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        logger.error(f"❌ Error generating HR letter PDF: {e}")
        raise Exception(f"Failed to generate PDF: {str(e)}")
