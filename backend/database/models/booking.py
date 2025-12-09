from sqlalchemy import Column, Numeric, Integer, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .base import Base

class Booking(Base):
    __tablename__ = 'bookings'

    booking_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    resort_id = Column(UUID(as_uuid=True), ForeignKey('resorts_with_image.resort_id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    booking_date = Column(DateTime, nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    pdf_filename = Column(String(255), nullable=True)  # PDF booking receipt filename

    # Relationships
    resort = relationship("ResortWithImage", back_populates="bookings")
    user = relationship("User", foreign_keys=[user_id], backref="bookings")
    company = relationship("User", foreign_keys=[company_id], backref="company_bookings")

