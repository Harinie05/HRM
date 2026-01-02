from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_tenant_db
from models.models_tenant import TrainingProgram, TrainingApplication, User
from pydantic import BaseModel
from typing import Optional
from datetime import date
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user

router = APIRouter()

class TrainingProgramCreate(BaseModel):
    title: str
    category: str
    type: str
    trainer: str
    department: Optional[str] = None
    start_date: date
    end_date: date
    max_participants: Optional[int] = None
    status: str = "Draft"

@router.post("/programs")
async def create_training_program(program: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        # Parse dates
        start_date = None
        end_date = None
        if program.get('startDate'):
            from datetime import datetime
            start_date = datetime.strptime(program['startDate'], '%Y-%m-%d').date()
        if program.get('endDate'):
            from datetime import datetime
            end_date = datetime.strptime(program['endDate'], '%Y-%m-%d').date()

        # Handle empty max_participants
        max_participants = program.get('maxParticipants')
        if max_participants == '' or max_participants is None:
            max_participants = None
        else:
            max_participants = int(max_participants)

        db_program = TrainingProgram(
            title=program.get('title'),
            category=program.get('category'),
            type=program.get('type'),
            trainer=program.get('trainer'),
            department=program.get('department') if program.get('department') else None,
            start_date=start_date,
            end_date=end_date,
            max_participants=max_participants,
            description=program.get('description'),
            status=program.get('status', 'Draft')
        )
        db.add(db_program)
        db.commit()
        db.refresh(db_program)
        
        # Audit log
        audit_crud(request, db, user, "CREATE_TRAINING_PROGRAM", "training_programs", str(db_program.id), {}, program)
        
        return {"message": "Training program created successfully", "id": db_program.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating training program: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error creating training program: {str(e)}")

@router.get("/programs")
async def get_training_programs(request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        audit_crud(request, db, user, "VIEW_TRAINING_PROGRAMS", "training_programs", "all", {}, {})
        
        programs = db.query(TrainingProgram).all()
        
        programs_data = []
        for program in programs:
            programs_data.append({
                "id": program.id,
                "title": program.title,
                "category": program.category,
                "type": program.type,
                "trainer": program.trainer,
                "department": program.department,
                "startDate": program.start_date.strftime('%Y-%m-%d') if program.start_date is not None else None,
                "endDate": program.end_date.strftime('%Y-%m-%d') if program.end_date is not None else None,
                "maxParticipants": program.max_participants,
                "status": program.status,
                "created_at": program.created_at.strftime('%Y-%m-%d %H:%M:%S') if program.created_at is not None else None
            })
        
        return {"data": programs_data}
    except Exception as e:
        print(f"Error fetching training programs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching training programs: {str(e)}")

@router.put("/programs/{program_id}")
async def update_training_program(program_id: int, program: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        db_program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
        if not db_program:
            raise HTTPException(status_code=404, detail="Training program not found")
        
        # Store old values for audit
        old_values = {"title": db_program.title, "category": db_program.category, "type": db_program.type, "status": db_program.status}
        
        # Parse dates
        if program.get('startDate'):
            from datetime import datetime
            db_program.start_date = datetime.strptime(program['startDate'], '%Y-%m-%d').date()  # type: ignore
        if program.get('endDate'):
            from datetime import datetime
            db_program.end_date = datetime.strptime(program['endDate'], '%Y-%m-%d').date()  # type: ignore
        
        # Update other fields
        if program.get('title'):
            db_program.title = program['title']
        if program.get('category'):
            db_program.category = program['category']
        if program.get('type'):
            db_program.type = program['type']
        if program.get('trainer'):
            db_program.trainer = program['trainer']
        if program.get('department'):
            db_program.department = program['department']
        if program.get('maxParticipants'):
            db_program.max_participants = program['maxParticipants']
        if program.get('status'):
            db_program.status = program['status']
        
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "UPDATE_TRAINING_PROGRAM", "training_programs", str(program_id), old_values, program)
        
        return {"message": "Training program updated successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error updating training program: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error updating training program: {str(e)}")

@router.delete("/programs/{program_id}")
async def delete_training_program(program_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        db_program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
        if not db_program:
            raise HTTPException(status_code=404, detail="Training program not found")
        
        # Store old values for audit
        old_values = {"title": db_program.title, "category": db_program.category, "type": db_program.type}
        
        db.delete(db_program)
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "DELETE_TRAINING_PROGRAM", "training_programs", str(program_id), old_values, {})
        
        return {"message": "Training program deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting training program: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error deleting training program: {str(e)}")

@router.get("/programs/{program_id}")
async def get_training_program(program_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        audit_crud(request, db, user, "VIEW_TRAINING_PROGRAM", "training_programs", str(program_id), {}, {"program_id": program_id})
        
        program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
        if not program:
            raise HTTPException(status_code=404, detail="Training program not found")
        
        return {
            "id": program.id,
            "title": program.title,
            "category": program.category,
            "type": program.type,
            "trainer": program.trainer,
            "department": program.department,
            "startDate": program.start_date.strftime('%Y-%m-%d') if program.start_date is not None else None,
            "endDate": program.end_date.strftime('%Y-%m-%d') if program.end_date is not None else None,
            "maxParticipants": program.max_participants,
            "description": program.description,
            "status": program.status,
            "created_at": program.created_at.strftime('%Y-%m-%d %H:%M:%S') if program.created_at is not None else None
        }
    except Exception as e:
        print(f"Error fetching training program: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching training program: {str(e)}")

@router.post("/programs/{program_id}/apply")
async def apply_to_program(program_id: int, application: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        # Check if program exists
        program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
        if not program:
            raise HTTPException(status_code=404, detail="Training program not found")
        
        # Create application
        db_application = TrainingApplication(
            program_id=program_id,
            name=application.get('name'),
            email=application.get('email'),
            phone=application.get('phone'),
            employee_id=application.get('employee_id'),
            department=application.get('department'),
            experience=application.get('experience'),
            motivation=application.get('motivation')
        )
        
        db.add(db_application)
        db.commit()
        db.refresh(db_application)
        
        audit_crud(request, db, user, "CREATE_TRAINING_APPLICATION", "training_applications", str(db_application.id), {}, application)
        
        return {"message": "Application submitted successfully", "id": db_application.id}
    except Exception as e:
        db.rollback()
        print(f"Error submitting application: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error submitting application: {str(e)}")

@router.get("/programs/{program_id}/applications")
async def get_program_applications(program_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        audit_crud(request, db, user, "VIEW_TRAINING_APPLICATIONS", "training_applications", str(program_id), {}, {"program_id": program_id})
        
        applications = db.query(TrainingApplication).filter(TrainingApplication.program_id == program_id).all()
        
        applications_data = []
        for app in applications:
            applications_data.append({
                "id": app.id,
                "name": app.name,
                "email": app.email,
                "phone": app.phone,
                "employee_id": app.employee_id,
                "department": app.department,
                "experience": app.experience,
                "motivation": app.motivation,
                "status": app.status,
                "applied_at": app.applied_at.strftime('%Y-%m-%d %H:%M:%S') if app.applied_at is not None else None
            })
        
        return {"data": applications_data}
    except Exception as e:
        print(f"Error fetching applications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching applications: {str(e)}")

@router.get("/programs/{program_id}/accepted-applicants")
async def get_accepted_applicants(program_id: int, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        audit_crud(request, db, user, "VIEW_ACCEPTED_APPLICANTS", "training_applications", str(program_id), {}, {"program_id": program_id, "status": "Accepted"})
        
        applications = db.query(TrainingApplication).filter(
            TrainingApplication.program_id == program_id,
            TrainingApplication.status == 'Accepted'
        ).all()
        
        applicants_data = []
        for app in applications:
            applicants_data.append({
                "id": app.id,
                "applicant_name": app.name,
                "name": app.name,
                "email": app.email,
                "employee_id": app.employee_id,
                "department": app.department
            })
        
        return {"data": applicants_data}
    except Exception as e:
        print(f"Error fetching accepted applicants: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching accepted applicants: {str(e)}")

@router.put("/applications/{application_id}/status")
async def update_application_status(application_id: int, status_data: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        application = db.query(TrainingApplication).filter(TrainingApplication.id == application_id).first()
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        old_status = application.status
        application.status = status_data.get('status')  # type: ignore
        application.reviewed_by = user.get('id') if isinstance(user, dict) else user.id  # type: ignore
        from datetime import datetime
        application.reviewed_at = datetime.utcnow()  # type: ignore
        
        db.commit()
        
        # Audit log
        audit_crud(request, db, user, "UPDATE_APPLICATION_STATUS", "training_applications", str(application_id), {"status": old_status}, status_data)
        
        return {"message": "Application status updated successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error updating application status: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error updating application status: {str(e)}")

@router.post("/send-enrollment-emails")
async def send_enrollment_emails(email_data: dict, request: Request, db: Session = Depends(get_tenant_db), user = Depends(get_current_user)):
    try:
        from utils.email import send_email
        
        program_id = email_data.get('program_id')
        application_ids = email_data.get('application_ids', [])
        subject = email_data.get('subject', 'Training Program Enrollment')
        message_template = email_data.get('message', '')
        
        # Get program details
        program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")
        
        # Get applications
        applications = db.query(TrainingApplication).filter(TrainingApplication.id.in_(application_ids)).all()
        
        sent_count = 0
        for app in applications:
            try:
                # Personalize message
                personalized_message = message_template.replace('[Name]', app.name or '')
                personalized_message = personalized_message.replace('[Program Title]', program.title or '')
                personalized_message = personalized_message.replace('[Category]', program.category or '')
                personalized_message = personalized_message.replace('[Type]', program.type or '')
                personalized_message = personalized_message.replace('[Trainer]', program.trainer or '')
                personalized_message = personalized_message.replace('[Start Date]', program.start_date.strftime('%Y-%m-%d') if program.start_date is not None else 'TBD')
                personalized_message = personalized_message.replace('[End Date]', program.end_date.strftime('%Y-%m-%d') if program.end_date is not None else 'TBD')
                personalized_message = personalized_message.replace('[Department]', program.department or 'All Departments')
                
                # Calculate duration
                if program.start_date is not None and program.end_date is not None:
                    duration = (program.end_date - program.start_date).days + 1
                    personalized_message = personalized_message.replace('[Duration]', f'{duration} days')
                else:
                    personalized_message = personalized_message.replace('[Duration]', 'TBD')
                
                # Convert to HTML
                html_content = personalized_message.replace('\n', '<br>')
                
                # Send email
                success = send_email(
                    to_email=str(app.email),
                    subject=subject.replace('[Program Title]', program.title or 'Training Program'),
                    html_content=html_content
                )
                
                if success:
                    sent_count += 1
                    
                    # Audit successful email
                    audit_crud(request, db, user, "SEND_TRAINING_EMAIL", "email_communications", str(app.id), {}, {
                        "recipient": str(app.email),
                        "subject": subject.replace('[Program Title]', program.title or 'Training Program'),
                        "email_type": "training_enrollment",
                        "status": "sent",
                        "applicant_name": app.name,
                        "program_title": program.title,
                        "program_id": program_id
                    })
                else:
                    # Audit failed email
                    audit_crud(request, db, user, "SEND_TRAINING_EMAIL", "email_communications", str(app.id), {}, {
                        "recipient": str(app.email),
                        "subject": subject.replace('[Program Title]', program.title or 'Training Program'),
                        "email_type": "training_enrollment",
                        "status": "failed",
                        "applicant_name": app.name,
                        "program_title": program.title,
                        "error": "Email sending failed"
                    })
                    
            except Exception as e:
                print(f"Failed to send email to {app.email}: {str(e)}")
                # Audit failed email with exception
                audit_crud(request, db, user, "SEND_TRAINING_EMAIL", "email_communications", str(app.id), {}, {
                    "recipient": str(app.email),
                    "subject": subject.replace('[Program Title]', program.title or 'Training Program'),
                    "email_type": "training_enrollment",
                    "status": "failed",
                    "applicant_name": app.name,
                    "program_title": program.title,
                    "error": str(e)
                })
                continue
        
        return {"message": f"Emails sent successfully to {sent_count} candidates"}
        
    except Exception as e:
        print(f"Error sending enrollment emails: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending emails: {str(e)}")