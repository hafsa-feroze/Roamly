from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Enum as SQLEnum
import uuid
from .enums import UserType
from .base import Base

class User(Base):
    __tablename__ = 'users'

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    name = Column(String(100), nullable=False)
    phonenumber = Column(String(20), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    type = Column(SQLEnum(UserType, name="user_type_enum"), nullable=False, default=UserType.USER)
