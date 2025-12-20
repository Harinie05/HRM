from sqlalchemy import Column, Integer, String, Boolean,Text, DateTime,Float,JSON,Date, Time, ForeignKey, func, LargeBinary
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

MasterBase = declarative_base()

# Tenant-specific models
class Role(MasterBase):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), unique=True, nullable=False)
    description = Column(String(255))


class Permission(MasterBase):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), unique=True, nullable=False)
    description = Column(String(255))


class RolePermission(MasterBase):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"))
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"))


class Department(MasterBase):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), unique=True, nullable=False)
    description = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

class User(MasterBase):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)

    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    
    # Employee specific fields
    employee_code = Column(String(50), nullable=True, unique=True)
    employee_type = Column(String(50), nullable=True)  # Permanent/Contract/Intern
    designation = Column(String(150), nullable=True)
    joining_date = Column(Date, nullable=True)
    status = Column(String(50), default="Active")  # Active/Inactive
    leave_policy_id = Column(Integer, nullable=True)  # Assigned leave policy

    created_at = Column(DateTime, default=datetime.utcnow)

    # relationships
    role = relationship("Role")
    department = relationship("Department")

class CompanyProfile(MasterBase):
    __tablename__ = "company_profile"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    website = Column(String(255), nullable=True)
    organization_type = Column(String(100), nullable=True)
    contact_person = Column(String(100), nullable=True)
    contact_number = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)

class Branch(MasterBase):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True)
    branch_name = Column(String(200), nullable=False)
    branch_code = Column(String(50), nullable=False)
    contact_person = Column(String(200))
    contact_number = Column(String(50))
    email = Column(String(200))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(20))

# ------------------------------
# SHIFT TABLE
# ------------------------------
class Shift(MasterBase):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=func.now())

# ------------------------------
# GRADE / PAY STRUCTURE TABLE
# ------------------------------
class Grade(MasterBase):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)

    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)

    # Salary Range
    min_salary = Column(Integer, nullable=False)
    max_salary = Column(Integer, nullable=False)

    # Salary Component Split (%)
    basic_percent = Column(Float, nullable=False)
    hra_percent = Column(Float, nullable=False)
    allowance_percent = Column(Float, nullable=False)
    special_percent = Column(Float, nullable=False)

    # Compliance
    pf_applicable = Column(Boolean, default=True)
    pf_percent = Column(Float, nullable=True)
    esi_applicable = Column(Boolean, default=True)
    esi_percent = Column(Float, nullable=True)

    # Department & Roles Mapping (JSON for multiple values)
    departments = Column(JSON, nullable=True)   # list of dept names
    roles = Column(JSON, nullable=True)         # list of role names

    # Misc
    effective_from = Column(Date, nullable=False)
    status = Column(String(50), default="Active")

    created_at = Column(DateTime, default=func.now())

class Holiday(MasterBase):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    date = Column(Date, nullable=False)                   # YYYY-MM-DD
    type = Column(String(50), nullable=False)             # National/Festival/Public...
    description = Column(Text, nullable=True)

    repeat_yearly = Column(Boolean, default=True)
    status = Column(String(50), default="Active")

    created_at = Column(DateTime, default=func.now())

# ------------------------------
# HR POLICY TABLE
# ------------------------------
class HRPolicy(MasterBase):
    __tablename__ = "hr_policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    notice_days = Column(Integer, nullable=True)
    probation_period = Column(String(100), nullable=True)
    work_week = Column(String(100), default="Mon-Fri")
    holiday_pattern = Column(String(150), default="Holiday Calendar")
    document = Column(String(255), nullable=True)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=func.now())


# ------------------------------
# LEAVE POLICY TABLE
# ------------------------------
class LeavePolicy(MasterBase):
    __tablename__ = "leave_policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    annual = Column(Integer, default=0)
    sick = Column(Integer, default=0)
    casual = Column(Integer, default=0)
    # Dynamic leave allocations for future leave types
    leave_allocations = Column(JSON, nullable=True)  # {"MAT": 90, "PAT": 15, "STU": 5}
    carry_forward = Column(Boolean, default=True)
    max_carry = Column(Integer, nullable=True)
    encashment = Column(Boolean, default=False)
    rule = Column(String(100), default="Full Day")
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=func.now())


