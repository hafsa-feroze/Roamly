from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .base import Base

class Notification(Base):
    __tablename__ = 'notifications'

    notification_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    booking_id = Column(UUID(as_uuid=True), ForeignKey('bookings.booking_id'), nullable=False)
    notification = Column(String(500), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    company = relationship("User", foreign_keys=[company_id], backref="notifications")
    booking = relationship("Booking", backref="notifications")

