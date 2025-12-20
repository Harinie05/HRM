from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any, Union
from schemas.schemas_master import AdminAuth
from datetime import date, datetime,time

# ---------------------------
# TENANT: DEPARTMENTS
# ---------------------------
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentOut(DepartmentBase):
    id: int

    class Config:
        from_attributes = True


# ---------------------------
# TENANT: PERMISSIONS
# ---------------------------
class PermissionBase(BaseModel):
    name: str
    description: Optional[str] = None


class PermissionOut(PermissionBase):
    id: int

    class Config:
        from_attributes = True


# ---------------------------
# TENANT: ROLES
# ---------------------------
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permission_ids: List[int] = []


class RoleOut(RoleBase):
    id: int
    permissions: List[PermissionOut] = []

    class Config:
        from_attributes = True


# ---------------------------
# TENANT: DYNAMIC TABLES
# ---------------------------
class ColumnDef(BaseModel):
    name: str
    type: str
    primary_key: bool = False
    auto_increment: bool = False
    nullable: bool = True
    default: Optional[Any] = None

class AddColumnPayload(BaseModel):
    admin: AdminAuth
    column: ColumnDef


class CreateTablePayload(BaseModel):
    admin: AdminAuth
    table_name: str
    columns: List[ColumnDef]


class InsertRowPayload(BaseModel):
    admin: AdminAuth
    row: Dict[str, Any]


class RowOut(BaseModel):
    rows: List[Dict[str, Any]]

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: int
    department_id: int


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    department: str
    created_at: str

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role_id: Optional[int] = None
    department_id: Optional[int] = None

class CompanyProfileBase(BaseModel):
    name: str
    website: str | None = None
    organization_type: str | None = None
    contact_person: str | None = None
    contact_number: str | None = None
    contact_email: str | None = None
    address: str | None = None


class CompanyProfileCreate(CompanyProfileBase):
    pass


class CompanyProfileResponse(CompanyProfileBase):
    id: int

    class Config:
        from_attributes = True

class BranchBase(BaseModel):
    branch_name: str
    branch_code: str
    contact_person: str | None = None
    contact_number: str | None = None
    email: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None

class BranchResponse(BranchBase):
    id: int

    model_config = {"from_attributes": True}

# ------------------------------
# SHIFT SCHEMAS
# ------------------------------
class ShiftBase(BaseModel):
    name: str
    start_time: str
    end_time: str


class ShiftCreate(ShiftBase):
    pass


class ShiftResponse(ShiftBase):
    id: int

# ------------------------------
# Base shared fields
# ------------------------------
class GradeBase(BaseModel):
    code: str = Field(..., min_length=1)
    name: str
    description: Optional[str] = None

    # salary
    min_salary: int
    max_salary: int

    basic_percent: float
    hra_percent: float
    allowance_percent: float
    special_percent: float

    # compliance
    pf_applicable: bool
    pf_percent: Optional[float] = None

    esi_applicable: bool
    esi_percent: Optional[float] = None

    # mapping
    departments: Optional[List[str]] = None
    roles: Optional[List[str]] = None

    effective_from: date
    status: str = "Active"


# ------------------------------
# Create Schema
# ------------------------------
class GradeCreate(GradeBase):
    pass


# ------------------------------
# Response Schema
# ------------------------------
class GradeOut(GradeBase):
    id: int

    class Config:
        from_attributes = True


# ------------------------------
# Update Schema (optional)
# ------------------------------
class GradeUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]

    min_salary: Optional[int]
    max_salary: Optional[int]

    basic_percent: Optional[float]
    hra_percent: Optional[float]
    allowance_percent: Optional[float]
    special_percent: Optional[float]

    pf_applicable: Optional[bool]
    pf_percent: Optional[float]
    esi_applicable: Optional[bool]
    esi_percent: Optional[float]

    departments: Optional[List[str]]
    roles: Optional[List[str]]

    effective_from: Optional[date]
    status: Optional[str]

