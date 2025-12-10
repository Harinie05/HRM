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
