from pydantic import BaseModel
from datetime import datetime

class RecordDetail(BaseModel):
    id: int
    analysis_id: str
    original_filename: str
    created_at: datetime
    length_mm: float
    reviewer_status: str

    class Config:
        from_attributes = True

class RecordListResponse(BaseModel):
    records: list[RecordDetail]