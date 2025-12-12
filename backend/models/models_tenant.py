from sqlalchemy import Column, Integer, String, Boolean,Text, DateTime,Float,JSON,Date, ForeignKey, func, LargeBinary
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

    agency = Column(String(150))
    status = Column(String(50), default="Pending")
    remarks = Column(Text)
    documents = Column(Text)  # CSV
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
    university = Column(String(200))
    year = Column(String(10))

    certificate = Column(LargeBinary)   # File stored in DB
    file_name = Column(String(255))


# ========================= EXPERIENCE DETAILS =========================
class EmployeeExperience(MasterBase):
    __tablename__ = "employee_experience"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    company = Column(String(200))
    role = Column(String(150))
    from_year = Column(String(10))
    to_year = Column(String(10))

    relieving_doc = Column(LargeBinary)
    file_name = Column(String(255))


# ========================= MEDICAL DETAILS =========================
class EmployeeMedical(MasterBase):
    __tablename__ = "employee_medical"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    blood_group = Column(String(10))
    remarks = Column(Text)

    medical_certificate = Column(LargeBinary)
    certificate_name = Column(String(255))


# ========================= ID DOCUMENTS =========================
class EmployeeIDDocs(MasterBase):
    __tablename__ = "employee_id_docs"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    document_type = Column(String(100))  # Aadhaar, PAN, Passport
    file = Column(LargeBinary)
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

    certificate_file = Column(LargeBinary)
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


# ========================= DOCUMENT VAULT =========================
class EmployeeDocuments(MasterBase):
    __tablename__ = "employee_documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    doc_name = Column(String(200))
    file = Column(LargeBinary)
    file_name = Column(String(255))

    uploaded_on = Column(DateTime, default=func.now())


# ========================= EXIT DETAILS =========================
class EmployeeExit(MasterBase):
    __tablename__ = "employee_exit"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)

    resignation_date = Column(Date)
    last_working_day = Column(Date)
    notes = Column(Text)

    clearance_status = Column(String(50), default="Pending")
    # Pending / In Progress / Completed

    updated_at = Column(DateTime, default=func.now())





