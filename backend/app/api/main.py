import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.core.config import settings
from app.models.predictor import WingPosePredictor
from app.schemas.responses import AnalyzeResponse, ReviewRequest, ReviewResponse
from app.services.export_service import export_csv, export_json
from app.services.measurement_service import compute_measurement
from app.services.review_service import save_review
from app.utils.files import save_upload_file
from app.utils.image_ops import draw_overlay, get_image_size, load_image

# Import the new routers
from app.api import auth, users, records
from app.api.dependencies import get_current_user
from app.core.database import engine, Base
from app.models import user, analysis  # noqa: F401

# Create the FastAPI app FIRST
app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

# CORS middleware (allow frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers AFTER app is defined
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(records.router)

# Create database tables on startup
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

predictor = None

def get_predictor():
    global predictor
    if predictor is None:
        if not settings.model_path.exists():
            raise HTTPException(status_code=500, detail=f"Model not found at {settings.model_path}")
        predictor = WingPosePredictor(settings.model_path)
    return predictor

@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_image(
    file: Annotated[UploadFile, File(description="Wing image file")],
    pixels_per_mm: float | None = Query(default=None, description="Optional override calibration value"),
):
    # ... (keep the existing analyze_image logic unchanged)
    analysis_id, saved_path = await save_upload_file(file)

    try:
        image = load_image(saved_path)
        width, height = get_image_size(image)
        pred = get_predictor().predict(str(saved_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    point_8 = (pred["point_8"]["x"], pred["point_8"]["y"])
    point_13 = (pred["point_13"]["x"], pred["point_13"]["y"])
    measurement = compute_measurement(point_8, point_13, pixels_per_mm)

    overlay_path = settings.results_dir / f"{analysis_id}_overlay.jpg"
    draw_overlay(image, point_8, point_13, overlay_path)

      # Prepare straight measurement
    straight_measurement = {
        "length_px": measurement["straight"]["length_px"],
        "length_mm": measurement["straight"]["length_mm"],
        "pixels_per_mm": measurement["straight"]["pixels_per_mm"],
    }
    # For initial analysis, curved is None
    measurement_output = {
        "straight": straight_measurement,
        "curved": None,
    }

    response_payload = {
        "status": "success",
        "metadata": {
            "analysis_id": analysis_id,
            "original_filename": file.filename,
            "saved_filename": saved_path.name,
            "content_type": file.content_type,
            "width": width,
            "height": height,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "model_version": pred["model_version"],
            "task": "wing_l3_straight",
            "method": "2_keypoint_pose",
        },
        "point_8": pred["point_8"],
        "point_13": pred["point_13"],
        "measurement": measurement_output,
        "reviewer_status": "pending",
        "overlay_path": str(overlay_path),
        "json_path": str(settings.results_dir / f"{analysis_id}.json"),
    }

    export_json(response_payload, Path(response_payload["json_path"]))
    export_csv(response_payload, settings.results_dir / f"{analysis_id}.csv")
    return response_payload

@app.post("/review/{analysis_id}", response_model=ReviewResponse)
def review_analysis(analysis_id: str, payload: ReviewRequest):
    result_json = settings.results_dir / f"{analysis_id}.json"
    if not result_json.exists():
        raise HTTPException(status_code=404, detail="Analysis not found")

    with open(result_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    ppm = data["measurement"]["straight"]["pixels_per_mm"]
    point_8 = (payload.point_8.x, payload.point_8.y)
    point_13 = (payload.point_13.x, payload.point_13.y)

    # Compute straight measurement
    straight_meas = compute_measurement(point_8, point_13, pixels_per_mm=ppm)["straight"]

    # Compute curved measurement if provided
    curved_meas = None
    if payload.curved_points and len(payload.curved_points) >= 2:
        curved_points_tuples = [(p.x, p.y) for p in payload.curved_points]
        curved_meas = compute_measurement(
            point_8, point_13,
            curved_path=curved_points_tuples,
            pixels_per_mm=ppm
        ).get("curved")

    # Update data
    data["point_8"] = {"x": point_8[0], "y": point_8[1], "confidence": payload.point_8.confidence}
    data["point_13"] = {"x": point_13[0], "y": point_13[1], "confidence": payload.point_13.confidence}
    data["measurement"] = {
        "straight": straight_meas,
        "curved": curved_meas,
    }
    data["reviewer_status"] = payload.decision

    export_json(data, result_json)
    export_csv(data, settings.results_dir / f"{analysis_id}.csv")

    return {
        "status": "success",
        "analysis_id": analysis_id,
        "reviewer_status": payload.decision,
        "measurement": data["measurement"],
        "review_path": str(settings.results_dir / f"{analysis_id}_review.json"),
    }

@app.get("/result/{analysis_id}")
def get_result(analysis_id: str):
    result_json = settings.results_dir / f"{analysis_id}.json"
    if not result_json.exists():
        raise HTTPException(status_code=404, detail="Result not found")
    return FileResponse(result_json, media_type="application/json", filename=result_json.name)

@app.get("/export/{analysis_id}")
def export_result(analysis_id: str, format: str = Query(default="json", pattern="^(json|csv)$")):
    file_path = settings.results_dir / f"{analysis_id}.{format}"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"{format.upper()} export not found")
    media_type = "application/json" if format == "json" else "text/csv"
    return FileResponse(file_path, media_type=media_type, filename=file_path.name)