# ------------------------------
# ATTENDANCE POLICY TABLE
# ------------------------------
class AttendancePolicy(MasterBase):
    __tablename__ = "attendance_policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    checkin_start = Column(String(20))
    checkin_end = Column(String(20))
    checkout_time = Column(String(20))
    grace = Column(Integer)
    lateMax = Column(Integer)
    lateConvert = Column(String(100))
    halfHours = Column(Integer)
    fullHours = Column(Integer)
    weeklyOff = Column(String(100))
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=func.now())


# ------------------------------
# OT POLICY TABLE
# ------------------------------
class OTPolicy(MasterBase):
    __tablename__ = "ot_policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    basis = Column(String(50), default="Hourly")
    rate = Column(String(50), default="1.5x")
    minOT = Column(String(50))
    maxOT = Column(String(50))
    grades = Column(Text)                # stored as CSV "G1,G2,G3"
    autoOT = Column(Boolean, default=True)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=func.now())

# ================================================================
#  🔥 RECRUITMENT + ATS + INTERVIEW + OFFER + BGV + ONBOARDING MODELS
# ================================================================

# ------------------------------
# JOB REQUISITION (UPDATED)
# ------------------------------
class JobRequisition(MasterBase):
    __tablename__ = "job_requisition"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    department = Column(String(255))
    hiring_manager = Column(String(255))

    openings = Column(Integer, default=1)
    experience = Column(String(50))
    salary_range = Column(String(100))
    job_type = Column(String(50))
    work_mode = Column(String(100))
    location = Column(String(255))

    rounds = Column(Integer, default=1)              # Total rounds
    round_names = Column(JSON)                      # {1: "Tech", 2: "HR"}
    jd_text = Column(Text)                          # JD full text
    apply_url = Column(String(500))                 # Apply link

    skills = Column(JSON)                           # Skills list

    description = Column(Text)
    deadline = Column(Date)
    status = Column(String(50), default="Draft")
    attachment = Column(String(500))

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    public_candidates = relationship("PublicCandidate", back_populates="job")



# ------------------------------
# ATS: CANDIDATES (UPDATED)
# ------------------------------
class Candidate(MasterBase):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)

    job_id = Column(Integer, ForeignKey("job_requisition.id"))
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))

    experience = Column(Integer, default=0)
    resume_url = Column(String(500))

    stage = Column(String(100), default="New")       # Dynamic ATS stage
    current_round = Column(Integer, default=0)       # Round number
    completed_rounds = Column(JSON, default=[])      # List of completed rounds

    interview_date = Column(DateTime)
    interview_time = Column(String(20))

    score = Column(Integer, default=0)               # Resume match score

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class ATSCandidate(MasterBase):
    __tablename__ = "ats_candidates"

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, nullable=False)
    candidate_id = Column(Integer, nullable=False)

    name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    experience = Column(String(50))

    resume = Column(String(500), nullable=True)
    stage = Column(String(100), default="New")
    created_at = Column(DateTime, default=datetime.utcnow)



# ------------------------------
# ATS: STAGE HISTORY
# ------------------------------
class ApplicationStageHistory(MasterBase):
    __tablename__ = "application_stage_history"

    id = Column(Integer, primary_key=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    old_stage = Column(String(50))
    new_stage = Column(String(50))
    changed_at = Column(DateTime, default=func.now())

# ================================================================
# PUBLIC APPLY MODEL (NEW)
# Stores candidate details submitted via public apply link
# ================================================================
class PublicCandidate(MasterBase):
    __tablename__ = "public_candidates"

    id = Column(Integer, primary_key=True, index=True)

    job_id = Column(Integer, ForeignKey("job_requisition.id"))

    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)

    experience = Column(String(50), nullable=True)
    skills = Column(Text, nullable=True)

    resume_url = Column(String(500), nullable=True)

    applied_at = Column(DateTime, default=func.now())
    
    job = relationship("JobRequisition", back_populates="public_candidates")

