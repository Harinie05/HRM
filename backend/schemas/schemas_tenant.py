from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from schemas.schemas_master import AdminAuth
from datetime import date, datetime

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
    pass

class LeavePolicyOut(LeavePolicyBase):
    id: int
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
    department: str
    hiring_manager: str
    openings: int
    experience: Optional[str]
    salary_range: Optional[str]

    job_type: str
    work_mode: str
    location: str

    skills: List[str]                      # Accept list
    description: Optional[str]
    deadline: Optional[date]

    status: str = "Draft"                  # Draft / Posted


class JobReqCreate(JobReqBase):
    pass


class JobReqOut(JobReqBase):
    id: int
    attachment: Optional[str] = None       # filename if uploaded
    created_at: Optional[datetime]

    class Config:
        from_attributes = True             # ORM mode


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
    agency: Optional[str] = None
    status: str = "Pending"
    remarks: Optional[str] = None


class BGVUpdate(BaseModel):
    agency: Optional[str]
    status: Optional[str]
    remarks: Optional[str]


class BGVOut(BaseModel):
    id: int
    application_id: int
    agency: Optional[str]
    status: str
    remarks: Optional[str]
    documents: Optional[str]

    class Config:
        orm_mode = True
