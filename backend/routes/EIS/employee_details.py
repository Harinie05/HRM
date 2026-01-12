# routes/EIS/employee_details.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_tenant_db
from routes.hospital import get_current_user
import logging

logger = logging.getLogger("HRM")

router = APIRouter(prefix="/employee-details", tags=["Employee Details"])

@router.get("/list/all")
def list_all_employees(
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """List all available employees for debugging"""
    try:
        from models.models_tenant import User, OnboardingCandidate
        
        # Get users with employee codes
        users = db.query(User).filter(User.employee_code.isnot(None)).all()
        user_list = [{
            "id": u.id,
            "employee_code": u.employee_code,
            "name": u.name,
            "source": "user_management"
        } for u in users]
        
        # Get onboarding candidates
        onboarding = db.query(OnboardingCandidate).all()
        onboarding_list = [{
            "id": o.application_id,
            "employee_code": o.employee_id,
            "name": o.candidate_name,
            "source": "onboarding"
        } for o in onboarding]
        
        return {
            "users": user_list,
            "onboarding_candidates": onboarding_list,
            "total_users": len(user_list),
            "total_onboarding": len(onboarding_list)
        }
        
    except Exception as e:
        logger.error(f"❌ Error listing employees: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list employees: {str(e)}")

@router.get("/{employee_identifier}")
def get_comprehensive_employee_details(
    employee_identifier: str,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Get all comprehensive employee details by employee code or ID"""
    try:
        from models.models_tenant import (
            User, Employee, OnboardingCandidate, EmployeeFamily, EmployeeEducation,
            EmployeeExperience, EmployeeMedical, EmployeeIDDocs, EmployeeSkills,
            EmployeeCertifications, EmployeeSalary, EmployeeBankDetails, EmployeeDocuments
        )
        
        logger.info(f"Searching for employee: {employee_identifier}")
        
        # Find employee by different methods
        employee = None
        employee_data = {}
        employee_id = None
        
        # Try to find in User table first
        if employee_identifier.isdigit():
            employee = db.query(User).filter(User.id == int(employee_identifier)).first()
            logger.info(f"User table search by ID {employee_identifier}: {'Found' if employee else 'Not found'}")
        
        if not employee:
            employee = db.query(User).filter(User.employee_code == employee_identifier).first()
            logger.info(f"User table search by code {employee_identifier}: {'Found' if employee else 'Not found'}")
        
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
                logger.info(f"Onboarding table search by application_id {employee_identifier}: {'Found' if onboarding else 'Not found'}")
            
            if not onboarding:
                onboarding = db.query(OnboardingCandidate).filter(
                    OnboardingCandidate.employee_id == employee_identifier
                ).first()
                logger.info(f"Onboarding table search by employee_id {employee_identifier}: {'Found' if onboarding else 'Not found'}")
            
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
                # Log available employees for debugging
                users = db.query(User).filter(User.employee_code.isnot(None)).all()
                onboarding_candidates = db.query(OnboardingCandidate).all()
                
                logger.info(f"Available users with employee codes: {[(u.id, u.employee_code, u.name) for u in users[:5]]}")
                logger.info(f"Available onboarding candidates: {[(o.application_id, o.employee_id, o.candidate_name) for o in onboarding_candidates[:5]]}")
                
                raise HTTPException(status_code=404, detail=f"Employee not found with identifier: {employee_identifier}")
        
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
                "board_university": e.board_university,
                "start_year": e.start_year,
                "end_year": e.end_year,
                "percentage_cgpa": e.percentage_cgpa,
                "education_type": e.education_type,
                "country": e.country,
                "state": e.state,
                "city": e.city
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
                "location": ex.location,
                "job_description": ex.job_description,
                "achievements": ex.achievements,
                "reason_for_leaving": ex.reason_for_leaving,
                "reporting_manager": ex.reporting_manager,
                "manager_contact": ex.manager_contact
            } for ex in experience]
            
            # Medical details
            medical = db.query(EmployeeMedical).filter(EmployeeMedical.employee_id == employee_id).first()
            if medical:
                employee_data["medical"] = {
                    "blood_group": medical.blood_group,
                    "height": medical.height,
                    "weight": medical.weight,
                    "allergies": medical.allergies,
                    "chronic_conditions": medical.chronic_conditions,
                    "medications": medical.medications,
                    "emergency_contact_name": medical.emergency_contact_name,
                    "emergency_contact_phone": medical.emergency_contact_phone,
                    "emergency_contact_relation": medical.emergency_contact_relation,
                    "medical_insurance_provider": medical.medical_insurance_provider,
                    "medical_insurance_number": medical.medical_insurance_number,
                    "medical_council_registration_number": medical.medical_council_registration_number,
                    "medical_council_name": medical.medical_council_name,
                    "medical_council_expiry_date": medical.medical_council_expiry_date.isoformat() if medical.medical_council_expiry_date else None
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
                    "special_percent": salary.special_percent,
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
                    "account_type": bank.account_type,
                    "swift_code": bank.swift_code,
                    "bank_address": bank.bank_address
                }
            
            # ID Documents
            id_docs = db.query(EmployeeIDDocs).filter(EmployeeIDDocs.employee_id == employee_id).all()
            employee_data["id_documents"] = [{
                "document_type": doc.document_type,
                "expiry_date": doc.expiry_date.isoformat() if doc.expiry_date else None,
                "status": doc.status
            } for doc in id_docs]
            
            # Other Documents
            documents = db.query(EmployeeDocuments).filter(EmployeeDocuments.employee_id == employee_id).all()
            employee_data["documents"] = [{
                "doc_name": doc.doc_name,
                "uploaded_on": doc.uploaded_on.isoformat() if doc.uploaded_on else None
            } for doc in documents]
        
        logger.info(f"✅ Retrieved comprehensive details for employee: {employee_identifier}")
        return employee_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching employee details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee details: {str(e)}")

@router.get("/summary/{employee_identifier}")
def get_employee_summary(
    employee_identifier: str,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Get a summary of employee details for quick view"""
    try:
        # Get comprehensive details first
        full_details = get_comprehensive_employee_details(employee_identifier, db, user)
        
        # Create summary
        summary = {
            "basic_info": {
                "name": full_details.get("name"),
                "employee_code": full_details.get("employee_code"),
                "email": full_details.get("email"),
                "designation": full_details.get("designation"),
                "department": full_details.get("department"),
                "joining_date": full_details.get("joining_date"),
                "status": full_details.get("status")
            },
            "counts": {
                "family_members": len(full_details.get("family", [])),
                "education_records": len(full_details.get("education", [])),
                "work_experiences": len(full_details.get("experience", [])),
                "skills": len(full_details.get("skills", [])),
                "certifications": len(full_details.get("certifications", [])),
                "documents": len(full_details.get("documents", []))
            },
            "has_medical_info": full_details.get("medical") is not None,
            "has_salary_info": full_details.get("salary") is not None,
            "has_bank_details": full_details.get("bank_details") is not None
        }
        
        return summary
        
    except Exception as e:
        logger.error(f"❌ Error creating employee summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create employee summary: {str(e)}")