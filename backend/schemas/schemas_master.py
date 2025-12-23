from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date


# ---------------------------
# MASTER: HOSPITAL REGISTER
# ---------------------------
class HospitalRegister(BaseModel):
    tenant_id: str
    tenant_db: str
    name: str
    email: EmailStr
    phone: str
    license_number: str
    contact_person: Optional[str] = None
    logo: Optional[str] = None
    pincode: Optional[str] = None
    password: str
    subscription_plan: Optional[str] = "Standard"


# ---------------------------
# MASTER: HOSPITAL OUT
# ---------------------------
class HospitalOut(BaseModel):
    id: int
    tenant_id: str
    db_name: str
    name: str
    email: EmailStr
    subscription_plan: Optional[str] = None
    license_start_date: Optional[date] = None
    license_end_date: Optional[date] = None

    class Config:
        from_attributes = True


# ---------------------------
# MASTER: ADMIN AUTH
# ---------------------------
class AdminAuth(BaseModel):
    email: EmailStr
    password: str

