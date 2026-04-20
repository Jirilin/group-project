from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class AnalysisRecord(Base):
    __tablename__ = "analysis_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    analysis_id = Column(String, unique=True, index=True)
    original_filename = Column(String)
    saved_filename = Column(String)
    width = Column(Integer)
    height = Column(Integer)
    point_8_x = Column(Float)
    point_8_y = Column(Float)
    point_13_x = Column(Float)
    point_13_y = Column(Float)
    length_px = Column(Float)
    length_mm = Column(Float)
    pixels_per_mm = Column(Float)
    reviewer_status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())