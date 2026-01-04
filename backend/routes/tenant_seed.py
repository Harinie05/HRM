# tenant_seed.py

from sqlalchemy.orm import sessionmaker

# Import models
from models.models_tenant import (
    MasterBase,
    Role,
    Permission,
    RolePermission,
    Department,
    User,
    CompanyProfile,
    Branch,
    Shift,
)

import database

# -------------------------------------------------------------
# DEFAULT PERMISSIONS  (ONLY PERMISSIONS — NO DEFAULT ROLES)
# -------------------------------------------------------------
DEFAULT_PERMISSIONS = [

    # =====================================================
    # 👥 USER MANAGEMENT
    # =====================================================

    # Users
    {"name": "view_users", "description": "Can view users"},
    {"name": "add_user", "description": "Can add users"},
    {"name": "edit_user", "description": "Can edit users"},
    {"name": "delete_user", "description": "Can delete users"},

    # User Management – Departments
    {"name": "view_user_departments", "description": "Can view departments in user management"},
    {"name": "add_user_department", "description": "Can add department in user management"},
    {"name": "edit_user_department", "description": "Can edit department in user management"},
    {"name": "delete_user_department", "description": "Can delete department in user management"},

    # User Management – Roles
    {"name": "view_user_roles", "description": "Can view roles in user management"},
    {"name": "add_user_role", "description": "Can add role in user management"},
    {"name": "edit_user_role", "description": "Can edit role in user management"},
    {"name": "delete_user_role", "description": "Can delete role in user management"},


    # =====================================================
    # 👤 EMPLOYEE MANAGEMENT
    # =====================================================

    # Employee Directory
    {"name": "view_employees", "description": "Can view employee directory"},
    {"name": "create_employee_code", "description": "Can create employee codes"},
    {"name": "view_employee_profile", "description": "Can view employee profiles"},
    {"name": "delete_employee", "description": "Can delete employees"},


    # =====================================================
    # 🏢 ORGANIZATION SETUP
    # =====================================================

    # Company Profile
    {"name": "view_company_profile", "description": "Can view company profile"},
    {"name": "add_company_profile", "description": "Can add company profile"},

    # Branch / Unit
    {"name": "view_branch", "description": "Can view branch"},
    {"name": "add_branch", "description": "Can add branch"},

    # Department
    {"name": "view_department", "description": "Can view department"},

    # Designation
    {"name": "view_designation", "description": "Can view designation"},


    # =====================================================
    # 📊 REPORTING STRUCTURE
    # =====================================================

    # Reporting Levels
    {"name": "view_reporting_levels", "description": "Can view reporting levels"},
    {"name": "add_reporting_level", "description": "Can add reporting level"},
    {"name": "edit_reporting_level", "description": "Can edit reporting level"},
    {"name": "delete_reporting_level", "description": "Can delete reporting level"},

    # Hierarchy Rules
    {"name": "view_hierarchy_rules", "description": "Can view hierarchy rules"},
    {"name": "add_hierarchy_rule", "description": "Can add hierarchy rule"},
    {"name": "edit_hierarchy_rule", "description": "Can edit hierarchy rule"},
    {"name": "delete_hierarchy_rule", "description": "Can delete hierarchy rule"},


    # =====================================================
    # 📅 HOLIDAY CALENDAR
    # =====================================================

    {"name": "view_holiday", "description": "Can view holiday"},
    {"name": "add_holiday", "description": "Can add holiday"},
    {"name": "edit_holiday", "description": "Can edit holiday"},
    {"name": "delete_holiday", "description": "Can delete holiday"},


    # =====================================================
    # 💼 JOB REQUISITION
    # =====================================================

    {"name": "view_job_requisition", "description": "Can view job requisitions"},
    {"name": "add_job_requisition", "description": "Can add job requisition"},
    {"name": "edit_job_requisition", "description": "Can edit job requisition"},
    {"name": "delete_job_requisition", "description": "Can delete job requisition"},
   

    # =====================================================
    # 🎯 RECRUITMENT SETUP
    # =====================================================

    {"name": "view_candidates", "description": "Can view candidates"},
    {"name": "edit_candidates", "description": "Can edit candidates"},
    {"name": "screen_candidates", "description": "Can screen candidates"},
    {"name": "generate_job_link", "description": "Can generate job application links"},
    {"name": "publish_job", "description": "Can publish job requisitions"},
    {"name": "delete_candidates", "description": "Can delete candidates"},

    # Screen Candidates Page
    {"name": "view_candidate", "description": "Can view candidate details in screening"},
    {"name": "select_candidates", "description": "Can select candidates"},
    {"name": "schedule_interviews", "description": "Can schedule interviews"},
    {"name": "view_resumes", "description": "Can view candidate resumes"},
    {"name": "view_ats_pipeline", "description": "Can view ATS pipeline"},

    # ATS Page
    {"name": "move_candidates", "description": "Can move candidates in ATS pipeline"},
    {"name": "view_active_jobs", "description": "Can view active jobs in ATS"},
    {"name": "view_ats_candidates", "description": "Can view candidates in ATS"},


    # =====================================================
    # 📄 OFFERS & CONTRACTS
    # =====================================================

    {"name": "generate_offer_link", "description": "Can generate offer links"},
    {"name": "verify_documents", "description": "Can verify candidate documents"},
    {"name": "view_documents", "description": "Can view candidate documents"},
    {"name": "manage_bgv", "description": "Can manage background verification"},
    {"name": "start_onboarding", "description": "Can start candidate onboarding"},
    {"name": "mark_onboarded", "description": "Can mark candidates as onboarded"},
    {"name": "view_offers_sent", "description": "Can view offers sent table"},
    {"name": "view_selected_candidates", "description": "Can view selected candidates table"},


    # =====================================================
    # 🎓 ONBOARDING
    # =====================================================

    {"name": "view_onboarding_documents", "description": "Can view onboarding documents"},
    {"name": "view_onboarding_candidates", "description": "Can view onboarding candidates"},
    {"name": "view_document_collected", "description": "Can view document collected status"},
    {"name": "add_document_collected", "description": "Can add document collected status"},


    # =====================================================
    # 🩺 CONSULTANTS
    # =====================================================

    # Consultant Management
    {"name": "view_consultants", "description": "Can view consultants"},
    {"name": "add_consultant", "description": "Can add consultant"},
    {"name": "edit_consultant", "description": "Can edit consultant"},
    {"name": "delete_consultant", "description": "Can delete/deactivate consultant"},

    # Availability Management
    {"name": "view_availability", "description": "Can view consultant availability"},
    {"name": "add_availability", "description": "Can add consultant availability"},

    # Payout Management
    {"name": "view_payouts", "description": "Can view consultant payouts"},
    {"name": "generate_payslip", "description": "Can generate payslips"},
    {"name": "send_payslip_email", "description": "Can send payslip emails"},
    {"name": "process_payroll", "description": "Can process payroll"},


    # =====================================================
    # 🚪 EXIT MANAGEMENT
    # =====================================================

    # Resignation Application
    {"name": "apply_resignation", "description": "Can apply for resignation"},
    {"name": "view_resignations", "description": "Can view resignation applications"},
    {"name": "approve_resignation", "description": "Can approve resignation applications"},

    # Exit Process Actions
    {"name": "manage_handover", "description": "Can manage handover process"},
    {"name": "manage_clearance", "description": "Can manage clearance process"},
    {"name": "manage_assets", "description": "Can manage asset return process"},
    {"name": "manage_settlement", "description": "Can manage final settlement process"},

    # Department-wise Exit Clearance
    {"name": "hr_clearance", "description": "Can manage HR clearance (paperwork, policy compliance, handover documentation)"},
    {"name": "it_clearance", "description": "Can manage IT clearance (laptop return, access cards, disable accounts, data backup)"},
    {"name": "finance_clearance", "description": "Can manage Finance clearance (final settlement, expense claims, tax clearance)"},
    {"name": "admin_clearance", "description": "Can manage Admin clearance (ID cards, keys, facility access, locker clearance)"},

    # Exit Interview
    {"name": "conduct_exit_interview", "description": "Can conduct exit interviews"},
    {"name": "view_exit_interviews", "description": "Can view exit interview records"},

    # Knowledge Transfer
    {"name": "view_kt_plans", "description": "Can view knowledge transfer plans"},
    {"name": "add_kt_plan", "description": "Can add knowledge transfer plans"},
    {"name": "create_kt_plan", "description": "Can create knowledge transfer plans"},
    {"name": "complete_kt_items", "description": "Can mark knowledge transfer items as complete"},
    {"name": "hr_approve_kt", "description": "Can approve knowledge transfer plans as HR"},
    {"name": "manager_approve_kt", "description": "Can approve knowledge transfer plans as Manager"},

    # F&F Settlement & Documents
    {"name": "view_settlements", "description": "Can view F&F settlements"},
    {"name": "calculate_settlements", "description": "Can calculate F&F settlements"},
    {"name": "approve_settlements", "description": "Can approve F&F settlements"},
    {"name": "generate_experience_letter", "description": "Can generate experience letters"},
    {"name": "edit_experience_letter", "description": "Can edit experience letters"},
    {"name": "download_settlement_pdf", "description": "Can download settlement PDFs"},
    {"name": "email_settlement_docs", "description": "Can email settlement documents"},
    {"name": "edit_settlements", "description": "Can edit F&F settlements"},

    # =====================================================
    # 💰 STATUTORY RULES & COMPLIANCE
    # =====================================================

    # Statutory Calculations
    {"name": "view_statutory_calculations", "description": "Can view statutory deduction calculations"},
    {"name": "add_statutory_calculation", "description": "Can add statutory deduction calculations"},
    {"name": "edit_statutory_calculation", "description": "Can edit statutory deduction calculations"},
    {"name": "delete_statutory_calculation", "description": "Can delete statutory deduction calculations"},
    {"name": "view_deleted_statutory", "description": "Can view deleted statutory calculations"},
    {"name": "restore_statutory_calculation", "description": "Can restore deleted statutory calculations"},

    # Labour Register
    {"name": "view_labour_register", "description": "Can view labour law registers"},
    {"name": "add_labour_register", "description": "Can add labour law register entries"},
    {"name": "edit_labour_register", "description": "Can edit labour law register entries"},
    {"name": "delete_labour_register", "description": "Can delete labour law register entries"},
    {"name": "view_deleted_labour_register", "description": "Can view deleted labour register entries"},
    {"name": "restore_labour_register", "description": "Can restore deleted labour register entries"},

    # Leave Compliance
    {"name": "view_leave_compliance", "description": "Can view leave compliance records"},
    {"name": "add_leave_compliance", "description": "Can add leave compliance records"},
    {"name": "edit_leave_compliance", "description": "Can edit leave compliance records"},
    {"name": "delete_leave_compliance", "description": "Can delete leave compliance records"},
    {"name": "view_deleted_leave_compliance", "description": "Can view deleted leave compliance records"},
    {"name": "restore_leave_compliance", "description": "Can restore deleted leave compliance records"},

    # NABH Compliance
    {"name": "view_nabh_compliance", "description": "Can view NABH compliance records"},
    {"name": "add_nabh_compliance", "description": "Can add NABH compliance records"},
    {"name": "edit_nabh_compliance", "description": "Can edit NABH compliance records"},
    {"name": "delete_nabh_compliance", "description": "Can delete NABH compliance records"},
    {"name": "view_deleted_nabh_compliance", "description": "Can view deleted NABH compliance records"},
    {"name": "restore_nabh_compliance", "description": "Can restore deleted NABH compliance records"},

    # =====================================================
    # 🎓 TRAINING & DEVELOPMENT
    # =====================================================

    # Training Programs
    {"name": "view_training_programs", "description": "Can view training programs"},
    {"name": "add_training_program", "description": "Can add new training programs"},
    {"name": "edit_training_program", "description": "Can edit training programs"},
    {"name": "delete_training_program", "description": "Can delete training programs"},
    {"name": "view_enrolled_trainees", "description": "Can view enrolled trainees in programs"},
    {"name": "generate_training_link", "description": "Can generate training enrollment links"},
    {"name": "approve_training_applications", "description": "Can approve/reject training applications"},
    {"name": "select_send_training_emails", "description": "Can select candidates and send training emails"},

    # Training Calendar
    {"name": "view_training_calendar", "description": "Can view training calendar"},

    # Training Requests
    {"name": "view_training_requests", "description": "Can view training requests"},
    {"name": "add_training_request", "description": "Can add training requests"},
    {"name": "approve_training_request", "description": "Can approve training requests"},
    {"name": "reject_training_request", "description": "Can reject training requests"},

    # Attendance & Assessment
    {"name": "view_training_attendance", "description": "Can view training attendance"},
    {"name": "mark_training_attendance", "description": "Can mark training attendance"},
    {"name": "view_training_assessments", "description": "Can view training assessments"},
    {"name": "conduct_training_assessment", "description": "Can conduct training assessments"},
    {"name": "grade_training_assessment", "description": "Can grade training assessments"},

    # Certificates
    {"name": "view_training_certificates", "description": "Can view training certificates"},
    {"name": "generate_training_certificate", "description": "Can generate training certificates"},
    {"name": "download_training_certificate", "description": "Can download training certificates"},
    {"name": "email_training_certificate", "description": "Can email training certificates"},

    # =====================================================
    # 📊 PERFORMANCE MANAGEMENT SYSTEM
    # =====================================================

    # Work Assignments
    {"name": "view_work_assignments", "description": "Can view work assignments"},
    {"name": "add_work_assignment", "description": "Can create new work assignments"},
    {"name": "edit_work_assignment", "description": "Can edit work assignments"},
    {"name": "delete_work_assignment", "description": "Can delete work assignments"},
    {"name": "view_deleted_work_assignments", "description": "Can view deleted work assignments"},
    {"name": "restore_work_assignment", "description": "Can restore deleted work assignments"},
    {"name": "show_deleted_work_assignments", "description": "Can access show deleted work assignments button"},
    {"name": "view_my_assignments", "description": "Can view own assignments"},
    {"name": "assign_to_employees", "description": "Can assign work to employees"},

    # Goals & KPI (Read-Only Auto-Calculated)
    {"name": "view_goals_kpi", "description": "Can view goals and KPIs"},

    # Review Cycle
    {"name": "view_review_cycles", "description": "Can view performance review cycles"},
    {"name": "create_review_cycle", "description": "Can create performance review cycles"},
    {"name": "edit_review_cycle", "description": "Can edit performance review cycles"},
    {"name": "delete_review_cycle", "description": "Can delete performance review cycles"},
    {"name": "view_deleted_review_cycles", "description": "Can view deleted performance review cycles"},
    {"name": "restore_review_cycle", "description": "Can restore deleted performance review cycles"},
    {"name": "start_review_cycle", "description": "Can start performance review cycles"},
    {"name": "close_review_cycle", "description": "Can close performance review cycles"},
    {"name": "show_deleted_review_cycles", "description": "Can access show deleted review cycles button"},

    # Feedback
    {"name": "view_feedback", "description": "Can view performance feedback"},
    {"name": "give_feedback", "description": "Can provide performance feedback"},
    {"name": "request_feedback", "description": "Can request performance feedback"},
    {"name": "view_360_feedback", "description": "Can view 360-degree feedback"},
    {"name": "manage_feedback_forms", "description": "Can manage feedback forms and templates"},
    {"name": "edit_feedback", "description": "Can edit performance feedback"},
    {"name": "delete_feedback", "description": "Can delete performance feedback"},
    {"name": "restore_feedback", "description": "Can restore deleted performance feedback"},
    {"name": "show_deleted_feedback", "description": "Can access show deleted feedback button"},

    # Appraisal
    {"name": "view_appraisals", "description": "Can view performance appraisals"},
    {"name": "conduct_appraisal", "description": "Can conduct performance appraisals"},
    {"name": "submit_self_appraisal", "description": "Can submit self-appraisal"},
    {"name": "approve_appraisal", "description": "Can approve performance appraisals"},
    {"name": "view_appraisal_reports", "description": "Can view appraisal reports and analytics"},
    {"name": "edit_appraisal", "description": "Can edit performance appraisals"},
    {"name": "delete_appraisal", "description": "Can delete performance appraisals"},
    {"name": "restore_appraisal", "description": "Can restore deleted performance appraisals"},
    {"name": "show_deleted_appraisals", "description": "Can access show deleted appraisals button"},

    # Quality Indicators
    {"name": "view_quality_indicators", "description": "Can view quality performance indicators"},
    {"name": "add_quality_indicator", "description": "Can add quality performance indicators"},
    {"name": "edit_quality_indicator", "description": "Can edit quality performance indicators"},
    {"name": "delete_quality_indicator", "description": "Can delete quality performance indicators"},
    {"name": "measure_quality_metrics", "description": "Can measure and record quality metrics"},
    {"name": "restore_quality_indicator", "description": "Can restore deleted quality indicators"},
    {"name": "show_deleted_quality_indicators", "description": "Can access show deleted quality indicators button"},

    # =====================================================
    # 🏢 HR OPERATIONS & WORKFORCE MANAGEMENT
    # =====================================================

    # Lifecycle Actions
    {"name": "view_lifecycle_actions", "description": "Can view employee lifecycle actions"},
    {"name": "add_lifecycle_action", "description": "Can add employee lifecycle actions"},
    {"name": "edit_lifecycle_action", "description": "Can edit employee lifecycle actions"},
    {"name": "delete_lifecycle_action", "description": "Can delete employee lifecycle actions"},
    {"name": "approve_lifecycle_action", "description": "Can approve employee lifecycle actions"},
    {"name": "restore_lifecycle_action", "description": "Can restore deleted lifecycle actions"},
    {"name": "show_deleted_lifecycle_actions", "description": "Can access show deleted lifecycle actions button"},

    # HR Letters
    {"name": "view_hr_letters", "description": "Can view HR letters and templates"},
    {"name": "add_hr_letter", "description": "Can create HR letters"},
    {"name": "edit_hr_letter", "description": "Can edit HR letters"},
    {"name": "delete_hr_letter", "description": "Can delete HR letters"},
    {"name": "print_hr_letter", "description": "Can print HR letters"},
    {"name": "generate_hr_letter", "description": "Can generate HR letters from templates"},
    {"name": "send_hr_letter", "description": "Can send HR letters to employees"},
    {"name": "restore_hr_letter", "description": "Can restore deleted HR letters"},
    {"name": "show_deleted_hr_letters", "description": "Can access show deleted HR letters button"},

    # Grievances Desk
    {"name": "view_grievances", "description": "Can view employee grievances"},
    {"name": "add_grievance", "description": "Can file employee grievances"},
    {"name": "edit_grievance", "description": "Can edit employee grievances"},
    {"name": "delete_grievance", "description": "Can delete employee grievances"},
    {"name": "assign_grievance", "description": "Can assign grievances to handlers"},
    {"name": "resolve_grievance", "description": "Can resolve employee grievances"},
    {"name": "escalate_grievance", "description": "Can escalate employee grievances"},
    {"name": "restore_grievance", "description": "Can restore deleted grievances"},
    {"name": "show_deleted_grievances", "description": "Can access show deleted grievances button"},

    # Assets
    {"name": "view_assets", "description": "Can view company assets"},
    {"name": "add_asset", "description": "Can add company assets"},
    {"name": "edit_asset", "description": "Can edit company assets"},
    {"name": "delete_asset", "description": "Can delete company assets"},
    {"name": "assign_asset", "description": "Can assign assets to employees"},
    {"name": "return_asset", "description": "Can process asset returns"},
    {"name": "track_asset", "description": "Can track asset location and status"},
    {"name": "approve_asset", "description": "Can approve asset assignments"},
    {"name": "reject_asset", "description": "Can reject asset assignments"},
    {"name": "restore_asset", "description": "Can restore deleted assets"},
    {"name": "show_deleted_assets", "description": "Can access show deleted assets button"},

    # Insurance & Benefits
    {"name": "view_insurance_benefits", "description": "Can view insurance and benefits"},
    {"name": "add_insurance_benefit", "description": "Can add insurance and benefits"},
    {"name": "edit_insurance_benefit", "description": "Can edit insurance and benefits"},
    {"name": "delete_insurance_benefit", "description": "Can delete insurance and benefits"},
    {"name": "enroll_employee_benefits", "description": "Can enroll employees in benefits"},
    {"name": "process_claims", "description": "Can process insurance claims"},
    {"name": "manage_beneficiaries", "description": "Can manage employee beneficiaries"},
    {"name": "add_insurance_policy", "description": "Can add insurance policies"},
    {"name": "delete_insurance_policy", "description": "Can delete insurance policies"},
    {"name": "restore_insurance_benefit", "description": "Can restore deleted insurance benefits"},
    {"name": "show_deleted_insurance_benefits", "description": "Can access show deleted insurance benefits button"},

    # Staff Scheduling
    {"name": "view_staff_schedules", "description": "Can view staff schedules"},
    {"name": "add_staff_schedule", "description": "Can create staff schedules"},
    {"name": "edit_staff_schedule", "description": "Can edit staff schedules"},
    {"name": "delete_staff_schedule", "description": "Can delete staff schedules"},
    {"name": "assign_shifts", "description": "Can assign shifts to employees"},
    {"name": "manage_shift_swaps", "description": "Can manage employee shift swaps"},
    {"name": "approve_schedule_changes", "description": "Can approve schedule changes"},
    {"name": "restore_staff_schedule", "description": "Can restore deleted staff schedules"},
    {"name": "show_deleted_staff_schedules", "description": "Can access show deleted staff schedules button"},

    # =====================================================
    # 💰 PAYROLL MANAGEMENT
    # =====================================================

    # Salary Structure
    {"name": "view_salary_structure", "description": "Can view salary structures"},
    {"name": "add_salary_structure", "description": "Can add salary structures"},
    {"name": "edit_salary_structure", "description": "Can edit salary structures"},
    {"name": "delete_salary_structure", "description": "Can delete salary structures"},
    {"name": "view_salary_structure_details", "description": "Can view salary structure details"},
    {"name": "link_employees_salary_structure", "description": "Can link employees to salary structures"},

    # Statutory Rules
    {"name": "view_statutory_rules", "description": "Can view statutory rules"},
    {"name": "add_statutory_rule", "description": "Can add statutory rules"},
    {"name": "edit_statutory_rule", "description": "Can edit statutory rules"},
    {"name": "delete_statutory_rule", "description": "Can delete statutory rules"},

    # Payroll Run
    {"name": "view_payroll_run", "description": "Can view payroll runs"},
    {"name": "create_payroll_run", "description": "Can create payroll runs"},
    {"name": "process_payroll_run", "description": "Can process payroll runs"},
    {"name": "approve_payroll_run", "description": "Can approve payroll runs"},
    {"name": "delete_payroll_run", "description": "Can delete payroll runs"},

    # Adjustments
    {"name": "view_payroll_adjustments", "description": "Can view payroll adjustments"},
    {"name": "add_payroll_adjustment", "description": "Can add payroll adjustments"},
    {"name": "edit_payroll_adjustment", "description": "Can edit payroll adjustments"},
    {"name": "delete_payroll_adjustment", "description": "Can delete payroll adjustments"},
    {"name": "approve_payroll_adjustment", "description": "Can approve payroll adjustments"},

    # Salary Slip & Payment
    {"name": "view_salary_slips", "description": "Can view salary slips"},
    {"name": "generate_salary_slips", "description": "Can generate salary slips"},
    {"name": "download_salary_slips", "description": "Can download salary slips"},
    {"name": "email_salary_slips", "description": "Can email salary slips"},
    {"name": "process_payments", "description": "Can process salary payments"},
    {"name": "view_payment_status", "description": "Can view payment status"},

    # Reports & Compliance
    {"name": "view_payroll_reports", "description": "Can view payroll reports"},
    {"name": "generate_payroll_reports", "description": "Can generate payroll reports"},
    {"name": "export_payroll_data", "description": "Can export payroll data"},
    {"name": "view_compliance_reports", "description": "Can view compliance reports"},
    {"name": "generate_compliance_reports", "description": "Can generate compliance reports"},

]