class HolidayBase(BaseModel):
    name: str = Field(..., min_length=2)
    date: date
    type: str
    description: Optional[str] = None
    repeat_yearly: bool = True
    status: str = "Active"


# ---------- Create ----------
class HolidayCreate(HolidayBase):
    pass

# ---------------- HR Policy Schema ----------------
class HRPolicyBase(BaseModel):
    name: str
    description: Optional[str]
    notice_days: Optional[int]
    probation_period: Optional[str]
    work_week: Optional[str]
    holiday_pattern: Optional[str]
    status: str

class HRPolicyCreate(HRPolicyBase):
    pass

class HRPolicyOut(HRPolicyBase):
    id: int
    document: Optional[str]
    document_download_url: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


# ---------------- Leave Policy Schema ----------------
class LeavePolicyBase(BaseModel):
    name: str
    annual: int
    sick: int
    casual: int
    carry_forward: bool
    max_carry: Optional[int]
    encashment: bool
    rule: str
    status: str

class LeavePolicyCreate(LeavePolicyBase):
    leave_allocations: Optional[dict] = None

class LeavePolicyOut(LeavePolicyBase):
    id: int
    leave_allocations: Optional[dict] = None
    class Config: from_attributes = True


# ---------------- Attendance Policy Schema ----------------
class AttendancePolicyBase(BaseModel):
    name: str
    checkin_start: str
    checkin_end: str
    checkout_time: str
    grace: int
    lateMax: int
    lateConvert: str
    halfHours: int
    fullHours: int
    weeklyOff: str
    status: str

class AttendancePolicyCreate(AttendancePolicyBase):
    pass

class AttendancePolicyOut(AttendancePolicyBase):
    id: int
    class Config: from_attributes = True


# ---------------- OT Policy Schema ----------------
class OTPolicyBase(BaseModel):
    name: str
    basis: str
    rate: str
    minOT: str
    maxOT: str
    grades: List[str]       # UI sends array → backend will convert to text
    autoOT: bool
    status: str

class OTPolicyCreate(OTPolicyBase):
    pass

class OTPolicyOut(OTPolicyBase):
    id: int
    class Config: from_attributes = True

# ---------- Output ----------
class HolidayOut(HolidayBase):
    id: int

# ================================================================
#                      JOB REQUISITION SCHEMAS
# ================================================================
class JobReqBase(BaseModel):
    title: str
    department: Optional[str] = None
    hiring_manager: Optional[str] = None

    openings: int = 1
    experience: Optional[str] = None
    salary_range: Optional[str] = None

    job_type: Optional[str] = None
    work_mode: Optional[str] = None
    location: Optional[str] = None

    # 🔥 NEW FIELDS
    rounds: int = 1                                     # Total rounds
    round_names: Optional[Union[Dict[int, str], List[Dict[str, str]]]] = None  # Support both formats
    jd_text: Optional[str] = None                       # Full JD text
    skills: Optional[List[str]] = []                    # Skill tags

    description: Optional[str] = None
    deadline: Optional[date] = None
    status: str = "Draft"                               # Draft / Posted


class JobReqCreate(JobReqBase):
    """Used for creating job requisition"""
    pass


class JobReqUpdate(BaseModel):
    """Used when editing an existing job"""
    title: Optional[str]
    department: Optional[str]
    hiring_manager: Optional[str]

    openings: Optional[int]
    experience: Optional[str]
    salary_range: Optional[str]

    job_type: Optional[str]
    work_mode: Optional[str]
    location: Optional[str]

    rounds: Optional[int]
    round_names: Optional[Union[Dict[int, str], List[Dict[str, str]]]]
    jd_text: Optional[str]
    skills: Optional[List[str]]

    description: Optional[str]
    deadline: Optional[date]
    status: Optional[str]


class JobReqOut(JobReqBase):
    """Used when job details are returned to UI"""
    id: int
    apply_url: Optional[str] = None
    attachment: Optional[str] = None
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ================================================================
#                JOB APPLICATION (Candidate) SCHEMAS
# ================================================================
class ApplicationCreate(BaseModel):
    job_id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    experience: Optional[int] = 0


