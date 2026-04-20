// types.ts – single flat file for all shared types

export interface User {
  id: number;
  email: string;
  full_name: string;
  designation: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AnalysisMetadata {
  analysis_id: string;
  original_filename: string;
  saved_filename: string;
  width: number;
  height: number;
  timestamp_utc: string;
  model_version: string;
  task: string;
  method: string;
}

export interface Point2D {
  x: number;
  y: number;
  confidence?: number | null;
}

export interface Measurement {
  straight: {
    length_px: number;
    length_mm: number;
    pixels_per_mm: number;
  };
}

export interface AnalysisResult {
  status: string;
  metadata: AnalysisMetadata;
  point_8: Point2D;
  point_13: Point2D;
  measurement: Measurement;
  reviewer_status: string;
  overlay_path: string;
  json_path: string;
}

export interface AnalysisRecord {
  id: number;
  analysis_id: string;
  original_filename: string;
  created_at: string;
  length_mm: number;
  reviewer_status: string;
}