# ------------------------------
# INTERVIEW SCHEDULE TABLE (NEW)
# ------------------------------
class InterviewSchedule(MasterBase):
    __tablename__ = "interview_schedule"

    id = Column(Integer, primary_key=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    job_id = Column(Integer, ForeignKey("job_requisition.id"))

    round_number = Column(Integer, nullable=False)
    round_name = Column(String(255), nullable=False)

    interview_date = Column(DateTime, nullable=False)
    interview_time = Column(String(20), nullable=False)

    status = Column(String(50), default="Scheduled")  # Scheduled / Completed / No-show
    email_sent = Column(Boolean, default=True)

    created_at = Column(DateTime, default=func.now())


# ------------------------------
# OFFER LETTER (UNCHANGED EXCEPT FIELD NAMES)
# ------------------------------
class OfferLetter(MasterBase):
    __tablename__ = "offer_letters"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))

    candidate_name = Column(String(150), nullable=False)
    job_title = Column(String(200), nullable=False)
    department = Column(String(100), nullable=False)

    ctc = Column(Integer, nullable=False)
    basic_percent = Column(Integer, default=40)
    hra_percent = Column(Integer, default=20)

    joining_date = Column(Date)
    probation_period = Column(String(50), default="3 Months")
    notice_period = Column(String(50), default="30 Days")

    terms = Column(Text)
    document = Column(String(255))

    offer_status = Column(String(50), default="Draft")
    token = Column(String(200))
    created_at = Column(DateTime, default=func.now())


# ------------------------------
# BGV TABLE
# ------------------------------
class BGV(MasterBase):
    __tablename__ = "bgv"

    id = Column(Integer, primary_key=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))

    verification_type = Column(String(50), default="Internal HR Team")
    agency_name = Column(String(150), nullable=True)
    status = Column(String(50), default="Pending")
    
    # BGV Verification Checkboxes
    identity_verified = Column(Boolean, default=False)
    address_verified = Column(Boolean, default=False)
    employment_verified = Column(Boolean, default=False)
    education_verified = Column(Boolean, default=False)
    criminal_verified = Column(Boolean, default=False)
    
    remarks = Column(Text)
    documents = Column(Text)  # CSV
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now())
# -------------------------------------------------------------------
# ONBOARDING TABLES
# -------------------------------------------------------------------
class OnboardingCandidate(MasterBase):
    __tablename__ = "onboarding_candidates"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, nullable=False)
    
    candidate_name = Column(String(150), nullable=False)
    job_title = Column(String(200), nullable=False)
    department = Column(String(100), nullable=False)
    joining_date = Column(Date, nullable=True)
    
    work_location = Column(String(150), nullable=True)
    reporting_manager = Column(String(150), nullable=True)
    work_shift = Column(String(50), default="General")
    probation_period = Column(String(50), default="3 Months")
    
    status = Column(String(50), default="Pending Docs")
    # Pending Docs / Docs Submitted / Ready for Joining / Completed
    
    appointment_letter = Column(Text, nullable=True)
    employee_grade = Column(String(50), nullable=True)
    employee_code = Column(String(50), nullable=True)
    employee_id = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=func.now())


# ------------------------------
# ONBOARDING DOCUMENT UPLOADS (UPDATED)
# ------------------------------
class DocumentUpload(MasterBase):
    __tablename__ = "document_uploads"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer)
    document_type = Column(String(100))
    file_name = Column(String(255))
    file_path = Column(String(500))
    status = Column(String(50), default="Uploaded")
    remarks = Column(Text)
    uploaded_at = Column(DateTime, default=func.now())

# -------------------------------------------------------------------
# EMPLOYEE INFORMATION SYSTEM (EIS) TABLES
# -------------------------------------------------------------------

# ========================= EMPLOYEE MASTER =========================
class Employee(MasterBase):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    
    employee_code = Column(String(50), unique=True)
    name = Column(String(150), nullable=False)
    gender = Column(String(20))
    dob = Column(Date)

    contact = Column(String(20))
    email = Column(String(150))

    department = Column(String(150))
    designation = Column(String(150))
    grade = Column(String(20))

    doj = Column(Date)
    status = Column(String(50), default="Active")  
    # Active / Inactive / Resigned / Terminated

    reporting_manager = Column(String(150))
    work_mode = Column(String(50))   # On-site / Remote / Hybrid
    shift = Column(String(50))       # General / Rotational

    offer_id = Column(Integer)       # Link to Offer Letter ID
    leave_policy_id = Column(Integer, nullable=True)  # Assigned leave policy

    created_at = Column(DateTime, default=func.now())