class StageUpdate(BaseModel):
    stage: str


class CandidateUpdate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    experience: Optional[int] = 0


class ApplicationOut(BaseModel):
    id: int
    name: str
    experience: int
    stage: str
    resume: Optional[str]

    class Config:
        orm_mode = True


class CandidateProfileOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    experience: int
    resume: Optional[str]
    stage: str
    applied_on: datetime           # ← FIXED

    class Config:
        orm_mode = True
# ================================================================
#                        ONBOARDING SCHEMAS (UPDATED)
# ================================================================
class OnboardingBase(BaseModel):
    candidate_id: int

    candidate_name: str
    job_title: str
    department: str

    joining_date: Optional[date]
    work_location: Optional[str]
    reporting_manager: Optional[str]
    work_shift: Optional[str] = "General"
    probation_period: Optional[str] = "3 Months"

    status: Optional[str] = "Pending Docs"


class OnboardingCreate(BaseModel):
    """Used during initial onboarding creation"""
    job_title: str
    department: str
    joining_date: Optional[date] = None
    work_location: Optional[str] = None
    reporting_manager: Optional[str] = None
    work_shift: Optional[str] = "General"
    probation_period: Optional[str] = "3 Months"
    employee_id: Optional[str] = None





class OnboardingResponse(BaseModel):
    id: int
    application_id: int
    candidate_name: str
    job_title: str
    department: str
    joining_date: Optional[date]
    work_location: Optional[str]
    reporting_manager: Optional[str]
    work_shift: Optional[str]
    probation_period: Optional[str]
    status: Optional[str]
    appointment_letter: Optional[str]
    employee_grade: Optional[str]
    employee_code: Optional[str]
    employee_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ================================================================
#                     DOCUMENT VIEWER SCHEMAS
# ================================================================

class DocumentUploadBase(BaseModel):
    candidate_id: int
    document_type: str
    file_name: str
    file_path: str


class DocumentUploadCreate(DocumentUploadBase):
    pass


class DocumentUploadResponse(DocumentUploadBase):
    id: int
    status: str
    remarks: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True

# ================================================================
#                          ATS SCHEMAS
# ================================================================


class CandidateResponse(BaseModel):
    id: int
    job_id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    experience: int
    resume_url: Optional[str]

    stage: str
    current_round: int
    completed_rounds: List[int]

    interview_date: Optional[datetime]
    interview_time: Optional[str]

    score: Optional[int]

    class Config:
        from_attributes = True


# ------------------------------
# Resume Filter Request/Response
# ------------------------------
class ResumeFilterRequest(BaseModel):
    job_id: int
    min_experience: Optional[int] = None
    skills: Optional[List[str]] = None


class ResumeFilterResponse(BaseModel):
    id: int
    name: str
    experience: int
    score: int
    resume_url: Optional[str]

    class Config:
        from_attributes = True


# ------------------------------
# Move Stage / Round
# ------------------------------
class MoveStageRequest(BaseModel):
    new_stage: str
    round_number: Optional[int] = None
    interview_date: Optional[datetime] = None
    interview_time: Optional[str] = None


# ------------------------------
# Interview Scheduling
# ------------------------------
class InterviewScheduleCreate(BaseModel):
    candidate_id: int
    job_id: int
    round_number: int
    round_name: str
    interview_date: datetime
    interview_time: str


class InterviewScheduleResponse(InterviewScheduleCreate):
    id: int
    status: str
    email_sent: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------- OFFER SCHEMAS ----------------------------
class OfferCreate(BaseModel):
    ctc: Optional[int] = 0
    basic_percent: Optional[int] = 40
    hra_percent: Optional[int] = 20
    location: Optional[str] = None
    email: Optional[str] = None
    joining_date: Optional[str] = None
    probation_period: Optional[str] = "3 Months"
    notice_period: Optional[str] = "30 Days"
    terms: Optional[str] = None


