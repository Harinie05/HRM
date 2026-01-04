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
