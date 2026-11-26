"""
AGROSHIELD AI - Database Layer
==============================
Zero-dependency, portable SQLite database layer using Python standard library sqlite3.
Stores users, fields, weather observations, satellite observations, leaf scans with thumbnails,
community outbreaks, and ground-truth validation logs.
"""

import sqlite3
import os
import json

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "agroshield.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        state_district TEXT DEFAULT 'Kolar, Karnataka',
        language_pref TEXT DEFAULT 'kn',
        latitude REAL DEFAULT 13.1339,
        longitude REAL DEFAULT 78.1340,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Fields / Farms Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        field_name TEXT NOT NULL,
        boundary_geojson TEXT NOT NULL,
        center_lat REAL NOT NULL,
        center_lng REAL NOT NULL,
        area_acres REAL DEFAULT 1.2,
        crop_type TEXT DEFAULT 'Tomato',
        tomato_variety TEXT DEFAULT 'Arka Rakshak (ICAR-IIHR Hybrid)',
        planting_date TEXT DEFAULT '15 Oct 2026',
        irrigation_type TEXT DEFAULT 'Drip Lateral System',
        soil_type TEXT DEFAULT 'Red Sandy Loam',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    # 3. Weather Records & Tom-Cast Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weather_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_id INTEGER,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        temp_c REAL NOT NULL,
        humidity_pct REAL NOT NULL,
        dew_point_c REAL NOT NULL,
        rain_mm REAL DEFAULT 0.0,
        irrigation_type TEXT DEFAULT 'Drip',
        estimated_wet_hours REAL DEFAULT 0.0,
        dsv_value INTEGER DEFAULT 0,
        cum_5day_dsv INTEGER DEFAULT 0,
        risk_tier TEXT DEFAULT 'LOW',
        source_info TEXT,
        FOREIGN KEY (field_id) REFERENCES fields(id)
    );
    """)

    # 4. Satellite Observations (Auxiliary Canopy Vigor)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS satellite_observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_id INTEGER,
        observation_date TEXT NOT NULL,
        ndvi_mean REAL,
        ndre_mean REAL,
        canopy_stress_pct REAL DEFAULT 0.0,
        cloud_cover_pct REAL DEFAULT 0.0,
        is_cloud_fallback BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'VALID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (field_id) REFERENCES fields(id)
    );
    """)

    # 5. Quality-Gated Leaf Scans Table with 7-Day History & Thumbnails
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS leaf_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        image_name TEXT NOT NULL,
        blur_score REAL NOT NULL,
        quality_status TEXT NOT NULL,
        predicted_class TEXT NOT NULL,
        confidence_pct REAL NOT NULL,
        affected_area_pct REAL DEFAULT 0.0,
        severity_tier TEXT DEFAULT 'None',
        uncertainty_flag BOOLEAN DEFAULT 0,
        thumbnail_base64 TEXT,
        diagnosis_title TEXT,
        treatment_summary TEXT,
        audio_text_kn TEXT,
        audio_text_mr TEXT,
        audio_text_hi TEXT,
        audio_text_en TEXT,
        FOREIGN KEY (field_id) REFERENCES fields(id)
    );
    """)

    # 6. Community Outbreak Reports Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS community_outbreaks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reported_by_user_id INTEGER,
        jittered_lat REAL NOT NULL,
        jittered_lng REAL NOT NULL,
        disease_name TEXT DEFAULT 'Tomato Early Blight',
        severity TEXT DEFAULT 'Moderate',
        verification_status TEXT DEFAULT 'VERIFIED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
    );
    """)

    # 7. Ground-Truth Empirical Validation Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ground_truth_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_id INTEGER,
        alert_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        forecasted_risk_tier TEXT NOT NULL,
        forecasted_cum_dsv INTEGER NOT NULL,
        actual_symptom_date TEXT,
        agronomist_confirmed TEXT DEFAULT 'Pending',
        lead_time_hours REAL,
        prediction_accuracy TEXT DEFAULT 'Pending',
        notes TEXT,
        FOREIGN KEY (field_id) REFERENCES fields(id)
    );
    """)

    # 8. Cross-Modal Co-Training & Agronomist Expert Queue Table
    # Stores mutual agreement pseudo-labels and disagreement expert triage
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS co_training_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        image_name TEXT,
        thumbnail_base64 TEXT,
        vision_prediction TEXT,
        vision_confidence REAL,
        vision_affected_area REAL,
        weather_cum_dsv INTEGER,
        weather_risk_tier TEXT,
        agreement_status TEXT, -- 'MUTUAL_AGREEMENT' or 'DISAGREEMENT'
        weak_label_status TEXT, -- 'AUTO_LABELED_FOR_RETRAINING' or 'EXPERT_TRIAGE'
        expert_review_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'CORRECTED'
        expert_notes TEXT,
        FOREIGN KEY (field_id) REFERENCES fields(id)
    );
    """)

    # Run safe column additions for backward-compatibility
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN state_district TEXT DEFAULT 'Kolar, Karnataka';")
    except sqlite3.OperationalError:
        pass

    for col, col_type in [
        ("state_district", "TEXT DEFAULT 'Kolar, Karnataka'"),
        ("irrigation_type", "TEXT DEFAULT 'Drip Lateral System'"),
        ("soil_type", "TEXT DEFAULT 'Red Sandy Loam'"),
    ]:
        try:
            cursor.execute(f"ALTER TABLE fields ADD COLUMN {col} {col_type};")
        except sqlite3.OperationalError:
            pass

    for col, col_type in [
        ("thumbnail_base64", "TEXT"),
        ("diagnosis_title", "TEXT"),
        ("treatment_summary", "TEXT"),
        ("audio_text_kn", "TEXT"),
        ("audio_text_mr", "TEXT"),
        ("audio_text_hi", "TEXT"),
        ("audio_text_en", "TEXT"),
    ]:
        try:
            cursor.execute(f"ALTER TABLE leaf_scans ADD COLUMN {col} {col_type};")
        except sqlite3.OperationalError:
            pass

    conn.commit()

    # Seed demo user & fields if empty
    cursor.execute("SELECT COUNT(*) FROM users;")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO users (id, phone, name, state_district, language_pref, latitude, longitude)
        VALUES (1, '9876543210', 'Ramesh Kumar (ರಮೇಶ್ ಕುಮಾರ್)', 'Kolar, Karnataka', 'kn', 13.1339, 78.1340);
        """)
        
        default_boundary = json.dumps([
            [13.1328, 78.1325],
            [13.1328, 78.1358],
            [13.1354, 78.1356],
            [13.1353, 78.1326]
        ])

        cursor.execute("""
        INSERT INTO fields (id, user_id, field_name, boundary_geojson, center_lat, center_lng, area_acres, tomato_variety, planting_date, irrigation_type, soil_type)
        VALUES (1, 1, 'Kolar North Tomato Plot #1', ?, 13.1339, 78.1340, 1.2, 'Arka Rakshak (ICAR-IIHR Hybrid)', '15 Oct 2026', 'Drip Lateral System', 'Red Sandy Loam');
        """, (default_boundary,))

        second_boundary = json.dumps([
            [13.1410, 78.1400],
            [13.1410, 78.1430],
            [13.1435, 78.1428],
            [13.1435, 78.1402]
        ])

        cursor.execute("""
        INSERT INTO fields (id, user_id, field_name, boundary_geojson, center_lat, center_lng, area_acres, tomato_variety, planting_date, irrigation_type, soil_type)
        VALUES (2, 1, 'Kolar South Nursery Plot #2', ?, 13.1420, 78.1415, 0.8, 'Arka Vikas (High-Yield Hybrid)', '01 Nov 2026', 'Sprinkler & Foliar', 'Clay Loam');
        """, (second_boundary,))

        # Seed initial 7-day scan history for Field 1
        historical_scans = [
            ("2026-11-19 09:15:00", "Healthy Tomato Leaf", 96.2, 0.4, "None", "Healthy Leaf - No Inoculum", "Routine check: healthy green foliar canopy. Zero lesions."),
            ("2026-11-21 08:30:00", "Healthy Tomato Leaf", 94.0, 0.8, "None", "Healthy Leaf - Early Stage", "Lower leaves inspected after morning dew. Healthy tissue."),
            ("2026-11-23 10:45:00", "Tomato Early Blight (Alternaria solani)", 88.5, 3.2, "Mild", "Early Blight Detected - Mild (3.2% Area)", "Isolated brown pinpoint lesion observed on lowest leaf touching drip line."),
            ("2026-11-24 07:40:00", "Tomato Early Blight (Alternaria solani)", 92.4, 7.8, "Mild", "Early Blight Detected - Mild (7.8% Area)", "Concentric target ring visible with yellow halo. CIBRC Mancozeb recommended."),
            ("2026-11-25 08:10:00", "Tomato Early Blight (Alternaria solani)", 93.8, 11.5, "Moderate", "Early Blight Detected - Moderate (11.5% Area)", "Concentric necrotic rings expanding. Immediate backpack spray advised.")
        ]

        for s_date, p_class, conf, area, sev, title, notes in historical_scans:
            cursor.execute("""
            INSERT INTO leaf_scans (
                field_id, created_at, image_name, blur_score, quality_status, predicted_class,
                confidence_pct, affected_area_pct, severity_tier, uncertainty_flag,
                diagnosis_title, treatment_summary,
                audio_text_kn, audio_text_mr, audio_text_hi, audio_text_en
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                1, s_date, "historical_leaf.jpg", 142.5, "ACCEPTED", p_class,
                conf, area, sev, 0,
                title, notes,
                "ಆರಂಭಿಕ ಬ್ಲೈಟ್ ಮುನ್ಸೂಚನೆ ದಾಖಲಾಗಿದೆ. ಮ್ಯಾಂಕೋಜೆಬ್ ಸಿಂಪಡಣೆ ಮಾಡಿ.",
                "अर्ली ब्लाइट अंदाज नोंदवला गेला आहे. मँकोझेब फवारणी करा.",
                "अगेती झुलसा का पूर्वानुमान दर्ज है। मैंकोज़ेब का छिड़काव करें।",
                f"Diagnostic record logged: {title}. Apply approved Mancozeb 75% WP."
            ))

        conn.commit()

    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)