class OfferUpdate(BaseModel):
    ctc: int
    basic_percent: int
    hra_percent: int
    joining_date: Optional[date]
    probation_period: str
    notice_period: str
    terms: Optional[str]


class OfferStatusUpdate(BaseModel):
    offer_status: str  # Draft / Sent / Accepted / Rejected


class OfferOut(BaseModel):
    id: int
    application_id: int
    candidate_name: str
    job_title: str
    department: str
    location: Optional[str]
    ctc: int
    joining_date: Optional[date]
    terms: Optional[str]
    offer_status: str
    document: Optional[str]
    token: Optional[str]

    class Config:
        orm_mode = True


# ---------------------------- BGV SCHEMAS ----------------------------
class BGVCreate(BaseModel):
    verification_type: str = "Internal HR Team"  # "Agency" or "Internal HR Team"
    agency_name: Optional[str] = None  # Only required if verification_type is "Agency"
    status: str = "Pending"
    
    # BGV Verification Checkboxes
    identity_verified: Optional[bool] = False
    address_verified: Optional[bool] = False
    employment_verified: Optional[bool] = False
    education_verified: Optional[bool] = False
    criminal_verified: Optional[bool] = False
    
    remarks: Optional[str] = None


class BGVUpdate(BaseModel):
    verification_type: Optional[str] = None
    agency_name: Optional[str] = None
    status: Optional[str] = None
    
    identity_verified: Optional[bool] = None
    address_verified: Optional[bool] = None
    employment_verified: Optional[bool] = None
    education_verified: Optional[bool] = None
    criminal_verified: Optional[bool] = None
    
    remarks: Optional[str] = None


class BGVOut(BaseModel):
    id: int
    application_id: int
    verification_type: str
    agency_name: Optional[str]
    status: str
    
    identity_verified: Optional[bool]
    address_verified: Optional[bool]
    employment_verified: Optional[bool]
    education_verified: Optional[bool]
    criminal_verified: Optional[bool]
    
    remarks: Optional[str]
    documents: Optional[str]

    class Config:
        from_attributes = True

from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ============================================================
# EMPLOYEE CORE SCHEMAS
# ============================================================

class EmployeeBase(BaseModel):
    name: str
    gender: Optional[str]
    dob: Optional[date]
    contact: Optional[str]
    email: Optional[str]
    department: Optional[str]
    designation: Optional[str]
    grade: Optional[str]
    doj: Optional[date]
    status: Optional[str] = "Active"
    reporting_manager: Optional[str]
    work_mode: Optional[str]
    shift: Optional[str]


class EmployeeCreate(EmployeeBase):
    employee_code: Optional[str]
    offer_id: Optional[int]


class EmployeeOut(EmployeeBase):
    id: int
    employee_code: str
    offer_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# FAMILY DETAILS
# ============================================================

class FamilyBase(BaseModel):
    name: str
    relationship: str
    age: Optional[int]
    contact: Optional[str]
    dependent: Optional[bool] = False


class FamilyCreate(FamilyBase):
    employee_id: int


class FamilyOut(FamilyBase):
    id: int
    employee_id: int

    class Config:
        from_attributes = True


# ============================================================
# EDUCATION DETAILS
# ============================================================

class EducationBase(BaseModel):
    degree: str
    specialization: Optional[str]
    university: Optional[str]
    board_university: Optional[str]
    start_year: Optional[str]
    end_year: Optional[str]
    percentage_cgpa: Optional[str]
    education_type: Optional[str]
    country: Optional[str]
    state: Optional[str]
    city: Optional[str]


class EducationCreate(EducationBase):
    employee_id: int
    file_name: Optional[str]


class EducationOut(EducationBase):
    id: int
    employee_id: int
    file_name: Optional[str]

    class Config:
        from_attributes = True


# ============================================================
# EXPERIENCE DETAILS
# ============================================================