class ImportedCandidate(MasterBase):
    __tablename__ = "imported_candidates"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, nullable=False)
    job_title = Column(String(255), nullable=False)

    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    experience = Column(String(50))
    skills = Column(String(500))

    resume_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)



# ========================= FAMILY DETAILS =========================
class EmployeeFamily(MasterBase):
    __tablename__ = "employee_family"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    name = Column(String(150), nullable=False)
    relationship = Column(String(50))
    age = Column(Integer)
    contact = Column(String(20))
    dependent = Column(Boolean, default=False)


# ========================= EDUCATION DETAILS =========================
class EmployeeEducation(MasterBase):
    __tablename__ = "employee_education"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    degree = Column(String(150))
    specialization = Column(String(200))
    university = Column(String(200))
    board_university = Column(String(200))
    start_year = Column(String(10))
    end_year = Column(String(10))
    percentage_cgpa = Column(String(20))
    education_type = Column(String(50))  # Full-time, Part-time, Distance
    country = Column(String(100))
    state = Column(String(100))
    city = Column(String(100))
    
    certificate = Column(Text)   # Base64 encoded file
    file_name = Column(String(255))


# ========================= EXPERIENCE DETAILS =========================
class EmployeeExperience(MasterBase):
    __tablename__ = "employee_experience"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    company = Column(String(200))
    job_title = Column(String(150))
    department = Column(String(150))
    employment_type = Column(String(50))  # Full-time, Part-time, Contract, Internship
    start_date = Column(Date)
    end_date = Column(Date)
    current_job = Column(Boolean, default=False)
    salary = Column(String(50))
    location = Column(String(200))
    job_description = Column(Text)
    achievements = Column(Text)
    reason_for_leaving = Column(String(200))
    reporting_manager = Column(String(150))
    manager_contact = Column(String(50))
    
    relieving_doc = Column(Text)
    file_name = Column(String(255))


# ========================= MEDICAL DETAILS =========================
class EmployeeMedical(MasterBase):
    __tablename__ = "employee_medical"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    # Basic Health Information
    blood_group = Column(String(10))
    height = Column(String(10))
    weight = Column(String(10))
    
    # Medical History
    allergies = Column(Text)
    chronic_conditions = Column(Text)
    medications = Column(Text)
    
    # Emergency Contact
    emergency_contact_name = Column(String(150))
    emergency_contact_phone = Column(String(20))
    emergency_contact_relation = Column(String(50))
    
    # Insurance Information
    medical_insurance_provider = Column(String(200))
    medical_insurance_number = Column(String(100))
    
    # Additional Notes
    remarks = Column(Text)

    # Medical Certificate
    medical_certificate = Column(Text)  # File path
    certificate_name = Column(String(255))


# ========================= ID DOCUMENTS =========================
class EmployeeIDDocs(MasterBase):
    __tablename__ = "employee_id_docs"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    document_type = Column(String(100))  # Aadhaar, PAN, Passport
    file = Column(Text)
    file_name = Column(String(255))

    status = Column(String(50), default="Pending")
    # Pending / Verified / Rejected


# ========================= SKILLS =========================
class EmployeeSkills(MasterBase):
    __tablename__ = "employee_skills"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    skill_name = Column(String(150))
    rating = Column(Integer)    # 1–5 stars


# ========================= CERTIFICATIONS =========================
class EmployeeCertifications(MasterBase):
    __tablename__ = "employee_certifications"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    certification = Column(String(200))
    issued_by = Column(String(200))
    expiry_date = Column(Date)

    certificate_file = Column(Text)
    file_name = Column(String(255))


# ========================= SALARY STRUCTURE =========================
class EmployeeSalary(MasterBase):
    __tablename__ = "employee_salary"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    ctc = Column(Float)
    basic_percent = Column(Float)
    hra_percent = Column(Float)
    allowances_percent = Column(Float)
    special_percent = Column(Float)

    pf_eligible = Column(Boolean, default=True)
    esi_eligible = Column(Boolean, default=True)


