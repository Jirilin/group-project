from sqlalchemy.orm import Session
from app.models.analysis import AnalysisRecord

def save_analysis_record(
    db: Session,
    user_id: int,
    analysis_id: str,
    original_filename: str,
    saved_filename: str,
    width: int,
    height: int,
    point_8_x: float,
    point_8_y: float,
    point_13_x: float,
    point_13_y: float,
    length_px: float,
    length_mm: float,
    pixels_per_mm: float,
) -> AnalysisRecord:
    record = AnalysisRecord(
        user_id=user_id,
        analysis_id=analysis_id,
        original_filename=original_filename,
        saved_filename=saved_filename,
        width=width,
        height=height,
        point_8_x=point_8_x,
        point_8_y=point_8_y,
        point_13_x=point_13_x,
        point_13_y=point_13_y,
        length_px=length_px,
        length_mm=length_mm,
        pixels_per_mm=pixels_per_mm,
        reviewer_status="pending",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def update_analysis_record(
    db: Session,
    analysis_id: str,
    point_8_x: float,
    point_8_y: float,
    point_13_x: float,
    point_13_y: float,
    length_px: float,
    length_mm: float,
    reviewer_status: str,
):
    record = db.query(AnalysisRecord).filter(AnalysisRecord.analysis_id == analysis_id).first()
    if record:
        record.point_8_x = point_8_x
        record.point_8_y = point_8_y
        record.point_13_x = point_13_x
        record.point_13_y = point_13_y
        record.length_px = length_px
        record.length_mm = length_mm
        record.reviewer_status = reviewer_status
        db.commit()
    return record