class ExperienceBase(BaseModel):
    company: str
    job_title: str
    department: Optional[str]
    employment_type: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    current_job: Optional[bool] = False
    salary: Optional[str]
    location: Optional[str]
    job_description: Optional[str]
    achievements: Optional[str]
    reason_for_leaving: Optional[str]
    reporting_manager: Optional[str]
    manager_contact: Optional[str]


class ExperienceCreate(ExperienceBase):
    employee_id: int
    file_name: Optional[str]


class ExperienceOut(ExperienceBase):
    id: int
    employee_id: int
    file_name: Optional[str]

    class Config:
        from_attributes = True


# ============================================================
# MEDICAL DETAILS
# ============================================================

class MedicalBase(BaseModel):
    blood_group: Optional[str]
    remarks: Optional[str]


class MedicalCreate(MedicalBase):
    employee_id: int
    file_name: Optional[str]


class MedicalOut(MedicalBase):
    id: int
    employee_id: int
    height: Optional[str]
    weight: Optional[str]
    allergies: Optional[str]
    chronic_conditions: Optional[str]
    medications: Optional[str]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    emergency_contact_relation: Optional[str]
    medical_insurance_provider: Optional[str]
    medical_insurance_number: Optional[str]
    certificate_name: Optional[str]

    class Config:
        from_attributes = True


# ============================================================
# ID DOCUMENTS
# ============================================================

class IDDocBase(BaseModel):
    document_type: str
    status: Optional[str] = "Pending"


class IDDocCreate(IDDocBase):
    employee_id: int
    file_name: Optional[str]


class IDDocOut(IDDocBase):
    id: int
    employee_id: int
    file_name: Optional[str]

    class Config:
        from_attributes = True


# ============================================================
# SKILLS
# ============================================================

class SkillBase(BaseModel):
    skill: str
    rating: int   # 1–5 stars


class SkillCreate(SkillBase):
    employee_id: int


class SkillOut(SkillBase):
    id: int
    employee_id: int

    class Config:
        from_attributes = True


# ============================================================
# CERTIFICATIONS
# ============================================================

class CertificationBase(BaseModel):
    name: str
    issued_by: Optional[str]
    expiry: Optional[str]


class CertificationCreate(CertificationBase):
    employee_id: int
    file_name: Optional[str]


class CertificationOut(CertificationBase):
    id: int
    employee_id: int
    file_name: Optional[str]

    class Config:
        from_attributes = True


# ============================================================
# SALARY STRUCTURE (AUTO FROM OFFER)
# ============================================================

class SalaryBase(BaseModel):
    ctc: float
    basic_percent: float
    hra_percent: float
    allowances_percent: float
    special_percent: float
    pf_eligible: bool
    esi_eligible: bool


class SalaryCreate(SalaryBase):
    employee_id: int
    grade: Optional[str] = None
    pf_applicable: Optional[bool] = True
    pf_percent: Optional[float] = None
    esi_applicable: Optional[bool] = True
    esi_percent: Optional[float] = None


class SalaryOut(SalaryBase):
    id: int
    employee_id: int

    class Config:
        from_attributes = True


# ============================================================
# DOCUMENT VAULT
# ============================================================

class DocumentCreate(BaseModel):
    employee_id: int
    document_name: str
    file_name: Optional[str]


class DocumentOut(BaseModel):
    id: int
    employee_id: int
    doc_name: str
    file_name: Optional[str]
    uploaded_on: datetime

    class Config:
        from_attributes = True


# ============================================================
# EXIT DETAILS
# ============================================================

class ExitBase(BaseModel):
    resignation_date: Optional[date]
    last_working_day: Optional[date]
    reason: Optional[str]
    notice_period: Optional[str] = "30"
    exit_interview_date: Optional[date]
    handover_status: Optional[str] = "Pending"
    asset_return_status: Optional[str] = "Pending"
    final_settlement: Optional[str] = "Pending"
    clearance_status: Optional[str] = "Pending"
    notes: Optional[str]


class ExitCreate(ExitBase):
    employee_id: int