# ========================= BANK DETAILS =========================
class EmployeeBankDetails(MasterBase):
    __tablename__ = "employee_bank_details"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    account_holder_name = Column(String(200))
    bank_name = Column(String(200))
    account_number = Column(String(50))
    ifsc_code = Column(String(20))
    branch_name = Column(String(200))
    account_type = Column(String(50))  # Savings/Current
    
    # Additional bank details
    swift_code = Column(String(20))
    bank_address = Column(Text)
    
    # Document
    bank_document = Column(Text)  # Base64 encoded file
    document_name = Column(String(255))
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


# ========================= DOCUMENT VAULT =========================
class EmployeeDocuments(MasterBase):
    __tablename__ = "employee_documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    doc_name = Column(String(200))
    file = Column(Text)
    file_name = Column(String(255))

    uploaded_on = Column(DateTime, default=func.now())


# ========================= EXIT DETAILS =========================
class EmployeeExit(MasterBase):
    __tablename__ = "employee_exit"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    resignation_date = Column(Date)
    last_working_day = Column(Date)
    reason = Column(String(100))
    notice_period = Column(String(10), default="30")
    exit_interview_date = Column(Date)
    
    handover_status = Column(String(50), default="Pending")
    asset_return_status = Column(String(50), default="Pending")
    final_settlement = Column(String(50), default="Pending")
    clearance_status = Column(String(50), default="Pending")
    
    notes = Column(Text)
    updated_at = Column(DateTime, default=func.now())

# ================================================================
#  🔥 ATTENDANCE & BIOMETRIC MODELS
# ================================================================

# ------------------------------
# EMPLOYEE ROSTER
# ------------------------------
class EmployeeRoster(MasterBase):
    __tablename__ = "employee_roster"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)
    shift_id = Column(Integer, nullable=False)  # References organization shifts
    date = Column(Date, nullable=False)
    status = Column(String(50), default="Scheduled")  # Scheduled/Holiday/Leave/OFF
    created_at = Column(DateTime, default=func.now())

# ------------------------------
# NIGHT SHIFT RULES
# ------------------------------
class NightShiftRule(MasterBase):
    __tablename__ = "night_shift_rules"

    id = Column(Integer, primary_key=True, index=True)
    applicable_shifts = Column(JSON, nullable=True)  # List of shift IDs
    punch_out_rule = Column(String(50), default="Same day")  # Same day/Next day
    minimum_hours = Column(Integer, default=6)
    night_ot_rate = Column(String(10), default="1.5x")  # 1.25x/1.5x/2x
    grace_minutes = Column(Integer, default=15)
    created_at = Column(DateTime, default=func.now())


# ========================= REPORTING STRUCTURE =========================
class ReportingLevel(MasterBase):
    __tablename__ = "reporting_levels"

    id = Column(Integer, primary_key=True, index=True)
    level_name = Column(String(100), nullable=False)  # CEO, Manager, Team Lead, Executive
    level_order = Column(Integer, nullable=False)  # 1=highest, 2=next level down
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())


class ReportingHierarchy(MasterBase):
    __tablename__ = "reporting_hierarchy"

    id = Column(Integer, primary_key=True, index=True)
    parent_level_id = Column(Integer, nullable=True)  # References reporting_levels.id
    child_level_id = Column(Integer, nullable=False)  # References reporting_levels.id
    department_id = Column(Integer, nullable=True)  # Optional: department-specific hierarchy
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())


# ========================= EMPLOYEE REPORTING =========================
class EmployeeReporting(MasterBase):
    __tablename__ = "employee_reporting"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)
    reporting_to_id = Column(Integer, nullable=True)  # Employee ID of manager
    alternate_supervisor_id = Column(Integer, nullable=True)  # Alternate supervisor ID
    level_id = Column(Integer, nullable=False)  # From reporting_levels
    department_id = Column(Integer, nullable=True)
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

# =====================================================
# ATTENDANCE REGULARIZATION
# =====================================================
class AttendanceRegularization(MasterBase):
    __tablename__ = "attendance_regularizations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    punch_date = Column(Date, nullable=False)
    issue_type = Column(String(50), nullable=False)  # Missed IN / Missed OUT / Wrong Punch
    reason = Column(String(500), nullable=True)
    attachment = Column(String(255), nullable=True)

    status = Column(String(50), default="Pending")  # Pending / Approved / Rejected
    created_at = Column(DateTime, server_default=func.now())


