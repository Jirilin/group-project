import csv
import json
from pathlib import Path


def export_json(data: dict, out_path: Path):
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def export_csv(data: dict, out_path: Path):
    straight = data["measurement"]["straight"]
    curved = data["measurement"].get("curved")
    flat = {
        "analysis_id": data["metadata"]["analysis_id"],
        "original_filename": data["metadata"]["original_filename"],
        "saved_filename": data["metadata"]["saved_filename"],
        "timestamp_utc": data["metadata"]["timestamp_utc"],
        "model_version": data["metadata"]["model_version"],
        "task": data["metadata"]["task"],
        "method": data["metadata"]["method"],
        "width": data["metadata"]["width"],
        "height": data["metadata"]["height"],
        "point_8_x": data["point_8"]["x"],
        "point_8_y": data["point_8"]["y"],
        "point_13_x": data["point_13"]["x"],
        "point_13_y": data["point_13"]["y"],
        "straight_length_px": straight["length_px"],
        "straight_length_mm": straight["length_mm"],
        "pixels_per_mm": straight["pixels_per_mm"],
    }
    if curved:
        flat["curved_length_px"] = curved["length_px"]
        flat["curved_length_mm"] = curved["length_mm"]
        flat["curved_num_points"] = curved["num_points"]
        # Optionally serialize points as JSON string
        import json
        flat["curved_points"] = json.dumps(curved["points"])
    flat["reviewer_status"] = data.get("reviewer_status", "pending")
    flat["overlay_path"] = data["overlay_path"]

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(flat.keys()))
        writer.writeheader()
        writer.writerow(flat)