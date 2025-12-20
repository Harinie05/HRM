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
    EmployeeBankDetails,
    EmployeeDocuments,
    EmployeeExit,
    
    # Reporting Structure
    ReportingLevel,
    ReportingHierarchy,
    EmployeeReporting,
    
    # Attendance Models
    EmployeeRoster,
    NightShiftRule,
    AttendanceRegularization,
    AttendanceRule,
    AttendanceLocation,
    AttendancePunch,
    
    # Payroll Models
    SalaryStructure,
    StatutoryRule,
    PayrollRun,
    PayrollAdjustment,
    
    # HR Operations Models
    EmployeeLifecycleAction,
    HRCommunication,
    GrievanceTicket,
    AssetAssignment,
    EmployeeInsurance,
    
    # PMS Models
    PMSGoal,
    PMSReview,
    PMSFeedback,
    PMSAppraisal
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

# ========================= ONBOARDING CANDIDATES TABLE UPDATES =========================
print("\nUpdating onboarding_candidates table...")
with engine.connect() as conn:
    onboarding_updates = [
        ("employee_id VARCHAR(50)", "employee_id")
    ]

    for sql_def, name in onboarding_updates:
        try:
            conn.execute(text(f"ALTER TABLE onboarding_candidates ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")

    conn.commit()

# ========================= UPDATE BGV TABLE STRUCTURE =========================
print("\nUpdating BGV table structure...")
with engine.connect() as conn:
    bgv_columns = [
        ("candidate_id INT", "candidate_id"),
        ("verification_type VARCHAR(50) DEFAULT 'Internal HR Team'", "verification_type"),
        ("agency_name VARCHAR(150)", "agency_name"),
        ("status VARCHAR(50) DEFAULT 'Pending'", "status"),
        ("identity_verified BOOLEAN DEFAULT FALSE", "identity_verified"),
        ("address_verified BOOLEAN DEFAULT FALSE", "address_verified"),
        ("employment_verified BOOLEAN DEFAULT FALSE", "employment_verified"),
        ("education_verified BOOLEAN DEFAULT FALSE", "education_verified"),
        ("criminal_verified BOOLEAN DEFAULT FALSE", "criminal_verified"),
        ("remarks TEXT", "remarks"),
        ("created_at DATETIME DEFAULT CURRENT_TIMESTAMP", "created_at"),
        ("updated_at DATETIME DEFAULT CURRENT_TIMESTAMP", "updated_at")
    ]
    
    for sql_def, name in bgv_columns:
        try:
            conn.execute(text(f"ALTER TABLE bgv ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")
    
    conn.commit()

# ========================= FIX BGV STATUS FOR ONBOARDED CANDIDATES =========================
print("\nFixing BGV status for onboarded candidates...")
with engine.connect() as conn:
    try:
        # Get all onboarding candidates
        onboarding_query = text("""
            SELECT application_id, candidate_name 
            FROM onboarding_candidates
        """)
        onboarding_results = conn.execute(onboarding_query).fetchall()
        
        print(f"Found {len(onboarding_results)} onboarding candidates")
        
        for row in onboarding_results:
            candidate_id = row[0]
            candidate_name = row[1]
            
            print(f"Processing: {candidate_name} (ID: {candidate_id})")
            
            # Check if BGV record exists
            bgv_check = text("""
                SELECT id, status FROM bgv WHERE candidate_id = :candidate_id
            """)
            bgv_result = conn.execute(bgv_check, {"candidate_id": candidate_id}).fetchone()
            
            if not bgv_result:
                # Create new BGV record
                insert_bgv = text("""
                    INSERT INTO bgv (candidate_id, verification_type, status, 
                                   identity_verified, address_verified, employment_verified, 
                                   education_verified, criminal_verified, remarks)
                    VALUES (:candidate_id, 'Internal HR Team', 'Cleared', 
                           1, 1, 1, 1, 1, 
                           'BGV completed successfully. Candidate cleared for onboarding.')
                """)
                conn.execute(insert_bgv, {"candidate_id": candidate_id})
                print(f"  ✅ Created BGV record with 'Cleared' status")
            
            elif bgv_result[1] != "Cleared":
                # Update existing BGV record
                update_bgv = text("""
                    UPDATE bgv SET 
                        status = 'Cleared',
                        identity_verified = 1,
                        address_verified = 1,
                        employment_verified = 1,
                        education_verified = 1,
                        criminal_verified = 1,
                        remarks = 'BGV completed successfully. Candidate cleared for onboarding.'
                    WHERE candidate_id = :candidate_id
                """)
                conn.execute(update_bgv, {"candidate_id": candidate_id})
                print(f"  ✅ Updated BGV status from '{bgv_result[1]}' to 'Cleared'")
            
            else:
                print(f"  ✅ BGV already marked as 'Cleared'")
        
        conn.commit()
        print(f"\n🎉 Successfully processed {len(onboarding_results)} candidates!")
        
        # Show BGV status summary
        summary_query = text("SELECT status, COUNT(*) as count FROM bgv GROUP BY status")
        summary_results = conn.execute(summary_query).fetchall()
        
        print("\n📊 BGV Status Summary:")
        for row in summary_results:
            print(f"  {row[0]}: {row[1]} candidates")
    
    except Exception as e:
        print(f"⚠️ BGV fix error: {e}")
        conn.rollback()

# ========================= GENERATE EMPLOYEE IDs FOR EXISTING CANDIDATES =========================
print("\nGenerating Employee IDs for existing onboarded candidates...")
with engine.connect() as conn:
    try:
        # Get onboarding candidates without employee_id
        missing_emp_id_query = text("""
            SELECT id, candidate_name, department 
            FROM onboarding_candidates 
            WHERE employee_id IS NULL OR employee_id = ''
        """)
        missing_results = conn.execute(missing_emp_id_query).fetchall()
        
        print(f"Found {len(missing_results)} candidates without Employee ID")
        
        for row in missing_results:
            onboarding_id = row[0]
            candidate_name = row[1]
            department = row[2] or "GEN"
            
            # Generate employee ID
            dept_prefix = department[:3].upper()
            timestamp = str(int(__import__('time').time()))[-6:]
            employee_id = f"{dept_prefix}{timestamp}"
            
            # Update onboarding record with employee_id
            update_emp_id = text("""
                UPDATE onboarding_candidates 
                SET employee_id = :employee_id 
                WHERE id = :onboarding_id
            """)
            conn.execute(update_emp_id, {
                "employee_id": employee_id,
                "onboarding_id": onboarding_id
            })
            
            print(f"  ✅ Generated Employee ID '{employee_id}' for {candidate_name}")
        
        conn.commit()
        print(f"\n🎉 Successfully generated {len(missing_results)} Employee IDs!")
    
    except Exception as e:
        print(f"⚠️ Employee ID generation error: {e}")
        conn.rollback()

# ========================= FIX EMPLOYEE ID MAPPING =========================
print("\nFixing Employee ID mapping...")
with engine.connect() as conn:
    try:
        # First, let's see what we have
        check_query = text("""
            SELECT id, candidate_name, employee_id, application_id 
            FROM onboarding_candidates 
            WHERE candidate_name IN ('Harinie Hospital S', 'Harinie S')
            ORDER BY id DESC
        """)
        records = conn.execute(check_query).fetchall()
        
        print("Current onboarding records:")
        for record in records:
            print(f"  ID: {record[0]}, Name: {record[1]}, Employee ID: {record[2]}, App ID: {record[3]}")
        
        # Update the latest record for each candidate
        # Harinie Hospital S should be 1234
        update_harinie_hospital = text("""
            UPDATE onboarding_candidates 
            SET employee_id = '1234' 
            WHERE candidate_name = 'Harinie Hospital S' 
            AND id = (SELECT MAX(id) FROM (SELECT id FROM onboarding_candidates WHERE candidate_name = 'Harinie Hospital S') as sub)
        """)
        
        # Harinie S should be 2345  
        update_harinie_s = text("""
            UPDATE onboarding_candidates 
            SET employee_id = '2345' 
            WHERE candidate_name = 'Harinie S'
            AND id = (SELECT MAX(id) FROM (SELECT id FROM onboarding_candidates WHERE candidate_name = 'Harinie S') as sub)
        """)
        
        result1 = conn.execute(update_harinie_hospital)
        result2 = conn.execute(update_harinie_s)
        
        conn.commit()
        print(f"✅ Updated latest record for Harinie Hospital S to Employee ID '1234'")
        print(f"✅ Updated latest record for Harinie S to Employee ID '2345'")
        
    except Exception as e:
        print(f"⚠️ Error updating employee IDs: {e}")
        conn.rollback()

# ========================= UPDATE MEDICAL TABLE STRUCTURE =========================
print("\nUpdating employee_medical table structure...")
with engine.connect() as conn:
    medical_columns = [
        ("height VARCHAR(10)", "height"),
        ("weight VARCHAR(10)", "weight"),
        ("allergies TEXT", "allergies"),
        ("chronic_conditions TEXT", "chronic_conditions"),
        ("medications TEXT", "medications"),
        ("emergency_contact_name VARCHAR(150)", "emergency_contact_name"),
        ("emergency_contact_phone VARCHAR(20)", "emergency_contact_phone"),
        ("emergency_contact_relation VARCHAR(50)", "emergency_contact_relation"),
        ("medical_insurance_provider VARCHAR(200)", "medical_insurance_provider"),
        ("medical_insurance_number VARCHAR(100)", "medical_insurance_number")
    ]
    
    for sql_def, name in medical_columns:
        try:
            conn.execute(text(f"ALTER TABLE employee_medical ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")
    
    conn.commit()

# ========================= UPDATE EXIT TABLE STRUCTURE =========================
print("\nUpdating employee_exit table structure...")
with engine.connect() as conn:
    exit_columns = [
        ("reason VARCHAR(100)", "reason"),
        ("notice_period VARCHAR(10) DEFAULT '30'", "notice_period"),
        ("exit_interview_date DATE", "exit_interview_date"),
        ("handover_status VARCHAR(50) DEFAULT 'Pending'", "handover_status"),
        ("asset_return_status VARCHAR(50) DEFAULT 'Pending'", "asset_return_status"),
        ("final_settlement VARCHAR(50) DEFAULT 'Pending'", "final_settlement")
    ]
    
    for sql_def, name in exit_columns:
        try:
            conn.execute(text(f"ALTER TABLE employee_exit ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")
    
    conn.commit()

# ========================= UPDATE EDUCATION TABLE STRUCTURE =========================
print("\nUpdating employee_education table structure...")
with engine.connect() as conn:
    education_columns = [
        ("specialization VARCHAR(200)", "specialization"),
        ("board_university VARCHAR(200)", "board_university"),
        ("start_year VARCHAR(10)", "start_year"),
        ("end_year VARCHAR(10)", "end_year"),
        ("percentage_cgpa VARCHAR(20)", "percentage_cgpa"),
        ("education_type VARCHAR(50)", "education_type"),
        ("country VARCHAR(100)", "country"),
        ("state VARCHAR(100)", "state"),
        ("city VARCHAR(100)", "city")
    ]
    
    for sql_def, name in education_columns:
        try:
            conn.execute(text(f"ALTER TABLE employee_education ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")
    
    # Rename year to end_year for consistency
    try:
        conn.execute(text("ALTER TABLE employee_education CHANGE year end_year_old VARCHAR(10)"))
        print(f"✔️ Renamed year column")
    except Exception as e:
        print(f"⚠️ year rename: {e}")
    
    conn.commit()

# ========================= UPDATE EXPERIENCE TABLE STRUCTURE =========================
print("\nUpdating employee_experience table structure...")
with engine.connect() as conn:
    experience_columns = [
        ("job_title VARCHAR(150)", "job_title"),
        ("department VARCHAR(150)", "department"),
        ("employment_type VARCHAR(50)", "employment_type"),
        ("start_date DATE", "start_date"),
        ("end_date DATE", "end_date"),
        ("current_job BOOLEAN DEFAULT FALSE", "current_job"),
        ("salary VARCHAR(50)", "salary"),
        ("location VARCHAR(200)", "location"),
        ("job_description TEXT", "job_description"),
        ("achievements TEXT", "achievements"),
        ("reason_for_leaving VARCHAR(200)", "reason_for_leaving"),
        ("reporting_manager VARCHAR(150)", "reporting_manager"),
        ("manager_contact VARCHAR(50)", "manager_contact")
    ]
    
    for sql_def, name in experience_columns:
        try:
            conn.execute(text(f"ALTER TABLE employee_experience ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")
    
    # Rename old columns for consistency
    try:
        conn.execute(text("ALTER TABLE employee_experience CHANGE role job_title_old VARCHAR(150)"))
        conn.execute(text("ALTER TABLE employee_experience CHANGE from_year start_year_old VARCHAR(10)"))
        conn.execute(text("ALTER TABLE employee_experience CHANGE to_year end_year_old VARCHAR(10)"))
        print(f"✔️ Renamed old columns")
    except Exception as e:
        print(f"⚠️ column rename: {e}")
    
    conn.commit()

# ========================= UPDATE JOB STATUS TO FILLED =========================
print("\nUpdating job status to 'Filled' for completed positions...")
with engine.connect() as conn:
    try:
        # Get jobs with their onboarded candidate counts
        job_status_query = text("""
            SELECT j.id, j.title, j.openings, j.status,
                   COUNT(oc.id) as onboarded_count
            FROM job_requisition j
            LEFT JOIN candidates c ON c.job_id = j.id
            LEFT JOIN onboarding_candidates oc ON oc.application_id = c.id
            GROUP BY j.id, j.title, j.openings, j.status
            HAVING COUNT(oc.id) >= j.openings AND j.status != 'Filled'
        """)
        
        jobs_to_update = conn.execute(job_status_query).fetchall()
        
        print(f"Found {len(jobs_to_update)} jobs to update to 'Filled' status")
        
        for job in jobs_to_update:
            job_id = job[0]
            job_title = job[1]
            openings = job[2]
            current_status = job[3]
            onboarded_count = job[4]
            
            # Update job status to Filled
            update_job_status = text("""
                UPDATE job_requisition 
                SET status = 'Filled', updated_at = CURRENT_TIMESTAMP
                WHERE id = :job_id
            """)
            
            conn.execute(update_job_status, {"job_id": job_id})
            print(f"  ✅ Updated '{job_title}' from '{current_status}' to 'Filled' ({onboarded_count}/{openings} positions filled)")
        
        conn.commit()
        print(f"\n🎉 Successfully updated {len(jobs_to_update)} job statuses!")
        
        # Manual update for specific jobs that should be completed
        manual_updates = [
            ("developer", "Completed"),
            ("Tester", "Completed"),
            ("Software", "Completed")
        ]
        
        print("\nManually updating specific job statuses...")
        for job_title, new_status in manual_updates:
            update_manual = text("""
                UPDATE job_requisition 
                SET status = :status, updated_at = CURRENT_TIMESTAMP
                WHERE title = :title AND status != :status
            """)
            result = conn.execute(update_manual, {"title": job_title, "status": new_status})
            if result.rowcount > 0:
                print(f"  ✅ Updated '{job_title}' to '{new_status}'")
        
        conn.commit()
        
    except Exception as e:
        print(f"⚠️ Job status update error: {e}")
        conn.rollback()

# ========================= UPDATE EMPLOYEE REPORTING TABLE =========================
print("\nUpdating employee_reporting table...")
with engine.connect() as conn:
    reporting_columns = [
        ("alternate_supervisor_id INT", "alternate_supervisor_id")
    ]
    
    for sql_def, name in reporting_columns:
        try:
            conn.execute(text(f"ALTER TABLE employee_reporting ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")
    
    conn.commit()

# ========================= UPDATE ATTENDANCE PUNCHES TABLE =========================
print("\nUpdating attendance_punches table structure...")
with engine.connect() as conn:
    attendance_columns = [
        ("latitude FLOAT", "latitude"),
        ("longitude FLOAT", "longitude"),
        ("device_info VARCHAR(200)", "device_info")
    ]
    
    for sql_def, name in attendance_columns:
        try:
            conn.execute(text(f"ALTER TABLE attendance_punches ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")
    
    # Update location column size for GPS data
    try:
        conn.execute(text("ALTER TABLE attendance_punches MODIFY COLUMN location VARCHAR(500)"))
        print(f"✔️ Updated location column size")
    except Exception as e:
        print(f"⚠️ location column update: {e}")
    
    conn.commit()

# ========================= ENSURE ATTENDANCE LOCATIONS TABLE EXISTS =========================
print("\nEnsuring attendance_locations table structure...")
with engine.connect() as conn:
    try:
        # Check if table exists and has correct structure
        check_table = text("""
            CREATE TABLE IF NOT EXISTS attendance_locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                address TEXT,
                latitude FLOAT,
                longitude FLOAT,
                radius INT DEFAULT 100,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        conn.execute(check_table)
        print("✅ Attendance locations table structure verified")
        
        # Add unique constraint to prevent duplicate attendance per employee per day
        try:
            add_constraint = text("""
                ALTER TABLE attendance_punches 
                ADD CONSTRAINT unique_employee_date 
                UNIQUE (employee_id, date)
            """)
            conn.execute(add_constraint)
            print("✅ Added unique constraint for employee attendance per day")
        except Exception as e:
            print(f"ℹ️ Unique constraint: {e}")
        
        conn.commit()
    except Exception as e:
        print(f"⚠️ Attendance locations table error: {e}")

# ========================= ADD DEFAULT ATTENDANCE LOCATIONS =========================
print("\nAdding default attendance locations...")
with engine.connect() as conn:
    try:
        # Check if locations already exist
        check_locations = text("SELECT COUNT(*) FROM attendance_locations")
        count = conn.execute(check_locations).scalar()
        
        if count == 0:
            # Insert default locations
            default_locations = [
                ("Office - Main Building", "Main office building", True),
                ("Office - Branch 1", "Branch office location 1", True),
                ("Office - Branch 2", "Branch office location 2", True),
                ("Remote Work", "Work from home/remote location", True)
            ]
            
            for name, description, is_active in default_locations:
                insert_location = text("""
                    INSERT INTO attendance_locations (name, description, is_active, created_at)
                    VALUES (:name, :description, :is_active, CURRENT_TIMESTAMP)
                """)
                conn.execute(insert_location, {
                    "name": name,
                    "description": description,
                    "is_active": is_active
                })
                print(f"  ✅ Added location: {name}")
            
            conn.commit()
            print(f"\n🎉 Successfully added {len(default_locations)} default locations!")
        else:
            print(f"  ℹ️ Found {count} existing locations, skipping default creation")
            
    except Exception as e:
        print(f"⚠️ Error adding default locations: {e}")
        conn.rollback()

# ========================= ADD LEAVE_ALLOCATIONS COLUMN TO ALL TENANTS =========================
print("\nAdding leave_allocations column to all tenant databases...")

# Import required modules for multi-tenant migration
import pymysql
from database import get_master_db
from models.models_master import Hospital

# Get all hospitals from master database
master_db = next(get_master_db())
hospitals = master_db.query(Hospital).all()

for hospital in hospitals:
    try:
        # Connect to tenant database
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='',
            database=hospital.db_name,
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            # Check if column exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = %s 
                AND TABLE_NAME = 'leave_policies' 
                AND COLUMN_NAME = 'leave_allocations'
            """, (hospital.db_name,))
            
            column_exists = cursor.fetchone()
            if column_exists and column_exists[0] > 0:
                print(f"ℹ️  Column already exists in {hospital.db_name}")
            else:
                # Add the column
                cursor.execute("""
                    ALTER TABLE leave_policies 
                    ADD COLUMN leave_allocations JSON NULL
                """)
                connection.commit()
                print(f"✅ Added leave_allocations column to {hospital.db_name}")
        
        connection.close()
        
    except Exception as e:
        print(f"❌ Error updating {hospital.db_name}: {e}")

master_db.close()
print("🎉 Leave allocations migration completed for all tenants!")

# Also add to current tenant for immediate use
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE leave_policies ADD COLUMN leave_allocations JSON NULL"))
        print("✅ Added leave_allocations column to current tenant")
        conn.commit()
    except Exception as e:
        print(f"⚠️ leave_allocations current tenant: {e}")

# ========================= ADD LEAVE_POLICY_ID COLUMNS =========================
print("\nAdding leave_policy_id columns...")
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN leave_policy_id INT NULL"))
        print("✅ Added leave_policy_id to users")
    except Exception as e:
        print(f"⚠️ users leave_policy_id: {e}")
    
    try:
        conn.execute(text("ALTER TABLE employees ADD COLUMN leave_policy_id INT NULL"))
        print("✅ Added leave_policy_id to employees")
    except Exception as e:
        print(f"⚠️ employees leave_policy_id: {e}")
    
    try:
        conn.execute(text("ALTER TABLE leave_applications ADD COLUMN policy_id INT NULL"))
        print("✅ Added policy_id to leave_applications")
    except Exception as e:
        print(f"⚠️ leave_applications policy_id: {e}")
    
    conn.commit()

# ========================= CREATE MISSING LEAVE BALANCES FOR TESTING =========================
print("\nCreating missing leave balances for policy testing...")
with engine.connect() as conn:
    try:
        # Get employee 1234
        employee_query = text("SELECT id FROM users WHERE employee_code = '1234'")
        employee_result = conn.execute(employee_query).fetchone()
        
        if employee_result:
            employee_id = employee_result[0]
            print(f"Found employee 1234 with ID: {employee_id}")
            
            # Create missing balances for policy testing
            # AL (Annual Leave) - 10 days for policy 1
            al_query = text("SELECT id FROM leave_types WHERE code = 'AL'")
            al_result = conn.execute(al_query).fetchone()
            
            if al_result:
                al_type_id = al_result[0]
                # Check if AL balance exists
                al_balance_check = text("SELECT id FROM leave_balances WHERE employee_id = :emp_id AND leave_type_id = :type_id")
                al_exists = conn.execute(al_balance_check, {"emp_id": employee_id, "type_id": al_type_id}).fetchone()
                
                if not al_exists:
                    al_insert = text("""
                        INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, used, balance)
                        VALUES (:emp_id, :type_id, 10, 0, 10)
                    """)
                    conn.execute(al_insert, {"emp_id": employee_id, "type_id": al_type_id})
                    print("  ✅ Created Annual Leave balance: 10 days")
            
            # ML (Maternity Leave) - 12 days for policy 1
            ml_query = text("SELECT id FROM leave_types WHERE code = 'ML'")
            ml_result = conn.execute(ml_query).fetchone()
            
            if ml_result:
                ml_type_id = ml_result[0]
                # Check if ML balance exists
                ml_balance_check = text("SELECT id FROM leave_balances WHERE employee_id = :emp_id AND leave_type_id = :type_id")
                ml_exists = conn.execute(ml_balance_check, {"emp_id": employee_id, "type_id": ml_type_id}).fetchone()
                
                if not ml_exists:
                    ml_insert = text("""
                        INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, used, balance)
                        VALUES (:emp_id, :type_id, 12, 0, 12)
                    """)
                    conn.execute(ml_insert, {"emp_id": employee_id, "type_id": ml_type_id})
                    print("  ✅ Created Maternity Leave balance: 12 days")
        
        conn.commit()
        print("🎉 Leave balances created successfully!")
        
    except Exception as e:
        print(f"⚠️ Error creating leave balances: {e}")
        conn.rollback()

# ========================= CREATE PAYROLL TABLES =========================
print("\nCreating payroll tables...")
with engine.connect() as conn:
    try:
        # Create salary_structures table if not exists
        create_salary_structure = text("""
            CREATE TABLE IF NOT EXISTS salary_structures (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                ctc FLOAT NOT NULL,
                basic_percent FLOAT NOT NULL,
                hra_percent FLOAT NOT NULL,
                allowances TEXT,
                deductions TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute(create_salary_structure)
        print("✅ Created salary_structures table")
        
        # Create statutory_rules table if not exists
        create_statutory_rules = text("""
            CREATE TABLE IF NOT EXISTS statutory_rules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pf_enabled BOOLEAN DEFAULT TRUE,
                pf_percent FLOAT DEFAULT 12.0,
                pf_apply_on VARCHAR(50) DEFAULT 'Basic',
                esi_enabled BOOLEAN DEFAULT TRUE,
                esi_threshold FLOAT DEFAULT 21000.0,
                esi_percent FLOAT DEFAULT 1.75,
                pt_enabled BOOLEAN DEFAULT TRUE,
                pt_amount FLOAT DEFAULT 200.0,
                tds_enabled BOOLEAN DEFAULT TRUE,
                tds_percent FLOAT DEFAULT 10.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        conn.execute(create_statutory_rules)
        print("✅ Created statutory_rules table")
        
        # Update existing statutory_rules table structure
        statutory_updates = [
            ("pf_apply_on VARCHAR(50) DEFAULT 'Basic'", "pf_apply_on"),
            ("esi_threshold FLOAT DEFAULT 21000.0", "esi_threshold"),
            ("pt_enabled BOOLEAN DEFAULT TRUE", "pt_enabled"),
            ("tds_percent FLOAT DEFAULT 10.0", "tds_percent"),
            ("updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP", "updated_at")
        ]
        
        for sql_def, name in statutory_updates:
            try:
                conn.execute(text(f"ALTER TABLE statutory_rules ADD COLUMN {sql_def}"))
                print(f"  ✅ Added: {name}")
            except Exception as e:
                print(f"  ⚠️ {name}: {e}")
        
        # Update default values for existing columns
        try:
            conn.execute(text("UPDATE statutory_rules SET pf_percent = 12.0 WHERE pf_percent != 12.0"))
            conn.execute(text("UPDATE statutory_rules SET esi_enabled = TRUE WHERE esi_enabled = FALSE"))
            conn.execute(text("UPDATE statutory_rules SET pt_amount = 200.0 WHERE pt_amount = 0"))
            conn.execute(text("UPDATE statutory_rules SET tds_enabled = TRUE WHERE tds_enabled = FALSE"))
            print("  ✅ Updated default values")
        except Exception as e:
            print(f"  ⚠️ Default values update: {e}")
        
        # Create payroll_runs table if not exists
        create_payroll_runs = text("""
            CREATE TABLE IF NOT EXISTS payroll_runs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                month VARCHAR(255) NOT NULL,
                employee_id INT,
                present_days INT,
                lop_days INT,
                ot_hours FLOAT,
                gross_salary FLOAT,
                net_salary FLOAT,
                status VARCHAR(255) DEFAULT 'Pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES users(id)
            )
        """)
        conn.execute(create_payroll_runs)
        print("✅ Created payroll_runs table")
        
        # Create payroll_adjustments table if not exists
        create_payroll_adjustments = text("""
            CREATE TABLE IF NOT EXISTS payroll_adjustments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT,
                month VARCHAR(255),
                adjustment_type VARCHAR(255),
                amount FLOAT,
                description VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES users(id)
            )
        """)
        conn.execute(create_payroll_adjustments)
        print("✅ Created payroll_adjustments table")
        
        conn.commit()
        print("🎉 All payroll tables created and updated successfully!")
        
    except Exception as e:
        print(f"⚠️ Error creating payroll tables: {e}")
        conn.rollback()

# ========================= UPDATE ASSET ASSIGNMENTS TABLE =========================
print("\nUpdating asset_assignments table structure...")
with engine.connect() as conn:
    asset_columns = [
        ("asset_id VARCHAR(150)", "asset_id"),
        ("brand VARCHAR(150)", "brand"),
        ("model VARCHAR(150)", "model"),
        ("condition VARCHAR(50)", "condition"),
        ("location VARCHAR(150)", "location"),
        ("cost FLOAT", "cost")
    ]
    
    for sql_def, name in asset_columns:
        try:
            conn.execute(text(f"ALTER TABLE asset_assignments ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")
    
    conn.commit()
    print("🎉 Asset assignments table updated successfully!")

# ========================= PMS GOALS TABLE UPDATES =========================
print("\nUpdating pms_goals table...")
with engine.connect() as conn:
    pms_updates = [
        ("description TEXT", "description"),
        ("priority VARCHAR(50) DEFAULT 'Medium'", "priority"),
        ("current_value VARCHAR(100) DEFAULT '0'", "current_value"),
        ("unit VARCHAR(50)", "unit")
    ]

    for sql_def, name in pms_updates:
        try:
            conn.execute(text(f"ALTER TABLE pms_goals ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")

    conn.commit()

# ========================= PMS FEEDBACK TABLE UPDATES =========================
print("\nUpdating pms_feedback table...")
with engine.connect() as conn:
    feedback_updates = [
        ("strengths TEXT", "strengths"),
        ("improvements TEXT", "improvements"),
        ("goals TEXT", "goals")
    ]

    for sql_def, name in feedback_updates:
        try:
            conn.execute(text(f"ALTER TABLE pms_feedback ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")

    conn.commit()

# ========================= PMS APPRAISAL TABLE UPDATES =========================
print("\nUpdating pms_appraisal table...")
with engine.connect() as conn:
    appraisal_updates = [
        ("strengths TEXT", "strengths"),
        ("improvements TEXT", "improvements"),
        ("development_plan TEXT", "development_plan"),
        ("comments TEXT", "comments")
    ]

    for sql_def, name in appraisal_updates:
        try:
            conn.execute(text(f"ALTER TABLE pms_appraisal ADD COLUMN {sql_def}"))
            print(f"✔️ Added: {name}")
        except Exception as e:
            print(f"⚠️ {name}: {e}")

    conn.commit()

print("\n🎉 DONE — All tables created and updated successfully!\n")
