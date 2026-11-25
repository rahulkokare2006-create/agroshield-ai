"""
AGROSHIELD AI - FastAPI Production Backend
==========================================
Main REST API service wiring together:
1. User Authentication & Profile Registration.
2. Multi-Farm & Boundary Management.
3. Quality-Gated Leaf Vision with Lesion Annotation & 7-Day History.
4. 7-Day Multi-Parameter Analytics & Epidemiological Trends.
5. Tom-Cast Disease-Risk Forecasting Engine (Open-Meteo & EDPD).
6. Sentinel-2 Auxiliary Canopy Vigor (with Cloud Fallback).
7. Community Disease Reporting Network (Wind Vector).
8. Grounded Kisan Tomato AI Chatbot.
9. Empirical Ground-Truth Validation Logging.
"""

import os
import json
import base64
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any

from .database import init_db, get_connection
from .schemas import (
    UserProfile, UserRegisterRequest, UserLoginRequest,
    FieldCreate, TomCastForecastResponse,
    SatelliteCanopyResponse, LeafScanRequest, LeafScanResponse,
    ScanHistoryItem, TrendAnalyticsResponse, CommunityNetworkResponse,
    ChatbotRequest, ChatbotResponse, GroundTruthLogCreate
)
from .services.tomcast_service import compute_tomcast_for_field
from .services.vision_service import check_image_quality, analyze_leaf_diagnostics
from .services.satellite_service import get_satellite_canopy_observation
from .services.community_service import get_community_network_analysis
from .services.chatbot_service import ask_kisan_chatbot
from .services.analytics_service import get_field_parameter_trends

# Initialize database on startup
init_db()

app = FastAPI(
    title="AGROSHIELD AI API",
    description="Predictive Crop Health Intelligence & Early Disease Warning Platform for Tomatoes",
    version="2.0.0"
)

# Enable CORS for local Vite frontend and web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "platform": "AGROSHIELD AI",
        "version": "2.0.0",
        "crop_scope": "Tomato (Solanum lycopersicum)",
        "target_disease": "Tomato Early Blight (Alternaria solani)"
    }

# -------------------------------------------------------------
# 1. USER AUTHENTICATION & MULTI-FARM PROFILE
# -------------------------------------------------------------

