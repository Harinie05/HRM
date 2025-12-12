from sqlalchemy import text
from database import get_tenant_engine, logger

# ========================= IMPORT ALL TENANT MODELS =========================
from models.models_tenant import (
    MasterBase,

    # Core HR
    User,
    Role,
    Permission,
    RolePermission,
    Department,
    CompanyProfile,
    Branch,
    Shift,
    Grade,
    Holiday,
    HRPolicy,
    LeavePolicy,
    AttendancePolicy,
    OTPolicy,

    # Recruitment + ATS
    JobRequisition,
    Candidate,
    ApplicationStageHistory,
    InterviewSchedule,
    OfferLetter,
    BGV,

    # Onboarding
    OnboardingCandidate,
    DocumentUpload,

    # Employee Information System
    Employee,
    EmployeeFamily,
    EmployeeEducation,
    EmployeeExperience,
    EmployeeMedical,
    EmployeeIDDocs,
    EmployeeSkills,
    EmployeeCertifications,
    EmployeeSalary,
    EmployeeDocuments,
    EmployeeExit
)

# ========================= CONFIG =========================
tenant = "nutryah"
engine = get_tenant_engine(tenant)

print(f"\n🚀 Creating tables for tenant → {tenant}\n")

# ========================= CREATE TABLES =========================
MasterBase.metadata.create_all(bind=engine)

# ========================= HR POLICY UPDATES =========================
print("Updating hr_policies...")
with engine.connect() as conn:
    alter_statements = [
        ("ALTER TABLE hr_policies ADD COLUMN description TEXT", "description"),
        ("ALTER TABLE hr_policies ADD COLUMN document VARCHAR(255)", "document"),
        ("ALTER TABLE hr_policies DROP COLUMN code_of_conduct", "code_of_conduct")
    ]

    for sql, col in alter_statements:
        try:
            conn.execute(text(sql))
            print(f"✔️ Updated: {col}")
        except Exception as e:
            print(f"⚠️ {col}: {e}")

    conn.commit()

# ========================= USER TABLE UPDATES =========================
print("\nUpdating users table...")
with engine.connect() as conn:
    updates = [
        ("employee_code VARCHAR(50) UNIQUE", "employee_code"),
        ("employee_type VARCHAR(50)", "employee_type"),
        ("designation VARCHAR(150)", "designation"),
        ("joining_date DATE", "joining_date"),
        ("status VARCHAR(50) DEFAULT 'Active'", "status")
    ]

    for sql_def, name in updates:
        try:
            conn.execute(text(f"ALTER TABLE users ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")

    conn.commit()

# ========================= OFFER LETTERS TABLE UPDATES =========================
print("\nUpdating offer_letters table...")
with engine.connect() as conn:
    offer_updates = [
        ("candidate_id INT", "candidate_id"),
        ("candidate_name VARCHAR(150)", "candidate_name"),
        ("job_title VARCHAR(200)", "job_title"),
        ("department VARCHAR(100)", "department"),
        ("ctc INT", "ctc"),
        ("basic_percent INT DEFAULT 40", "basic_percent"),
        ("hra_percent INT DEFAULT 20", "hra_percent"),
        ("joining_date DATE", "joining_date"),
        ("probation_period VARCHAR(50) DEFAULT '3 Months'", "probation_period"),
        ("notice_period VARCHAR(50) DEFAULT '30 Days'", "notice_period"),
        ("terms TEXT", "terms"),
        ("document VARCHAR(255)", "document"),
        ("offer_status VARCHAR(50) DEFAULT 'Draft'", "offer_status"),
        ("token VARCHAR(200)", "token"),
        ("created_at DATETIME DEFAULT CURRENT_TIMESTAMP", "created_at")
    ]

    for sql_def, name in offer_updates:
        try:
            conn.execute(text(f"ALTER TABLE offer_letters ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")

    conn.commit()

# ========================= DOCUMENT UPLOADS TABLE UPDATES =========================
print("\nUpdating document_uploads table...")
with engine.connect() as conn:
    doc_updates = [
        ("candidate_id INT", "candidate_id"),
        ("document_type VARCHAR(100)", "document_type"),
        ("file_name VARCHAR(255)", "file_name"),
        ("file_path VARCHAR(500)", "file_path"),
        ("status VARCHAR(50) DEFAULT 'Uploaded'", "status"),
        ("remarks TEXT", "remarks"),
        ("uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP", "uploaded_at")
    ]

    for sql_def, name in doc_updates:
        try:
            conn.execute(text(f"ALTER TABLE document_uploads ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")

    conn.commit()

print("\n🎉 DONE — All tables created and updated successfully!\n")