# =====================================================
# ATTENDANCE RULES (Late / Early / OT)
# =====================================================
class AttendanceRule(MasterBase):
    __tablename__ = "attendance_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), nullable=False)
    rule_type = Column(String(50), nullable=False)  # Late / Early / OT
    value = Column(Integer, nullable=False)     # Minutes / Hours

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


# =====================================================
# ATTENDANCE LOCATIONS (NO DEVICES)
# =====================================================
class AttendanceLocation(MasterBase):
    __tablename__ = "attendance_locations"

    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String(200), unique=True, nullable=False)

    grace_time = Column(Integer, default=10)   # Late grace minutes
    ot_rule = Column(String(100), nullable=True)    # e.g. OT > 30 mins
    punch_mode = Column(String(50), default="WEB_MOBILE")

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

# =====================================================
# ATTENDANCE PUNCH LOGS
# =====================================================
class AttendancePunch(MasterBase):
    __tablename__ = "attendance_punches"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    date = Column(Date, nullable=False)
    in_time = Column(Time, nullable=True)
    out_time = Column(Time, nullable=True)

    location = Column(String(500), nullable=True)
    source = Column(String(20), default="WEB")  # WEB / MOBILE
    status = Column(String(50), default="Present")  # Present / Late / Absent
    
    # GPS and device tracking
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    device_info = Column(String(200), nullable=True)

    created_at = Column(DateTime, server_default=func.now())

# =========================
# LEAVE MANAGEMENT TABLES
# =========================

# ------------------------------
# LEAVE TYPES & POLICIES
# ------------------------------
class LeaveType(MasterBase):
    __tablename__ = "leave_types"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)           # Casual Leave, Sick Leave
    code = Column(String(20), unique=True, nullable=False)  # CL, SL, EL

    category = Column(String(100))                       # General / Medical / Earned
    is_paid = Column(Boolean, default=True)

    annual_limit = Column(Integer, default=0)
    carry_forward = Column(Boolean, default=False)
    max_carry_forward = Column(Integer, nullable=True)

    attachment_required = Column(Boolean, default=False)
    auto_approve_days = Column(Integer, default=0)

    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=func.now())

# ------------------------------
# LEAVE RULES (ACCRUAL / ENCASH)
# ------------------------------
class LeaveRule(MasterBase):
    __tablename__ = "leave_rules"

    id = Column(Integer, primary_key=True, index=True)

    accrual_frequency = Column(String(50))   # Monthly / Quarterly / Yearly
    accrual_method = Column(String(50))      # Fixed / Pro-rata / Attendance based

    carry_forward_limit = Column(Integer)
    encashment_allowed = Column(Boolean, default=False)
    encashment_rate = Column(Float, nullable=True)

    auto_deduct_lop = Column(Boolean, default=True)

    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=func.now())

# ------------------------------
# LEAVE APPLICATION
# ------------------------------
class LeaveApplication(MasterBase):
    __tablename__ = "leave_applications"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    policy_id = Column(Integer, nullable=True)  # Optional policy override

    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    total_days = Column(Float, nullable=False)

    reason = Column(Text, nullable=True)
    attachment = Column(String(500), nullable=True)

    status = Column(String(50), default="Pending")  # Pending / Approved / Rejected

    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approver_comment = Column(Text, nullable=True)

    applied_at = Column(DateTime, default=func.now())
# ------------------------------
# LEAVE BALANCE
# ------------------------------
class LeaveBalance(MasterBase):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)

    total_allocated = Column(Float, default=0)
    used = Column(Float, default=0)
    balance = Column(Float, default=0)

    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
# ------------------------------
# LEAVE APPROVAL HISTORY (OPTIONAL BUT PRO)
# ------------------------------
class LeaveApprovalHistory(MasterBase):
    __tablename__ = "leave_approval_history"

    id = Column(Integer, primary_key=True, index=True)

    leave_application_id = Column(Integer, ForeignKey("leave_applications.id"))
    action = Column(String(50))   # Approved / Rejected
    action_by = Column(Integer)   # User ID
    comments = Column(Text)

    action_at = Column(DateTime, default=func.now())

