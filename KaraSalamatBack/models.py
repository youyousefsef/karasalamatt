from datetime import datetime, timezone
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime

class Base(DeclarativeBase):
    pass
class AdminReg(Base):
    __tablename__ = 'admin_reg'
    id = Column(Integer, primary_key=True, index=True)
    phone_num = Column(String, index=True)

class HSEReg(Base):
    __tablename__ = 'hse_reg'
    id = Column(Integer, primary_key=True, index=True)
    phone_num = Column(String, index=True)
    role = Column(String, default="HSESupervisor")
    owner_id = Column(Integer, ForeignKey(AdminReg.id), index=True)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    fullname = Column(String)
    phone_number = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    role = Column(String)
    otp_code = Column(Integer)
    sub = Column(Integer)

class HSEData(Base):
    __tablename__ = 'hse_data'
    id = Column(Integer, primary_key=True, index=True)
    supervisor_id = Column(Integer, ForeignKey('hse_reg.id'), index=True)
    metric = Column(String, nullable=False)
    value = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class VerfyOTPCode(Base):
    __tablename__ = 'verified_otp_code'
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, index=True)
    otp_code = Column(String)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