class ExitOut(ExitBase):
    id: int
    employee_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# FULL EMPLOYEE PROFILE RESPONSE
# (Single API returns entire EIS data)
# ============================================================

class FullEmployeeProfile(BaseModel):
    employee: EmployeeOut
    family: List[FamilyOut] = []
    education: List[EducationOut] = []
    experience: List[ExperienceOut] = []
    medical: Optional[MedicalOut] = None
    id_docs: List[IDDocOut] = []
    skills: List[SkillOut] = []
    certifications: List[CertificationOut] = []
    salary: Optional[SalaryOut] = None
    documents: List[DocumentOut] = []
    exit: Optional[ExitOut]

    class Config:
        from_attributes = True

# =====================================================
# ATTENDANCE PUNCH SCHEMAS
# =====================================================
class AttendancePunchCreate(BaseModel):
    employee_id: int
    date: date
    in_time: Optional[time] = None
    out_time: Optional[time] = None
    location: Optional[str] = None
    source: str = "WEB"
    status: Optional[str] = "Present"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    device_info: Optional[str] = None


class AttendancePunchOut(AttendancePunchCreate):
    id: int

    class Config:
        from_attributes = True


# =====================================================
# ATTENDANCE REGULARIZATION SCHEMAS
# =====================================================
class AttendanceRegularizationCreate(BaseModel):
    employee_id: int
    punch_date: date
    issue_type: str
    reason: Optional[str] = None


class AttendanceRegularizationOut(AttendanceRegularizationCreate):
    id: int
    status: str

    class Config:
        from_attributes = True


# =====================================================
# ATTENDANCE RULE SCHEMAS
# =====================================================
class AttendanceRuleCreate(BaseModel):
    rule_name: str
    rule_type: str   # Late / Early / OT
    value: int       # minutes / hours


class AttendanceRuleOut(AttendanceRuleCreate):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


# =====================================================
# ATTENDANCE LOCATION SCHEMAS
# =====================================================
class AttendanceLocationCreate(BaseModel):
    location_name: str
    grace_time: int = 10
    ot_rule: Optional[str] = None


class AttendanceLocationOut(AttendanceLocationCreate):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
# =====================================================
# LEAVE MANAGEMENT SCHEMAS  
# =====================================================

class LeaveTypeCreate(BaseModel):
    name: str
    code: str
    category: Optional[str] = None
    is_paid: bool = True

    annual_limit: int = 0
    carry_forward: bool = False
    max_carry_forward: Optional[int] = None

    attachment_required: bool = False
    auto_approve_days: int = 0


class LeaveTypeUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    category: Optional[str] = None
    is_paid: Optional[bool] = None

    annual_limit: Optional[int] = None
    carry_forward: Optional[bool] = None
    max_carry_forward: Optional[int] = None

    attachment_required: Optional[bool] = None
    auto_approve_days: Optional[int] = None

    status: Optional[str] = None


class LeaveTypeOut(BaseModel):
    id: int
    name: str
    code: str
    category: Optional[str]
    is_paid: bool

    annual_limit: int
    carry_forward: bool
    max_carry_forward: Optional[int]

    attachment_required: bool
    auto_approve_days: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class LeaveRuleCreate(BaseModel):
    accrual_frequency: str          # Monthly / Quarterly / Yearly
    accrual_method: str             # Fixed / Pro-rata / Attendance

    carry_forward_limit: Optional[int]
    encashment_allowed: bool = False
    encashment_rate: Optional[float]

    auto_deduct_lop: bool = True


class LeaveRuleUpdate(BaseModel):
    accrual_frequency: Optional[str] = None
    accrual_method: Optional[str] = None

    carry_forward_limit: Optional[int] = None
    encashment_allowed: Optional[bool] = None
    encashment_rate: Optional[float] = None

    auto_deduct_lop: Optional[bool] = None
    status: Optional[str] = None


