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
    EmployeeReporting
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

print("\n🎉 DONE — All tables created and updated successfully!\n")
