from database import get_tenant_engine, logger
from sqlalchemy import text
from models.models_tenant import (
    MasterBase,
    CompanyProfile,
    Branch,
    Shift,
    Holiday,
    Grade,
    Role,
    Permission,
    RolePermission,
    Department,
    User,
    HRPolicy,
    LeavePolicy,
    AttendancePolicy,
    JobRequisition,
    JobApplication,
    ApplicationStageHistory,
    OTPolicy,
    OfferLetter,
    BGV,
    OnboardingCandidate,
    DocumentUpload
)

tenant = "nutryah"  # Change this to your tenant database name

logger.info(f"Creating tables in tenant DB: {tenant}...")
print(f"Creating tables in tenant DB: {tenant}...")

engine = get_tenant_engine(tenant)
MasterBase.metadata.create_all(bind=engine)

# Add new columns to hr_policies table
from sqlalchemy import text
print("\nUpdating hr_policies table...")
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE hr_policies ADD COLUMN description TEXT NULL"))
        print("Added description column")
    except Exception as e:
        print(f"description: {e}")
    
    try:
        conn.execute(text("ALTER TABLE hr_policies ADD COLUMN document VARCHAR(255) NULL"))
        print("Added document column")
    except Exception as e:
        print(f"document: {e}")
    
    try:
        conn.execute(text("ALTER TABLE hr_policies DROP COLUMN code_of_conduct"))
        print("Removed code_of_conduct column")
    except Exception as e:
        print(f"code_of_conduct: {e}")
    
    conn.commit()

# Add new columns to users table for employee functionality
print("\nUpdating users table for employee fields...")
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN employee_code VARCHAR(50) NULL UNIQUE"))
        print("Added employee_code column")
    except Exception as e:
        print(f"employee_code: {e}")
    
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN employee_type VARCHAR(50) NULL"))
        print("Added employee_type column")
    except Exception as e:
        print(f"employee_type: {e}")
    
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN designation VARCHAR(150) NULL"))
        print("Added designation column")
    except Exception as e:
        print(f"designation: {e}")
    
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN joining_date DATE NULL"))
        print("Added joining_date column")
    except Exception as e:
        print(f"joining_date: {e}")
    
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'Active'"))
        print("Added status column")
    except Exception as e:
        print(f"status: {e}")
    
    conn.commit()

logger.info("Done. All tables created successfully.")
print("Done. All tables created successfully.")
print("\nTables created:")
print("  - roles")
print("  - permissions")
print("  - role_permissions")
print("  - departments")
print("  - users")
print("  - company_profile")
print("  - branches")
print("  - shifts")
print("  - grades")
print("  - holidays")
print("  - hr_policies")
print("  - leave_policies")
print("  - attendance_policies")
print("  - ot_policies")
print("  - job_requisitions")
print("\nHR Policy columns updated (description, document)")
print("job_applications")
print("application_stage_history")
print("offer_letters")
print("bgv")
print("onboarding_candidates")
print("document_uploads")
