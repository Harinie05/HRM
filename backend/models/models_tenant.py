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

