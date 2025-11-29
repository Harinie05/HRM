from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
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