class LeaveRuleOut(BaseModel):
    id: int
    accrual_frequency: str
    accrual_method: str
    carry_forward_limit: Optional[int]

    encashment_allowed: bool
    encashment_rate: Optional[float]

    auto_deduct_lop: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
class LeaveApply(BaseModel):
    leave_type_id: int
    from_date: date
    to_date: date
    total_days: float
    reason: Optional[str] = None
    policy_id: Optional[int] = None  # Optional policy override

class LeaveApplicationUpdate(BaseModel):
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    total_days: Optional[float] = None
    reason: Optional[str] = None
    attachment: Optional[str] = None

class LeaveApproval(BaseModel):
    status: str                    # Approved / Rejected
    approver_comment: Optional[str] = None

class LeaveApplicationOut(BaseModel):
    id: int
    employee_id: int
    leave_type_id: int

    from_date: date
    to_date: date
    total_days: float

    reason: Optional[str]
    attachment: Optional[str]

    status: str
    approver_id: Optional[int]
    approver_comment: Optional[str]

    applied_at: datetime

    class Config:
        from_attributes = True

class LeaveBalanceCreate(BaseModel):
    employee_id: int
    leave_type_id: int
    total_allocated: float
class LeaveBalanceUpdate(BaseModel):
    used: Optional[float]
    balance: Optional[float]
class LeaveBalanceOut(BaseModel):
    id: int
    employee_id: int
    leave_type_id: int

    total_allocated: float
    used: float
    balance: float

    updated_at: datetime

    class Config:
        from_attributes = True
class LeaveApprovalHistoryCreate(BaseModel):
    leave_application_id: int
    action: str                # Approved / Rejected
    action_by: int
    comments: Optional[str] = None
class LeaveApprovalHistoryOut(BaseModel):
    id: int
    leave_application_id: int
    action: str
    action_by: int
    comments: Optional[str]
    action_at: datetime

    class Config:
        from_attributes = True

# ---------------- SALARY STRUCTURE ----------------
class SalaryStructureCreate(BaseModel):
    name: str
    ctc: float
    basic_percent: float
    hra_percent: float
    allowances: Optional[str]
    deductions: Optional[str]


class SalaryStructureOut(SalaryStructureCreate):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


# ---------------- STATUTORY RULES ----------------
class StatutoryRuleCreate(BaseModel):
    pf_enabled: bool
    pf_percent: float
    esi_enabled: bool
    esi_percent: float
    pt_amount: float
    tds_enabled: bool


class StatutoryRuleOut(StatutoryRuleCreate):
    id: int

    class Config:
        from_attributes = True


# ---------------- PAYROLL RUN ----------------
class PayrollRunOut(BaseModel):
    id: int
    employee_id: int
    month: str
    gross_salary: float
    net_salary: float
    status: str

    class Config:
        from_attributes = True


# ---------------- ADJUSTMENTS ----------------
class PayrollAdjustmentCreate(BaseModel):
    employee_id: int
    month: str
    adjustment_type: str
    amount: float
    description: Optional[str]

# ============================================================
# EMPLOYEE LIFECYCLE ACTION SCHEMAS
# ============================================================

class LifecycleActionBase(BaseModel):
    employee_id: int
    action_type: str                      # Promotion / Transfer / Increment

    old_department: Optional[str] = None
    new_department: Optional[str] = None

    old_role: Optional[str] = None
    new_role: Optional[str] = None

    old_ctc: Optional[float] = None
    new_ctc: Optional[float] = None

    effective_from: date
    reason: Optional[str] = None


class LifecycleActionCreate(LifecycleActionBase):
    pass


class LifecycleActionUpdate(BaseModel):
    status: Optional[str] = None          # Approved / Rejected / Completed
    approved_by: Optional[int] = None


class LifecycleActionOut(LifecycleActionBase):
    id: int
    status: str
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
# ============================================================
# HR COMMUNICATION SCHEMAS
# ============================================================

