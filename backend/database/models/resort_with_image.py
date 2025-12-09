from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship
import uuid
from .enums import ResortStatus, ResortType
from .base import Base

class ResortWithImage(Base):
    __tablename__ = 'resorts_with_image'

    resort_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    name = Column(String(255), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    city = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    status = Column(SQLEnum(ResortStatus, name="resort_status_enum"), nullable=False, default=ResortStatus.OPEN)
    type = Column(SQLEnum(ResortType, name="resort_type_enum"), nullable=False)
    image_name = Column(String(255), nullable=True)  # New field for image filename
    instagram_link = Column(String(500), nullable=True)  # Instagram profile/link
    facebook_link = Column(String(500), nullable=True)  # Facebook page/link
    googlemap_link = Column(String(500), nullable=True)  # Google Maps location link

    # Relationships
    company = relationship("User", foreign_keys=[company_id], backref="resorts_with_image")
    bookings = relationship("Booking", back_populates="resort")