# =====================================================
# SALARY STRUCTURE
# =====================================================
class SalaryStructure(MasterBase):
    __tablename__ = "salary_structures"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    ctc = Column(Float, nullable=False)

    basic_percent = Column(Float, nullable=False)
    hra_percent = Column(Float, nullable=False)

    allowances = Column(Text)   # JSON string
    deductions = Column(Text)   # JSON string

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


# =====================================================
# STATUTORY RULES
# =====================================================
class StatutoryRule(MasterBase):
    __tablename__ = "statutory_rules"

    id = Column(Integer, primary_key=True, index=True)
    
    # PF Configuration
    pf_enabled = Column(Boolean, default=True)
    pf_percent = Column(Float, default=12.0)
    pf_apply_on = Column(String(50), default="Basic")  # Basic/Gross
    
    # ESI Configuration
    esi_enabled = Column(Boolean, default=True)
    esi_threshold = Column(Float, default=21000.0)
    esi_percent = Column(Float, default=1.75)
    
    # Professional Tax
    pt_enabled = Column(Boolean, default=True)
    pt_amount = Column(Float, default=200.0)
    
    # TDS Configuration
    tds_enabled = Column(Boolean, default=True)
    tds_percent = Column(Float, default=10.0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


# =====================================================
# PAYROLL RUN
# =====================================================
class PayrollRun(MasterBase):
    __tablename__ = "payroll_runs"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(String(50), nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"))

    present_days = Column(Integer)
    lop_days = Column(Integer)
    ot_hours = Column(Float)

    gross_salary = Column(Float)
    net_salary = Column(Float)

    status = Column(String(50), default="Pending")
    created_at = Column(DateTime, server_default=func.now())


# =====================================================
# SALARY ADJUSTMENTS
# =====================================================
class PayrollAdjustment(MasterBase):
    __tablename__ = "payroll_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    month = Column(String(50))

    adjustment_type = Column(String(100))  # Bonus / Arrears / Medical
    amount = Column(Float)
    description = Column(String(255))

    created_at = Column(DateTime, server_default=func.now())

# =========================
# EMPLOYEE LIFECYCLE ACTIONS
# =========================
class EmployeeLifecycleAction(MasterBase):
    __tablename__ = "employee_lifecycle_actions"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    action_type = Column(String(50), nullable=False)
    # Promotion / Transfer / Increment

    old_department = Column(String(150), nullable=True)
    new_department = Column(String(150), nullable=True)

    old_role = Column(String(150), nullable=True)
    new_role = Column(String(150), nullable=True)

    old_ctc = Column(Float, nullable=True)
    new_ctc = Column(Float, nullable=True)

    effective_from = Column(Date, nullable=True)
    reason = Column(Text, nullable=True)

    status = Column(String(50), default="Pending")
    # Pending / Approved / Rejected / Completed

    approved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=func.now())# =========================
# HR LETTERS & COMMUNICATION
# =========================
class HRCommunication(MasterBase):
    __tablename__ = "hr_communications"

    id = Column(Integer, primary_key=True, index=True)

    letter_type = Column(String(50), nullable=False)
    # Warning / Memo / Notice / Official Letter / Announcement

    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)

    sent_to_type = Column(String(50), nullable=False)
    # Single / Multiple / All

    sent_to_ids = Column(JSON, nullable=True)
    # List of employee IDs if not ALL

    attachment = Column(String(500), nullable=True)

    status = Column(String(50), default="Sent")
    created_by = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=func.now())

# =========================
# COMPLAINTS & GRIEVANCES
# =========================
class GrievanceTicket(MasterBase):
    __tablename__ = "grievance_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_code = Column(String(50), unique=True, nullable=False)

    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    category = Column(String(100), nullable=False)
    # Harassment / Payroll / IT / Facilities / General

    description = Column(Text, nullable=False)
    attachment = Column(String(500), nullable=True)

    priority = Column(String(50), default="Medium")
    # Low / Medium / High

    status = Column(String(50), default="Open")
    # Open / In Review / Resolved / Closed

    assigned_to = Column(String(150), nullable=True)

    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=func.now())

