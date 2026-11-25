"""
AGROSHIELD AI - End-to-End Automated Test Suite
===============================================
Validates all backend endpoints, mathematical models, OpenCV filters,
cloud fallbacks, and database persistence.
"""

import sys
import os
import base64
import numpy as np
import cv2

# Ensure AGROSHIELD-AI root is on path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_all():
    print("==================================================")
    print("  RUNNING AGROSHIELD AI END-TO-END VERIFICATION   ")
    print("==================================================")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✓ 1. Health check passed:", res.json()["status"])

    # 2. User profile
    res = client.get("/api/user/profile")
    assert res.status_code == 200
    assert "Ramesh" in res.json()["name"]
    print("✓ 2. User profile verified:", res.json()["name"])

    # 3. Field registry
    res = client.get("/api/fields")
    assert res.status_code == 200
    fields = res.json()
    assert len(fields) >= 1
    print(f"✓ 3. Field registry verified: {len(fields)} field(s) registered.")

    # 4. Tom-Cast weather risk engine
    res = client.get("/api/weather/tomcast/1?irrigation_mode=Drip")
    assert res.status_code == 200
    w_data = res.json()
    assert "cumulative_5day_dsv" in w_data
    assert "risk_tier" in w_data
    assert "hourly_data" in w_data
    assert len(w_data["hourly_data"]) >= 24
    print(f"✓ 4. Tom-Cast weather engine passed: Risk={w_data['risk_tier']}, CumDSV={w_data['cumulative_5day_dsv']}, WetHours={w_data['hourly_continuous_wet_hours']}h")

    # 5. Satellite Canopy with Cloud Fallback verification
    # 5a. Clean pass (< 20% clouds)
    res_clean = client.get("/api/satellite/canopy/1?cloud_cover_pct=10")
    assert res_clean.status_code == 200
    assert res_clean.json()["is_cloud_fallback"] is False
    print("✓ 5a. Satellite clean pass verified: NDRE=", res_clean.json()["ndre_mean"])

    # 5b. Overcast pass (>= 20% clouds) -> Fallback triggered
    res_cloud = client.get("/api/satellite/canopy/1?cloud_cover_pct=45")
    assert res_cloud.status_code == 200
    assert res_cloud.json()["is_cloud_fallback"] is True
    print("✓ 5b. Satellite cloud-cover fallback state machine verified: Fallback Triggered!")

    # 6. Computer Vision Quality Gate & Diagnostics
    # 6a. Blurry image rejection test (flat grey -> score 0.0 < 75.0)
    flat_img = np.ones((300, 300, 3), dtype=np.uint8) * 128
    _, buf = cv2.imencode(".jpg", flat_img)
    b64_blurry = base64.b64encode(buf).decode("utf-8")
    
    res_blur = client.post("/api/vision/scan", json={"image_base64": b64_blurry, "field_id": 1})
    assert res_blur.status_code == 200
    scan_blur = res_blur.json()
    assert scan_blur["quality_passed"] is False
    assert "REJECTED" in scan_blur["quality_status"]
    print(f"✓ 6a. OpenCV Quality Gate blur rejection verified: Status={scan_blur['quality_status']}")

    # 6b. Sharp textured leaf with Early Blight lesion (Laplacian variance > 1000)
    blight_img = np.ones((400, 400, 3), dtype=np.uint8)
    blight_img[:] = [34, 197, 94]  # Green leaf
    # Add realistic leaf micro-texture
    noise = np.random.randint(-15, 15, (400, 400, 3), dtype=np.int16)
    blight_img = np.clip(blight_img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    # Draw necrotic concentric rings
    cv2.circle(blight_img, (200, 200), 50, (15, 53, 120), -1)  # Necrotic dark brown
    cv2.circle(blight_img, (200, 200), 60, (8, 179, 234), 8)   # Yellow chlorotic halo
    _, buf2 = cv2.imencode(".jpg", blight_img)
    b64_blight = base64.b64encode(buf2).decode("utf-8")

    res_diag = client.post("/api/vision/scan", json={"image_base64": b64_blight, "field_id": 1})
    assert res_diag.status_code == 200
    scan_diag = res_diag.json()
    assert scan_diag["quality_passed"] is True
    assert "Early Blight" in scan_diag["predicted_class"]
    assert scan_diag["cibrc_action"]["registered_chemical"] is not None
    print(f"✓ 6b. Early Blight diagnostic & CIBRC action verified: {scan_diag['predicted_class']} ({scan_diag['affected_area_pct']}%)")

    # 7. Community Disease Network & Wind Vector
    res_comm = client.get("/api/community/network/1?wind_dir_deg=265&wind_speed_kmh=12")
    assert res_comm.status_code == 200
    comm_data = res_comm.json()
    assert "reports" in comm_data
    assert "proximity_risk_level" in comm_data
    print(f"✓ 7. Community disease network verified: Active sightings={comm_data['total_active_reports_within_5km']}, Risk={comm_data['proximity_risk_level']}")

    # 8. Grounded Kisan Tomato AI Chatbot
    # 8a. Early Blight query in Kannada
    res_chat_kn = client.post("/api/chatbot/ask", json={"message": "ಟೊಮೇಟೊ ಆರಂಭಿಕ ಬ್ಲೈಟ್ ರೋಗಕ್ಕೆ ಏನು ಮಾಡಬೇಕು?", "language": "kn"})
    assert res_chat_kn.status_code == 200
    assert "ಮ್ಯಾಂಕೋಜೆಬ್" in res_chat_kn.json()["reply_text"]
    print("✓ 8a. Kisan Tomato Chatbot (Kannada agronomic query) verified: Mancozeb CIBRC guidance included!")

    # 8b. Flower drop query in English
    res_chat_en = client.post("/api/chatbot/ask", json={"message": "Why are my tomato flowers falling?", "language": "en"})
    assert res_chat_en.status_code == 200
    assert "Boron" in res_chat_en.json()["reply_text"]
    print("✓ 8b. Kisan Tomato Chatbot (English agronomic query) verified: Boron recommendation included!")

    # 9. Ground-Truth Empirical Logging
    res_log = client.post("/api/ground-truth/log", json={
        "field_id": 1,
        "forecasted_risk_tier": "HIGH",
        "forecasted_cum_dsv": 16,
        "actual_symptom_date": "2026-11-20",
        "agronomist_confirmed": "Dr. Sharma (KVK Kolar)",
        "lead_time_hours": 48.0,
        "prediction_accuracy": "TRUE_POSITIVE",
        "notes": "Verified in Kolar pilot trial."
    })
    assert res_log.status_code == 200
    print("✓ 9. Ground-truth empirical trial logging verified:", res_log.json()["status"])

    print("\n==================================================")
    print("  ALL 9 END-TO-END TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    test_all()
