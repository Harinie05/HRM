from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from schemas.schemas_master import AdminAuth
from datetime import date

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
    name: Optional[str]
    email: Optional[EmailStr]
    password: Optional[str]
    role_id: Optional[int]
    department_id: Optional[int]

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
        orm_mode = True

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
        orm_mode = True


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


# ---------- Output ----------
class HolidayOut(HolidayBase):
    id: int

    class Config:
        from_attributes = True