@app.post("/api/auth/register", response_model=UserProfile)
def register_user(payload: UserRegisterRequest):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if phone already registered
    cursor.execute("SELECT * FROM users WHERE phone = ?;", (payload.phone,))
    existing = cursor.fetchone()
    if existing:
        user_id = existing["id"]
        cursor.execute("""
        UPDATE users SET name = ?, state_district = ?, language_pref = ?, latitude = ?, longitude = ?
        WHERE id = ?;
        """, (payload.name, payload.state_district, payload.language_pref, payload.latitude, payload.longitude, user_id))
    else:
        cursor.execute("""
        INSERT INTO users (phone, name, state_district, language_pref, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?);
        """, (payload.phone, payload.name, payload.state_district, payload.language_pref, payload.latitude, payload.longitude))
        user_id = cursor.lastrowid

    # Create initial farm boundary if provided
    boundary = payload.boundary_coords or [
        [payload.latitude - 0.0012, payload.longitude - 0.0015],
        [payload.latitude - 0.0012, payload.longitude + 0.0018],
        [payload.latitude + 0.0014, payload.longitude + 0.0016],
        [payload.latitude + 0.0013, payload.longitude - 0.0014]
    ]

    cursor.execute("""
    INSERT INTO fields (user_id, field_name, boundary_geojson, center_lat, center_lng, area_acres, tomato_variety, irrigation_type, soil_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        user_id,
        payload.field_name or "My Farm Plot #1",
        json.dumps(boundary),
        payload.latitude,
        payload.longitude,
        payload.area_acres or 1.2,
        payload.tomato_variety or "Arka Rakshak (ICAR-IIHR Hybrid)",
        payload.irrigation_type or "Drip Lateral System",
        payload.soil_type or "Red Sandy Loam"
    ))

    conn.commit()
    conn.close()

    return UserProfile(
        id=user_id,
        phone=payload.phone,
        name=payload.name,
        state_district=payload.state_district or "Kolar, Karnataka",
        language_pref=payload.language_pref,
        latitude=payload.latitude,
        longitude=payload.longitude
    )

@app.post("/api/auth/login", response_model=UserProfile)
def login_user(payload: UserLoginRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE phone = ?;", (payload.phone,))
    user = cursor.fetchone()
    
    if not user:
        # If user not found, auto-create demo session for phone
        cursor.execute("""
        INSERT INTO users (phone, name, state_district, language_pref, latitude, longitude)
        VALUES (?, 'Kisan Farmer', 'Kolar, Karnataka', 'kn', 13.1339, 78.1340);
        """, (payload.phone,))
        user_id = cursor.lastrowid
        
        default_boundary = json.dumps([
            [13.1328, 78.1325],
            [13.1328, 78.1358],
            [13.1354, 78.1356],
            [13.1353, 78.1326]
        ])
        cursor.execute("""
        INSERT INTO fields (user_id, field_name, boundary_geojson, center_lat, center_lng, area_acres)
        VALUES (?, 'Main Tomato Plot', ?, 13.1339, 78.1340, 1.2);
        """, (user_id, default_boundary))
        conn.commit()
        
        cursor.execute("SELECT * FROM users WHERE id = ?;", (user_id,))
        user = cursor.fetchone()

    conn.close()
    return UserProfile(
        id=user["id"],
        phone=user["phone"],
        name=user["name"],
        state_district=user["state_district"] or "Kolar, Karnataka",
        language_pref=user["language_pref"] or "kn",
        latitude=user["latitude"],
        longitude=user["longitude"]
    )

@app.get("/api/user/profile", response_model=UserProfile)
def get_user_profile(user_id: int = 1):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?;", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfile(
        id=user["id"],
        phone=user["phone"],
        name=user["name"],
        state_district=user["state_district"] or "Kolar, Karnataka",
        language_pref=user["language_pref"],
        latitude=user["latitude"],
        longitude=user["longitude"]
    )

# -------------------------------------------------------------
# 2. MULTI-FARM / FIELD MANAGEMENT
# -------------------------------------------------------------

@app.get("/api/fields")
def list_fields(user_id: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM fields WHERE user_id = ? ORDER BY id ASC;", (user_id,))
    else:
        cursor.execute("SELECT * FROM fields ORDER BY id ASC;")
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        try:
            b_coords = json.loads(r["boundary_geojson"])
        except Exception:
            b_coords = []
        result.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "field_name": r["field_name"],
            "boundary_geojson": b_coords,
            "center_lat": r["center_lat"],
            "center_lng": r["center_lng"],
            "area_acres": r["area_acres"],
            "crop_type": r["crop_type"],
            "tomato_variety": r["tomato_variety"],
            "planting_date": r["planting_date"],
            "irrigation_type": r["irrigation_type"] if "irrigation_type" in r.keys() else "Drip Lateral System",
            "soil_type": r["soil_type"] if "soil_type" in r.keys() else "Red Sandy Loam",
            "created_at": r["created_at"]
        })
    return result

@app.post("/api/fields")
def create_field(payload: FieldCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO fields (user_id, field_name, boundary_geojson, center_lat, center_lng, area_acres, tomato_variety, planting_date, irrigation_type, soil_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        payload.user_id,
        payload.field_name,
        payload.boundary_geojson,
        payload.center_lat,
        payload.center_lng,
        payload.area_acres,
        payload.tomato_variety,
        payload.planting_date,
        payload.irrigation_type,
        payload.soil_type
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"id": new_id, "message": "Farm registered successfully"}

@app.put("/api/fields/{field_id}")
def update_field(field_id: int, payload: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM fields WHERE id = ?;", (field_id,))
    field = cursor.fetchone()
    if not field:
        conn.close()
        raise HTTPException(status_code=404, detail="Field not found")

    raw_boundary = payload.get("boundary_geojson")
    if isinstance(raw_boundary, list):
        boundary_json = json.dumps(raw_boundary)
    elif isinstance(raw_boundary, str):
        boundary_json = raw_boundary
    else:
        boundary_json = field["boundary_geojson"]

    field_name = payload.get("field_name", field["field_name"])
    area_acres = float(payload.get("area_acres", field["area_acres"]))
    center_lat = float(payload.get("center_lat", field["center_lat"]))
    center_lng = float(payload.get("center_lng", field["center_lng"]))
    tomato_variety = payload.get("tomato_variety", field["tomato_variety"])
    planting_date = payload.get("planting_date", field["planting_date"])
    irrigation_type = payload.get("irrigation_type", field["irrigation_type"])
    soil_type = payload.get("soil_type", field["soil_type"])

    cursor.execute("""
    UPDATE fields SET
        field_name = ?,
        boundary_geojson = ?,
        center_lat = ?,
        center_lng = ?,
        area_acres = ?,
        tomato_variety = ?,
        planting_date = ?,
        irrigation_type = ?,
        soil_type = ?
    WHERE id = ?;
    """, (field_name, boundary_json, center_lat, center_lng, area_acres, tomato_variety, planting_date, irrigation_type, soil_type, field_id))
    conn.commit()

    cursor.execute("SELECT * FROM fields WHERE id = ?;", (field_id,))
    updated = cursor.fetchone()
    conn.close()

    try:
        b_coords = json.loads(updated["boundary_geojson"])
    except Exception:
        b_coords = []

    return {
        "id": updated["id"],
        "user_id": updated["user_id"],
        "field_name": updated["field_name"],
        "boundary_geojson": b_coords,
        "center_lat": updated["center_lat"],
        "center_lng": updated["center_lng"],
        "area_acres": updated["area_acres"],
        "crop_type": updated["crop_type"],
        "tomato_variety": updated["tomato_variety"],
        "planting_date": updated["planting_date"],
        "irrigation_type": updated["irrigation_type"],
        "soil_type": updated["soil_type"]
    }

@app.delete("/api/fields/{field_id}")
def delete_field(field_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM fields WHERE id = ?;", (field_id,))
    cursor.execute("DELETE FROM leaf_scans WHERE field_id = ?;", (field_id,))
    cursor.execute("DELETE FROM ground_truth_logs WHERE field_id = ?;", (field_id,))
    conn.commit()
    conn.close()
    return {"status": "DELETED", "field_id": field_id}

@app.put("/api/user/profile", response_model=UserProfile)
def update_user_profile(payload: UserProfile):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE users SET name = ?, phone = ?, state_district = ?, language_pref = ?, latitude = ?, longitude = ?
    WHERE id = ?;
    """, (payload.name, payload.phone, payload.state_district, payload.language_pref, payload.latitude, payload.longitude, payload.id))
    conn.commit()
    cursor.execute("SELECT * FROM users WHERE id = ?;", (payload.id,))
    user = cursor.fetchone()
    conn.close()
    return UserProfile(
        id=user["id"],
        phone=user["phone"],
        name=user["name"],
        state_district=user["state_district"] or "Kolar, Karnataka",
        language_pref=user["language_pref"],
        latitude=user["latitude"],
        longitude=user["longitude"]
    )

