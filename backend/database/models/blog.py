from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .base import Base

class Blog(Base):
    __tablename__ = 'blogs'

    blog_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    resort_id = Column(UUID(as_uuid=True), ForeignKey('resorts_with_image.resort_id'), nullable=False)
    caption = Column(Text, nullable=False)
    image_name = Column(String(255), nullable=True)  # Image filename (uuid.png)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    company = relationship("User", foreign_keys=[company_id], backref="blogs")
    resort = relationship("ResortWithImage", foreign_keys=[resort_id], backref="blogs")


