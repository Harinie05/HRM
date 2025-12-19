from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func, Text, JSON, Text, JSON
from sqlalchemy.orm import declarative_base, relationship

MasterBase = declarative_base()

class Hospital(MasterBase):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(String(50), unique=True, nullable=False)
    db_name = Column(String(150), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    email = Column(String(191), unique=True, nullable=False)
    phone = Column(String(50), nullable=False)
    license_number = Column(String(100), nullable=False)
    contact_person = Column(String(150))
    logo = Column(String(512))
    pincode = Column(String(20))
    created_at = Column(DateTime, default=func.now())

    users = relationship("MasterUser", back_populates="hospital")


class MasterUser(MasterBase):
    __tablename__ = "master_users"

    id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"))
    email = Column(String(191), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

    hospital = relationship("Hospital", back_populates="users")


class AuditLog(MasterBase):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(String(50), nullable=False)
    user_id = Column(Integer, nullable=True)
    action = Column(String(100), nullable=False)
    table_name = Column(String(100), nullable=False)
    record_id = Column(String(50), nullable=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())


class ErrorLog(MasterBase):
    __tablename__ = "error_logs"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(String(50), nullable=True)
    error_type = Column(String(100), nullable=False)
    error_message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)
    request_url = Column(String(500), nullable=True)
    request_method = Column(String(10), nullable=True)
    request_data = Column(JSON, nullable=True)
    user_id = Column(Integer, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=func.now())