class HRCommunicationBase(BaseModel):
    letter_type: str                      # Warning / Memo / Notice / Announcement
    subject: str
    content: str

    sent_to_type: str                     # Single / Multiple / All
    sent_to_ids: Optional[List[int]] = None

    attachment: Optional[str] = None


class HRCommunicationCreate(HRCommunicationBase):
    created_by: Optional[int] = None


class HRCommunicationOut(HRCommunicationBase):
    id: int
    status: str
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
# ============================================================
# GRIEVANCE & HELP DESK SCHEMAS
# ============================================================

class GrievanceBase(BaseModel):
    employee_id: int
    category: str                         # Harassment / Payroll / IT / General
    description: str

    priority: Optional[str] = "Medium"    # Low / Medium / High
    assigned_to: Optional[str] = None
    attachment: Optional[str] = None


class GrievanceCreate(GrievanceBase):
    pass


class GrievanceUpdate(BaseModel):
    status: Optional[str] = None          # Open / In Review / Resolved / Closed
    resolution_notes: Optional[str] = None


class GrievanceOut(GrievanceBase):
    id: int
    ticket_code: str
    status: str
    resolution_notes: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
# ============================================================
# ASSET MANAGEMENT SCHEMAS
# ============================================================

class AssetBase(BaseModel):
    employee_id: int
    asset_type: str                       # Laptop / ID Card / Phone
    asset_name: Optional[str] = None
    serial_number: Optional[str] = None

    issue_date: date
    expected_return_date: Optional[date] = None
    terms: Optional[str] = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    status: Optional[str] = None          # Active / Returned / Lost / Damaged
    actual_return_date: Optional[date] = None


class AssetOut(AssetBase):
    id: int
    status: str
    actual_return_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True
# ============================================================
# INSURANCE & BENEFITS SCHEMAS
# ============================================================

class InsuranceBase(BaseModel):
    employee_id: int
    policy_type: str                      # Medical / Accident / Life
    policy_number: Optional[str] = None
    provider: Optional[str] = None

    coverage_amount: float
    start_date: date
    expiry_date: date


class InsuranceCreate(InsuranceBase):
    pass


class InsuranceUpdate(BaseModel):
    status: Optional[str] = None          # Active / Expired / Cancelled


class InsuranceOut(InsuranceBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# =====================================================
# PMS SCHEMAS
# =====================================================

# ---------- GOALS ----------
class PMSGoalCreate(BaseModel):
    employee_id: Optional[int]
    department: Optional[str]
    title: str
    goal_type: str
    weightage: float
    measurement_method: str
    target: str
    start_date: date
    end_date: date


class PMSGoalOut(PMSGoalCreate):
    id: int
    status: str

    class Config:
        from_attributes = True


# ---------- REVIEW ----------
class PMSReviewCreate(BaseModel):
    employee_id: int
    cycle: str
    review_type: str  # Mid-Year / Annual
    self_score: Optional[float] = None
    self_comments: Optional[str] = None


class PMSReviewUpdate(BaseModel):
    manager_score: Optional[float]
    manager_comments: Optional[str]
    status: Optional[str]


class PMSReviewOut(BaseModel):
    id: int
    employee_id: int
    cycle: str
    review_type: str
    self_score: Optional[float]
    manager_score: Optional[float]
    status: str

    class Config:
        from_attributes = True


# ---------- FEEDBACK ----------
class PMSFeedbackCreate(BaseModel):
    from_employee_id: int
    to_employee_id: int
    relationship: str
    cycle: str
    rating: float
    comments: Optional[str]


class PMSFeedbackOut(PMSFeedbackCreate):
    id: int

    class Config:
        from_attributes = True


# ---------- APPRAISAL ----------
class PMSAppraisalCreate(BaseModel):
    employee_id: int
    cycle: str
    kpi_score: float
    feedback_score: float
    final_rating: float
    recommendation: str
    increment_percent: Optional[float]
    recommended_role: Optional[str]
    effective_from: Optional[date]


class PMSAppraisalOut(PMSAppraisalCreate):
    id: int
    status: str

    class Config:
        from_attributes = True


