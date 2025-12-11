from sqlalchemy import Column, Integer, String, Boolean,Text, DateTime,Float,JSON,Date, ForeignKey, func
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

# ------------------------------
# JOB REQUISITION TABLE
# ------------------------------
class JobRequisition(MasterBase):
    __tablename__ = "job_requisitions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    department = Column(String(150), nullable=False)
    hiring_manager = Column(String(150), nullable=False)
    openings = Column(Integer, default=1)
    experience = Column(String(50))
    salary_range = Column(String(100))

    job_type = Column(String(50))       # Full-time / Part-time / Contract
    work_mode = Column(String(50))      # On-site / Hybrid / Remote

    location = Column(String(150))

    skills = Column(Text)               # CSV: "React,Node,MySQL"
    description = Column(Text)
    deadline = Column(Date)

    attachment = Column(String(255), nullable=True)

    status = Column(String(50), default="Draft")  # Draft / Posted
    created_at = Column(DateTime, default=func.now())

# ------------------------------
# ATS MODELS
# ------------------------------

class JobApplication(MasterBase):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)

    job_id = Column(Integer, nullable=False)  # FK: JobRequisition
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=True)
    phone = Column(String(20), nullable=True)

    experience = Column(Integer, default=0)
    resume = Column(String(255), nullable=True)  # Stored file URL

    stage = Column(String(50), default="New")   # New, Screening, Shortlisted, Interview, Selected, Rejected
    applied_on = Column(DateTime, default=func.now())


class ApplicationStageHistory(MasterBase):
    __tablename__ = "application_stage_history"

    id = Column(Integer, primary_key=True)
    application_id = Column(Integer, nullable=False)
    old_stage = Column(String(50))
    new_stage = Column(String(50))
    changed_at = Column(DateTime, default=func.now())

# -------------------------------------------------------------------
# OFFER LETTER TABLE
# -------------------------------------------------------------------
class OfferLetter(MasterBase):
    __tablename__ = "offer_letters"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, nullable=False)  # FK → JobApplication

    candidate_name = Column(String(150), nullable=False)
    job_title = Column(String(200), nullable=False)
    department = Column(String(100), nullable=False)
    location = Column(String(150), nullable=True)

    ctc = Column(Integer, nullable=False)
    basic_percent = Column(Integer, default=40)
    hra_percent = Column(Integer, default=20)

    joining_date = Column(Date, nullable=True)
    probation_period = Column(String(50), default="3 Months")
    notice_period = Column(String(50), default="30 Days")

    terms = Column(Text, nullable=True)
    document = Column(String(255), nullable=True)  # PDF file

    offer_status = Column(String(50), default="Draft")  
    # Draft / Sent / Accepted / Rejected

    token = Column(String(200), nullable=True)  # For email link
    created_at = Column(DateTime, default=func.now())


# -------------------------------------------------------------------
# BGV TABLE
# -------------------------------------------------------------------
class BGV(MasterBase):
    __tablename__ = "bgv"

    id = Column(Integer, primary_key=True)
    application_id = Column(Integer, nullable=False)

    agency = Column(String(150), nullable=True)
    status = Column(String(50), default="Pending")
    # Pending / In Progress / Cleared / Failed

    remarks = Column(Text, nullable=True)
    documents = Column(Text, nullable=True)  # CSV: "aadhaar.pdf,pan.pdf"
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


class DocumentUpload(MasterBase):
    __tablename__ = "document_uploads"

    id = Column(Integer, primary_key=True, index=True)
    onboarding_id = Column(Integer, nullable=False)
    
    document_type = Column(String(100), nullable=False)
    # Aadhaar, PAN, Degree, Experience, Photo, Signature, etc.
    
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    
    status = Column(String(50), default="Uploaded")
    # Uploaded / Verified / Rejected
    
    remarks = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=func.now())