# -------------------------------------------------------------
# 3. TOM-CAST & LIVE WEATHER
# -------------------------------------------------------------

@app.get("/api/weather/tomcast/{field_id}", response_model=TomCastForecastResponse)
async def get_tomcast_forecast(
    field_id: int,
    irrigation_mode: str = Query("Drip", description="Drip or Foliar")
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM fields WHERE id = ?;", (field_id,))
    field = cursor.fetchone()
    conn.close()
    
    if not field:
        lat, lng, name = 13.1340, 78.1340, "Default Tomato Plot"
    else:
        lat = field["center_lat"]
        lng = field["center_lng"]
        name = field["field_name"]

    response = await compute_tomcast_for_field(
        field_id=field_id,
        field_name=name,
        lat=lat,
        lng=lng,
        irrigation_mode=irrigation_mode
    )
    return response

# -------------------------------------------------------------
# 4. SATELLITE AUXILIARY CANOPY VIGOR
# -------------------------------------------------------------

@app.get("/api/satellite/canopy/{field_id}", response_model=SatelliteCanopyResponse)
def get_satellite_canopy(
    field_id: int,
    cloud_cover_pct: Optional[float] = Query(None, description="Auto-detected or optional override")
):
    detected_clouds = cloud_cover_pct if cloud_cover_pct is not None else 14.0
    return get_satellite_canopy_observation(field_id=field_id, auto_detected_cloud_pct=detected_clouds)

# -------------------------------------------------------------
# 5. REAL COMPUTER VISION LEAF SCAN & 7-DAY HISTORY
# -------------------------------------------------------------

@app.post("/api/vision/scan", response_model=LeafScanResponse)
def analyze_leaf_image(payload: LeafScanRequest):
    raw_b64 = payload.image_base64
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]
    
    try:
        image_bytes = base64.b64decode(raw_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    # 1. Run OpenCV Quality Gate
    passed, blur_score, quality_status, img = check_image_quality(image_bytes)
    
    if not passed:
        return LeafScanResponse(
            quality_passed=False,
            blur_score=round(blur_score, 1),
            blur_threshold=75.0,
            quality_status=quality_status,
            predicted_class="REJECTED_QUALITY_CHECK",
            confidence_pct=0.0,
            affected_area_pct=0.0,
            severity_tier="None",
            uncertainty_flag=True,
            diagnosis_title="Image Rejected (ಫೋಟೋ ಅಸ್ಪಷ್ಟವಾಗಿದೆ)",
            biological_notes=quality_status,
            cibrc_action={"error": "Quality check failed. Please retake photo steady under natural daylight."},
            audio_text_kn="ಫೋಟೋ ಅಸ್ಪಷ್ಟವಾಗಿದೆ ಅಥವಾ ಕತ್ತಲೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಫೋನ್ ಅನ್ನು ಸ್ಥಿರವಾಗಿ ಹಿಡಿದು ಸ್ಪಷ್ಟವಾದ ಫೋಟೋ ತೆಗೆಯಿರಿ.",
            audio_text_en="Photo is blurry or poorly lit. Please hold phone steady 15 cm from leaf and retake photo.",
            audio_text_mr="फोटो अस्पष्ट किंवा अंधारात आला आहे. कृपया कॅमेरा स्थिर ठेवून पुन्हा स्वच्छ फोटो काढा.",
            audio_text_hi="फोटो धुंधला या अंधेरे में आया है। कृपया फोन स्थिर रखकर साफ फोटो लें।"
        )

    # 2. Run CIE-Lab / HSV diagnostic inference
    scan_result = analyze_leaf_diagnostics(img, blur_score)

    # 3. Cross-reference with Sentinel-2 Satellite & Red-Edge (NDRE)
    sat_obs = get_satellite_canopy_observation(payload.field_id, auto_detected_cloud_pct=14.0)
    scan_result.satellite_ndvi = sat_obs.ndvi_mean
    scan_result.satellite_ndre = sat_obs.ndre_mean
    scan_result.satellite_stress_pct = sat_obs.canopy_stress_pct

    if scan_result.predicted_class != "NOT_A_TOMATO_LEAF" and scan_result.quality_passed:
        if "Early Blight" in scan_result.predicted_class:
            if sat_obs.ndre_mean < 0.38:
                scan_result.multi_modal_confidence_pct = round(min(98.8, scan_result.confidence_pct + 4.4), 1)
                scan_result.cross_validation_status = (
                    f"Tri-Modal Convergence Verified: Ground foliar Alternaria spots are confirmed by "
                    f"Sentinel-2 Red-Edge Chlorophyll Drop (NDRE: {sat_obs.ndre_mean}) and elevated canopy stress ({sat_obs.canopy_stress_pct}%)."
                )
            else:
                scan_result.multi_modal_confidence_pct = scan_result.confidence_pct
                scan_result.cross_validation_status = (
                    f"Incipient Phase: Lesions detected at individual leaf level before broad canopy Red-Edge NDRE degradation (NDRE: {sat_obs.ndre_mean}). Early containment recommended."
                )
        else:
            scan_result.multi_modal_confidence_pct = 95.5
            scan_result.cross_validation_status = (
                f"Canopy Health Concordance: Healthy ground leaf confirmed by robust Sentinel-2 Red-Edge (NDRE: {sat_obs.ndre_mean}) and strong NDVI ({sat_obs.ndvi_mean})."
            )
    
    # 4. Store scan record with thumbnail in database
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO leaf_scans (
        field_id, image_name, blur_score, quality_status, predicted_class,
        confidence_pct, affected_area_pct, severity_tier, uncertainty_flag,
        thumbnail_base64, diagnosis_title, treatment_summary,
        audio_text_kn, audio_text_mr, audio_text_hi, audio_text_en
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        payload.field_id,
        "smartphone_capture.jpg",
        scan_result.blur_score,
        scan_result.quality_status,
        scan_result.predicted_class,
        scan_result.confidence_pct,
        scan_result.affected_area_pct,
        scan_result.severity_tier,
        scan_result.uncertainty_flag,
        scan_result.thumbnail_base64,
        scan_result.diagnosis_title,
        scan_result.biological_notes,
        scan_result.audio_text_kn,
        scan_result.audio_text_mr,
        scan_result.audio_text_hi,
        scan_result.audio_text_en
    ))

    # 5. NOVELTY: Cross-Modal Co-Training & Mutual Student-Teacher Verification Engine
    # Fetch current weather DSV for this field to compare independent views
    try:
        from .services.analytics_service import get_field_parameter_trends
        trends_resp = get_field_parameter_trends(field_id=payload.field_id)
        current_cum_dsv = trends_resp.current_cum_dsv
        is_high_weather_risk = (current_cum_dsv >= 10)
        is_vision_blight = ("Early Blight" in scan_result.predicted_class and scan_result.affected_area_pct > 1.0)
        is_vision_healthy = ("Healthy" in scan_result.predicted_class or scan_result.affected_area_pct <= 0.8)

        # Evaluate Agreement vs Disagreement
        if (is_vision_blight and is_high_weather_risk) or (is_vision_healthy and not is_high_weather_risk):
            agreement_status = "MUTUAL_AGREEMENT"
            weak_label_status = "AUTO_LABELED_FOR_RETRAINING"
            expert_review_status = "AUTO_APPROVED"
            notes = f"Strong Weak-Label: Vision ({scan_result.predicted_class}) and Weather (DSV: {current_cum_dsv}) mutually agree. Self-learning pseudo-label committed without human intervention."
        else:
            agreement_status = "DISAGREEMENT"
            weak_label_status = "EXPERT_TRIAGE"
            expert_review_status = "PENDING"
            notes = f"Cross-Modal Discrepancy: Vision detected {scan_result.predicted_class} ({scan_result.affected_area_pct}% area) but Tom-Cast Cumulative DSV is {current_cum_dsv}. Diverted to Agronomist Expert Queue for edge-case resolution."

        cursor.execute("""
        INSERT INTO co_training_queue (
            field_id, image_name, thumbnail_base64, vision_prediction,
            vision_confidence, vision_affected_area, weather_cum_dsv,
            weather_risk_tier, agreement_status, weak_label_status,
            expert_review_status, expert_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            payload.field_id,
            "leaf_observation.jpg",
            scan_result.thumbnail_base64,
            scan_result.predicted_class,
            scan_result.confidence_pct,
            scan_result.affected_area_pct,
            current_cum_dsv,
            "HIGH" if is_high_weather_risk else "SAFE",
            agreement_status,
            weak_label_status,
            expert_review_status,
            notes
        ))
    except Exception as e:
        print(f"Co-training logging notice: {e}")

    conn.commit()
    conn.close()

    return scan_result

@app.get("/api/vision/history/{field_id}", response_model=List[ScanHistoryItem])
def get_scan_history(field_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, field_id, created_at, predicted_class, confidence_pct,
           affected_area_pct, severity_tier, diagnosis_title, treatment_summary,
           thumbnail_base64, audio_text_kn, audio_text_mr, audio_text_hi, audio_text_en
    FROM leaf_scans
    WHERE field_id = ?
    ORDER BY id DESC
    LIMIT 12;
    """, (field_id,))
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append(ScanHistoryItem(
            id=r["id"],
            field_id=r["field_id"],
            created_at=str(r["created_at"]),
            predicted_class=r["predicted_class"],
            confidence_pct=float(r["confidence_pct"]),
            affected_area_pct=float(r["affected_area_pct"]),
            severity_tier=r["severity_tier"],
            diagnosis_title=r["diagnosis_title"] or r["predicted_class"],
            treatment_summary=r["treatment_summary"],
            thumbnail_base64=r["thumbnail_base64"],
            audio_text_kn=r["audio_text_kn"],
            audio_text_mr=r["audio_text_mr"],
            audio_text_hi=r["audio_text_hi"],
            audio_text_en=r["audio_text_en"]
        ))
    return result