# -------------------------------------------------------------
# SEED TENANT DATABASE AFTER CREATION (ONLY PERMISSIONS)
# -------------------------------------------------------------
def seed_tenant(tenant_db: str):
    print(f"\n🌱 Seeding tenant database: {tenant_db}")

    try:
        # Tenant engine
        engine = database.get_tenant_engine(tenant_db)

        # Session factory
        SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

        # Create all tenant tables
        MasterBase.metadata.create_all(bind=engine)
        print("✓ Tenant tables created")

        with SessionLocal() as db:
            # -----------------------------------------------------
            # Seed ONLY Permissions (NO Default Roles)
            # -----------------------------------------------------
            added_count = 0
            for perm in DEFAULT_PERMISSIONS:
                exists = db.query(Permission).filter_by(name=perm["name"]).first()
                if not exists:
                    new_perm = Permission(**perm)
                    db.add(new_perm)
                    added_count += 1
                    print(f"  + Adding permission: {perm['name']}")
                else:
                    print(f"  - Permission already exists: {perm['name']}")

            db.commit()
            print(f"✓ {added_count} new permissions seeded")

            # Verify permissions were added
            total_perms = db.query(Permission).count()
            print(f"✓ Total permissions in database: {total_perms}")

            # Clean up any unwanted records that might have been created
            unwanted_names = ['app apollo', 'apollo', 'test app', 'dummy']
            
            # Clean up any tables that might have unwanted records
            try:
                from models.models_tenant import LeaveType, Role, Department
                
                # Remove unwanted leave types
                for name in unwanted_names:
                    unwanted_leave = db.query(LeaveType).filter(LeaveType.name.ilike(f"%{name}%")).all()
                    for leave in unwanted_leave:
                        db.delete(leave)
                        print(f"  - Removed unwanted leave type: {leave.name}")
                
                # Remove unwanted roles
                for name in unwanted_names:
                    unwanted_roles = db.query(Role).filter(Role.name.ilike(f"%{name}%")).all()
                    for role in unwanted_roles:
                        db.delete(role)
                        print(f"  - Removed unwanted role: {role.name}")
                
                # Remove unwanted departments
                for name in unwanted_names:
                    unwanted_depts = db.query(Department).filter(Department.name.ilike(f"%{name}%")).all()
                    for dept in unwanted_depts:
                        db.delete(dept)
                        print(f"  - Removed unwanted department: {dept.name}")
                
                db.commit()
                print("✓ Cleanup completed")
            except Exception as cleanup_error:
                print(f"⚠️ Cleanup warning: {str(cleanup_error)}")

        print(f"🌱 Tenant seeding completed for: {tenant_db}\n")
    except Exception as e:
        print(f"❌ Error seeding tenant {tenant_db}: {str(e)}")
        raise e
