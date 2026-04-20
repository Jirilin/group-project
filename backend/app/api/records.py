from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.analysis import AnalysisRecord
from app.schemas.records import RecordListResponse

router = APIRouter(prefix="/records", tags=["records"])

@router.get("/", response_model=RecordListResponse)
def get_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.user_id == current_user.id)
        .order_by(AnalysisRecord.created_at.desc())
        .all()
    )
    return {"records": records}