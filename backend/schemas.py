"""
AGROSHIELD AI - Pydantic Schemas
================================
Defines strict data contracts for API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UserProfile(BaseModel):
    id: int
    phone: str
    name: str
    state_district: Optional[str] = "Kolar, Karnataka"
    language_pref: str = "kn"
    latitude: float
    longitude: float

class UserRegisterRequest(BaseModel):
    phone: str
    name: str
    state_district: Optional[str] = "Kolar, Karnataka"
    language_pref: str = "kn"
    latitude: float = 13.1339
    longitude: float = 78.1340
    # Initial farm details
    field_name: Optional[str] = "My Tomato Farm #1"
    area_acres: Optional[float] = 1.2
    tomato_variety: Optional[str] = "Arka Rakshak (ICAR-IIHR Hybrid)"
    boundary_coords: Optional[List[List[float]]] = None
    irrigation_type: Optional[str] = "Drip Lateral System"
    soil_type: Optional[str] = "Red Sandy Loam"

class UserLoginRequest(BaseModel):
    phone: str

class FieldCreate(BaseModel):
    user_id: int = 1
    field_name: str
    boundary_geojson: str
    center_lat: float
    center_lng: float
    area_acres: float = 1.2
    tomato_variety: str = "Arka Rakshak (ICAR-IIHR Hybrid)"
    planting_date: Optional[str] = "15 Oct 2026"
    irrigation_type: Optional[str] = "Drip Lateral System"
    soil_type: Optional[str] = "Red Sandy Loam"

class HourlyForecastItem(BaseModel):
    time: str
    temperature_c: float
    relative_humidity_pct: float
    dew_point_c: float
    dew_point_depression_c: float
    precipitation_mm: float
    wind_speed_kmh: float
    wind_direction_deg: float
    is_leaf_wet: bool

class TomCastForecastResponse(BaseModel):
    field_id: int
    field_name: str
    coordinates: List[float]
    data_source: str
    source_distance_km: float
    forecast_timestamp: str
    data_freshness_minutes: int
    confidence_label: str
    current_temp_c: float
    current_humidity_pct: float
    current_dew_point_c: float
    dew_point_depression_c: float
    vpd_kpa: float
    weather_condition_desc: Optional[str] = "Mostly Sunny ☀️"
    irrigation_mode: str
    instantaneous_leaf_status: str
    hourly_continuous_wet_hours: float
    today_dsv: int
    cumulative_5day_dsv: int
    risk_tier: str  # LOW, MODERATE, HIGH
    biological_explanation: str
    recommended_action_summary: str
    hourly_data: List[HourlyForecastItem]

class SatelliteCanopyResponse(BaseModel):
    field_id: int
    observation_date: str
    resolution_label: str
    ndvi_mean: float
    ndre_mean: float
    canopy_stress_pct: float
    cloud_cover_pct: float
    is_cloud_fallback: bool
    status_message: str
    disclaimer: str

class LeafScanRequest(BaseModel):
    image_base64: str
    field_id: int = 1

class LeafScanResponse(BaseModel):
    quality_passed: bool
    blur_score: float
    blur_threshold: float
    quality_status: str
    predicted_class: str
    confidence_pct: float
    affected_area_pct: float
    severity_tier: str
    uncertainty_flag: bool
    diagnosis_title: str
    biological_notes: str
    cibrc_action: Dict[str, Any]
    audio_text_kn: str
    audio_text_en: str
    audio_text_mr: str
    audio_text_hi: str
    thumbnail_base64: Optional[str] = None
    annotated_image_base64: Optional[str] = None
    # Satellite & Red-Edge (NDRE) Tri-Modal Cross-Validation
    satellite_ndvi: Optional[float] = 0.68
    satellite_ndre: Optional[float] = 0.34
    satellite_stress_pct: Optional[float] = 9.2
    satellite_band_source: Optional[str] = "Sentinel-2 MSI Band 5 (Red-Edge 705nm) & Band 8 (NIR 842nm)"
    cross_validation_status: Optional[str] = "Tri-Modal Convergence Verified (Ground Leaf + Satellite NDRE + Tom-Cast)"
    multi_modal_confidence_pct: Optional[float] = 96.8

class ScanHistoryItem(BaseModel):
    id: int
    field_id: int
    created_at: str
    predicted_class: str
    confidence_pct: float
    affected_area_pct: float
    severity_tier: str
    diagnosis_title: str
    treatment_summary: Optional[str] = None
    thumbnail_base64: Optional[str] = None
    audio_text_kn: Optional[str] = None
    audio_text_mr: Optional[str] = None
    audio_text_hi: Optional[str] = None
    audio_text_en: Optional[str] = None

class TrendPoint(BaseModel):
    date: str
    day_label: str
    dsv_daily: int
    dsv_cum: int
    temp_c: float
    humidity_pct: float
    wet_hours: float
    ndvi: float
    ndre: float

class TrendAnalyticsResponse(BaseModel):
    field_id: Optional[int] = 0
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    trends: List[TrendPoint]
    current_cum_dsv: int
    summary_advisory: str

class CommunityOutbreakItem(BaseModel):
    id: int
    distance_km: float
    bearing_deg: float
    wind_aligned: bool
    disease_name: str
    severity: str
    verification_status: str
    created_at: str
    notes: Optional[str]

class CommunityNetworkResponse(BaseModel):
    field_id: int
    user_coords: List[float]
    local_wind_direction_deg: float
    local_wind_speed_kmh: float
    total_active_reports_within_5km: int
    upwind_high_risk_reports: int
    proximity_risk_level: str
    advisory: str
    reports: List[CommunityOutbreakItem]

class ChatbotRequest(BaseModel):
    message: str
    language: str = "kn"

class ChatbotResponse(BaseModel):
    reply_text: str
    reply_audio_text: str
    source_reference: str
    confidence_topic: str
    suggested_followups: List[str]

class GroundTruthLogCreate(BaseModel):
    field_id: int
    forecasted_risk_tier: str
    forecasted_cum_dsv: int
    actual_symptom_date: Optional[str] = None
    agronomist_confirmed: str = "Pending"
    lead_time_hours: Optional[float] = None
    prediction_accuracy: str = "Pending"
    notes: Optional[str] = None