# =========================
# ASSET MANAGEMENT
# =========================
class AssetAssignment(MasterBase):
    __tablename__ = "asset_assignments"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    asset_type = Column(String(100), nullable=False)
    # Laptop / ID Card / Phone / Keyboard etc.

    asset_name = Column(String(150), nullable=True)
    asset_id = Column(String(150), nullable=True)
    brand = Column(String(150), nullable=True)
    model = Column(String(150), nullable=True)
    serial_number = Column(String(150), nullable=True)
    condition = Column(String(50), nullable=True)
    location = Column(String(150), nullable=True)
    cost = Column(Float, nullable=True)

    issue_date = Column(Date, nullable=False)
    expected_return_date = Column(Date, nullable=True)
    actual_return_date = Column(Date, nullable=True)

    terms = Column(Text, nullable=True)

    status = Column(String(50), default="Active")
    # Active / Returned / Lost / Damaged

    created_at = Column(DateTime, default=func.now())
# =========================
# INSURANCE & BENEFITS
# =========================
class EmployeeInsurance(MasterBase):
    __tablename__ = "employee_insurance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    policy_type = Column(String(100), nullable=False)
    # Medical / Accident / Life / Mediclaim

    policy_number = Column(String(150), nullable=True)
    provider = Column(String(150), nullable=True)

    coverage_amount = Column(Float, nullable=False)

    start_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)

    status = Column(String(50), default="Active")
    # Active / Expired / Cancelled

    created_at = Column(DateTime, default=func.now())

# =====================================================
# PERFORMANCE MANAGEMENT SYSTEM (PMS)
# =====================================================

# -------------------------
# 1. GOALS & KPI / KRA
# -------------------------
class PMSGoal(MasterBase):
    __tablename__ = "pms_goals"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    title = Column(String(255), nullable=False)
    goal_type = Column(String(50))  # Category field
    target = Column(String(100))  # Target value
    current_value = Column(String(100), default="0")  # Current progress value
    measurement_method = Column(String(50), nullable=True)  # Unit field
    weightage = Column(Integer, default=0)  # Weightage field
    department = Column(String(100), nullable=True)  # Department field

    start_date = Column(Date)
    end_date = Column(Date)

    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=func.now())


# -------------------------
# 2. PERFORMANCE REVIEW CYCLE
# -------------------------
class PMSReview(MasterBase):
    __tablename__ = "pms_reviews"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"))

    cycle = Column(String(50))  # 2024-2025
    review_type = Column(String(50))  # Mid-Year / Annual

    self_score = Column(Float, nullable=True)
    manager_score = Column(Float, nullable=True)

    self_comments = Column(Text, nullable=True)
    manager_comments = Column(Text, nullable=True)

    status = Column(String(50), default="Pending")
    created_at = Column(DateTime, default=func.now())


# -------------------------
# 3. 360 DEGREE FEEDBACK
# -------------------------
class PMSFeedback(MasterBase):
    __tablename__ = "pms_feedback"

    id = Column(Integer, primary_key=True, index=True)
    from_employee_id = Column(Integer, ForeignKey("users.id"))
    to_employee_id = Column(Integer, ForeignKey("users.id"))

    relationship = Column(String(50))  # Peer / Manager / Subordinate
    cycle = Column(String(50))

    rating = Column(Float)
    comments = Column(Text)
    strengths = Column(Text)
    improvements = Column(Text)
    goals = Column(Text)

    created_at = Column(DateTime, default=func.now())


# -------------------------
# 4. APPRAISAL & PROMOTION
# -------------------------
class PMSAppraisal(MasterBase):
    __tablename__ = "pms_appraisal"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"))

    cycle = Column(String(50))
    kpi_score = Column(Float)
    feedback_score = Column(Float)
    final_rating = Column(Float)

    recommendation = Column(String(100))  # Promotion / Normal / PIP
    increment_percent = Column(Float, nullable=True)
    recommended_role = Column(String(150), nullable=True)
    
    # Additional fields for detailed appraisal
    strengths = Column(Text, nullable=True)
    improvements = Column(Text, nullable=True)
    development_plan = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)

    effective_from = Column(Date, nullable=True)
    status = Column(String(50), default="Proposed")

    created_at = Column(DateTime, default=func.now())