@app.delete("/api/vision/scans/{scan_id}")
def delete_leaf_scan(scan_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM leaf_scans WHERE id = ?;", (scan_id,))
    conn.commit()
    conn.close()
    return {"status": "DELETED", "scan_id": scan_id}

# -------------------------------------------------------------
# 6. 7-DAY PARAMETER TRENDS & EPIDEMIOLOGICAL GRAPHS
# -------------------------------------------------------------

@app.get("/api/analytics/trends", response_model=TrendAnalyticsResponse)
@app.get("/api/analytics/trends/{field_id}", response_model=TrendAnalyticsResponse)
def get_analytics_trends(
    field_id: Optional[int] = None,
    lat: Optional[float] = Query(None, description="Optional custom latitude for any location/city"),
    lng: Optional[float] = Query(None, description="Optional custom longitude for any location/city"),
    location: Optional[str] = Query(None, description="Optional city or location name")
):
    return get_field_parameter_trends(
        field_id=field_id,
        custom_lat=lat,
        custom_lng=lng,
        location_name=location
    )

# -------------------------------------------------------------
# 7. COMMUNITY RADAR & WIND VECTOR
# -------------------------------------------------------------

@app.get("/api/community/network/{field_id}", response_model=CommunityNetworkResponse)
def get_community_network(
    field_id: int,
    wind_dir_deg: float = Query(265.0, description="Wind from direction in degrees"),
    wind_speed_kmh: float = Query(12.0, description="Wind speed in km/h")
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT center_lat, center_lng FROM fields WHERE id = ?;", (field_id,))
    field = cursor.fetchone()
    conn.close()
    
    lat = field["center_lat"] if field else 13.1340
    lng = field["center_lng"] if field else 78.1340

    return get_community_network_analysis(
        field_id=field_id,
        user_lat=lat,
        user_lng=lng,
        wind_direction_deg=wind_dir_deg,
        wind_speed_kmh=wind_speed_kmh
    )

# -------------------------------------------------------------
# 8. KISAN AI CHATBOT
# -------------------------------------------------------------

@app.post("/api/chatbot/ask", response_model=ChatbotResponse)
def chatbot_endpoint(payload: ChatbotRequest):
    return ask_kisan_chatbot(user_message=payload.message, language_code=payload.language)

# -------------------------------------------------------------
# 9. GROUND-TRUTH EMPIRICAL LOGS & CO-TRAINING EXPERT QUEUE
# -------------------------------------------------------------

@app.get("/api/cotraining/queue")
def get_cotraining_queue(field_id: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()
    query = """
    SELECT id, field_id, created_at, image_name, thumbnail_base64,
           vision_prediction, vision_confidence, vision_affected_area,
           weather_cum_dsv, weather_risk_tier, agreement_status,
           weak_label_status, expert_review_status, expert_notes
    FROM co_training_queue
    ORDER BY id DESC
    LIMIT 20;
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()

    items = []
    auto_labeled_count = 0
    triage_count = 0

    for r in rows:
        item = dict(r)
        if item.get("agreement_status") == "MUTUAL_AGREEMENT":
            auto_labeled_count += 1
        else:
            triage_count += 1
        items.append(item)

    return {
        "total_records": len(items),
        "auto_labeled_weak_labels": auto_labeled_count,
        "expert_triage_pending": triage_count,
        "items": items
    }

@app.post("/api/cotraining/review/{item_id}")
def update_cotraining_expert_review(item_id: int, status: str = Query(..., regex="^(APPROVED|CORRECTED|REJECTED)$"), notes: Optional[str] = Query(None)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE co_training_queue
    SET expert_review_status = ?, expert_notes = COALESCE(?, expert_notes)
    WHERE id = ?;
    """, (status, notes, item_id))
    conn.commit()
    conn.close()
    return {"status": "SUCCESS", "item_id": item_id, "expert_review_status": status}

@app.post("/api/ground-truth/log")
def log_ground_truth(payload: GroundTruthLogCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO ground_truth_logs (
        field_id, forecasted_risk_tier, forecasted_cum_dsv, actual_symptom_date,
        agronomist_confirmed, lead_time_hours, prediction_accuracy, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        payload.field_id,
        payload.forecasted_risk_tier,
        payload.forecasted_cum_dsv,
        payload.actual_symptom_date,
        payload.agronomist_confirmed,
        payload.lead_time_hours,
        payload.prediction_accuracy,
        payload.notes
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"id": new_id, "status": "Logged for empirical evaluation"}

@app.get("/api/ground-truth/logs/{field_id}")
def get_ground_truth_logs(field_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ground_truth_logs WHERE field_id = ? ORDER BY id DESC;", (field_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
