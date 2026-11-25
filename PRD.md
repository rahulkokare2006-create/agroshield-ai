# PRODUCT REQUIREMENT DOCUMENT (PRD)

## AGROSHIELD AI: Predictive Crop Health Intelligence & Early Disease Warning Platform

* **Document Version:** 2.0.0 (Post-Review Defensible Baseline)
* **Status:** Approved for Implementation
* **Initial Crop Focus:** Tomato (*Solanum lycopersicum*)
* **Initial Pathogen Focus:** Tomato Early Blight (*Alternaria solani*)
* **Target Audience:** Smallholder farmers, Farmer Producer Organizations (FPOs), Agricultural Extension Workers
* **Primary Languages:** Kannada (ಕನ್ನಡ), Marathi (मराठी), Hindi (हिंदी), English

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
Smallholder tomato farmers face severe economic vulnerability, losing 30% to 40% of their harvest annually to fungal pathogens, primarily Tomato Early Blight (*Alternaria solani*). 

Current market solutions suffer from two fatal flaws:
1. **Hardware Dependence:** In-field physical sensor rigs (capacitive leaf wetness grids, automated weather stations) cost ₹25,000–₹80,000 per acre, suffer from battery decay and sensor corrosion, and are economically unviable for the 86% of farmers operating on less than 2 acres.
2. **Reactive Autopsy Tools:** Existing smartphone applications diagnose diseases only *after* severe visible lesions and tissue necrosis appear. At this stage, mycelium has colonized internal vascular tissue, airborne conidia have contaminated adjacent plots, and chemical intervention is expensive, toxic, and largely ineffective.

### 1.2 The Solution
**AGROSHIELD AI** is a 100% software-only agricultural intelligence platform engineered to move from *reactive diagnosis* to **predictive, microclimate-driven infection-risk forecasting and quality-gated smartphone diagnostics**.

By synthesizing:
1. High-resolution meteorological data into the peer-reviewed **Tom-Cast / FAST epidemiological model**,
2. Auxiliary **Sentinel-2 multispectral satellite canopy monitoring** (with strict cloud-cover fallback protocols),
3. **OpenCV quality-gated macro smartphone leaf vision** (with uncertainty and nutrient chlorosis distinction),
4. A **participatory community disease reporting network** with local wind direction proximity,
5. A **grounded, voice-first Kisan Tomato AI Chatbot** (voice-in and voice-out in Kannada, Marathi, Hindi, and English),

AGROSHIELD empowers smallholder farmers to take verified, low-cost preventive actions *before* irreversible crop damage occurs—using only the standard smartphone they already own.

---

## 2. Core Product Principles & Scientific Integrity Rules

To maintain absolute scientific credibility before agronomists and hackathon evaluation panels, the system enforces the following non-negotiable rules:

1. **Risk Forecasting vs. Confirmed Disease:** The system shall never report environmental risk as confirmed infection. Risk predictions must be explicitly labeled as *"Weather-Driven Infection-Risk Conditions: Low / Moderate / High"*.
2. **Transparent Data Provenance:** When displaying meteorological forecasts, the system must display the data source (Open-Meteo), model timestamp, coordinates, distance to farm, and an explicit *"Estimated Canopy Wetness"* tag.
3. **Satellite Realism:** Sentinel-2 Band 5 (Red-Edge 705nm) is specified at its true 20m resolution ($400\text{ m}^2$). Satellite observation is strictly an auxiliary field canopy vigor monitor, never a primary pathogen diagnostic. The platform must remain 100% functional when satellite imagery is cloud-blocked.
4. **Quality-Gated Vision & Uncertainty:** The computer vision pipeline must reject blurry or overexposed photos. When symptoms lack characteristic concentric target rings (e.g. uniform chlorosis), the model must output *"Uncertain / Possible Nutrient Deficiency"*, recommending field inspection rather than forcing a false positive.
5. **No Hallucinated Dosages:** Chemical and biological recommendations must be pulled from verified ICAR-IIHR and CIBRC registered label packages of practices with Pre-Harvest Intervals (PHI) and safety gear requirements. Generative AI models are strictly prohibited from inventing arbitrary chemical recipes.

---

## 3. User Personas & Core Workflows

### 3.1 Personas
* **Primary: Smallholder Tomato Farmer (e.g., Ramesh, Kolar, Karnataka)**
  * Farm size: 0.5 to 2 acres of trellis/drip-irrigated tomato.
  * Literacy: Limited English reading; comfortable with spoken Kannada and visual smartphone icons.
  * Goal: Know when weather favors fungal outbreaks, understand leaf symptoms, and receive safe, affordable spray instructions without complex math.
* **Secondary: FPO Extension Agent / Agronomist**
  * Role: Oversees 200–500 member farm plots in a taluk/block.
  * Goal: Monitor regional disease pressure, verify farmer sighting reports, and benchmark model predictions against ground truth.

### 3.2 End-to-End User Story (The Core Workflow)
1. **Registration & Plot Mapping:** Farmer registers phone number, selects language (or lets GPS auto-detect Kannada), and marks their plot boundary on an interactive satellite base map.
2. **Daily Microclimate Risk Assessment:** System fetches hourly forecast data, runs the Tom-Cast leaf wetness algorithm, and displays the daily/cumulative infection risk score with voice read-out.
3. **Field Observation & Scan:** When the risk score increases or an unusual symptom is noticed, the farmer is guided to photograph the lower leaf underside.
4. **Quality-Gated Diagnosis:** The vision engine validates image clarity. If clear, it outputs symptom classification (Healthy vs. Early Blight vs. Uncertain) with visual lesion localization.
5. **Actionable Spoken Advisory:** Farmer listens to audio instructions detailing cultural pruning steps and verified ICAR-approved preventive bio-shields (e.g., *Trichoderma* / Mancozeb @ 2.0g/L).
6. **Conversational Support:** Farmer speaks a follow-up question into the Kisan Tomato AI Chatbot (*"Can I spray during hot afternoons?"*) and hears a natural audio response grounded in tomato agronomy.

---

## 4. Functional Specifications & Modules

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AGROSHIELD AI ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────────────┤
│                       1. REGISTRATION & FARM SETUP                     │
│                  GPS Geolocation | Field Boundary GeoJSON              │
├──────────────────────────────────┬─────────────────────────────────────┤
│ 2. MICROCLIMATE RISK ENGINE      │ 3. SATELLITE CANOPY MONITOR (AUX)   │
│ • Open-Meteo Hourly Stream       │ • Sentinel-2 NDRE (20m) & NDVI      │
│ • Dew-Point Depression Model     │ • Cloud Cover Filtering (<20%)      │
│ • Tom-Cast DSV Matrix (0 to 4)   │ • Fail-Safe Fallback State Machine  │
├──────────────────────────────────┼─────────────────────────────────────┤
│ 4. QUALITY-GATED CV ENGINE       │ 5. COMMUNITY REPORTING NETWORK      │
│ • OpenCV Blur & Glare Filter     │ • Verified Neighbor Outbreak Pins   │
│ • Early Blight vs Nutrient Check │ • Wind Vector Proximity Warning     │
│ • Affected Area Severity Score   │ • Location Privacy Jittering        │
├──────────────────────────────────┴─────────────────────────────────────┤
│                 6. UNIFIED THREAT FUSION CORE (UCIIS)                  │
│               Dynamic Bayesian Weighting & Explainability              │
├────────────────────────────────────────────────────────────────────────┤
│ 7. ACTIONABLE ADVISORY & VOICE   │ 8. KISAN TOMATO AI CHATBOT          │
│ • Kannada, Marathi, Hindi, EN    │ • Voice-In (Speech-to-Text)         │
│ • Text-to-Speech (TTS) on Cards  │ • Voice-Out (Text-to-Speech)        │
│ • CIBRC Registered IPM Protocols │ • Grounded ICAR Tomato Knowledge    │
├──────────────────────────────────┴─────────────────────────────────────┤
│ 9. EMPIRICAL GROUND-TRUTH LOGGING (Scientific Field Trial Protocol)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Module 1: Microclimate & Tom-Cast Early Disease-Risk Engine

#### Mathematical Foundations
1. **Dew-Point Depression:** $\Delta T_{dp} = T_a - T_{dp}$
2. **Canopy Wetness Determination ($\text{IsWet}_t$):**
   $$\text{IsWet}_t = \begin{cases} 1 & \text{if } \Delta T_{dp} \le 1.8^\circ\text{C} \text{ or } RH \ge 88\% \text{ or } P \ge 0.1\text{ mm} \text{ or } \text{Irrigation} = \text{"Foliar"} \\ 0 & \text{otherwise} \end{cases}$$
3. **Evaporative Drying Delay ($VPD$):** Free water residence time calculated via vapor pressure deficit ($VPD < 0.5\text{ kPa}$ delays drying by up to 4 hours).
4. **Tom-Cast Daily Severity Values (DSV Matrix):**

| Mean Temp during Wet Hours ($\bar{T}$) | DSV = 0 | DSV = 1 | DSV = 2 | DSV = 3 | DSV = 4 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **$13^\circ\text{C} - 17^\circ\text{C}$** | $0 - 6\text{ h}$ | $7 - 15\text{ h}$ | $16 - 20\text{ h}$ | $21 - 24\text{ h}$ | $> 24\text{ h}$ |
| **$18^\circ\text{C} - 20^\circ\text{C}$** | $0 - 3\text{ h}$ | $4 - 8\text{ h}$ | $9 - 15\text{ h}$ | $16 - 22\text{ h}$ | $> 22\text{ h}$ |
| **$21^\circ\text{C} - 25^\circ\text{C}$ (Optimum)**| $0 - 2\text{ h}$ | $3 - 5\text{ h}$ | $6 - 12\text{ h}$ | $13 - 20\text{ h}$ | $> 20\text{ h}$ |
| **$26^\circ\text{C} - 29^\circ\text{C}$** | $0 - 3\text{ h}$ | $4 - 8\text{ h}$ | $9 - 15\text{ h}$ | $16 - 22\text{ h}$ | $> 22\text{ h}$ |

* **Output Thresholds:**
  * Cumulative 5-day $\text{DSV} < 10$: **LOW INFECTION RISK**
  * Cumulative 5-day $10 \le \text{DSV} \le 14$: **MODERATE RISK (Preventive Bio-Shield Advisory)**
  * Cumulative 5-day $\text{DSV} \ge 15$: **HIGH INFECTION RISK (Actionable Intervention Required)**

---

### Module 2: Auxiliary Satellite Canopy Vigor Monitoring (Sentinel-2)

#### Specifications & Cloud Fallback
* **Bands Ingested:** Band 4 (Red 665nm, 10m), Band 8 (NIR 842nm, 10m), Band 5 (Red-Edge 705nm, 20m).
* **Indices Computed:**
  $$\text{NDVI} = \frac{\text{B08} - \text{B04}}{\text{B08} + \text{B04} + 10^{-6}}, \quad \text{NDRE} = \frac{\text{B08} - \text{B05}}{\text{B08} + \text{B05} + 10^{-6}}$$
* **Cloud Fallback Protocol:**
  * When cloud cover over the bounding box is $\ge 20\%$, the system:
    1. Caches and displays the latest clear observation,
    2. Overlays a warning banner: *"Live satellite observation obscured by clouds (72% cover). Displaying clean pass from [Date]. System operating on weather and camera modes."*
    3. Rescales the fusion engine weights so the app remains 100% operational.

---

### Module 3: Quality-Gated Computer Vision & Leaf Diagnostics

#### The Vision Pipeline
1. **Pre-Inference Quality Gate (OpenCV):**
   * Blur Detection: Computes Laplacian variance $\sigma^2(\nabla^2 I)$. If $\sigma^2 < 80.0$, reject upload with error *"Image too blurry. Hold phone steady 15 cm from leaf."*
   * Exposure Check: Evaluates mean intensity. Rejects if mean $< 40$ (underexposed) or $> 225$ (washed out glare).
2. **Preprocessing:**
   * Converts image to CIE-Lab color space. Evaluates the $b^*$ channel (Yellow-Blue opponent axis) to highlight chlorotic halos.
3. **Classification & Symptom Localisation:**
   * Backbone: PyTorch MobileNetV3 / ResNet-50 trained on combined PlantVillage and PlantDoc field samples.
   * Classes: `Healthy Tomato Leaf`, `Tomato Early Blight (Alternaria solani)`, `Late Blight`, `Uncertain / Probable Nutrient Chlorosis`.
4. **Explainability:** Generates contour boundary around detected lesions and computes affected surface area percentage ($0\% - 100\%$).

---

### Module 4: Community Disease Reporting Network

#### Specifications
* **Reporting Workflow:** Farmers can submit geotagged sightings with photo proof.
* **Verification States:**
  * `UNVERIFIED`: Sighting submitted by farmer; awaiting image verification or agronomist review.
  * `VERIFIED`: Confirmed by vision model confidence $> 85\%$ or extension officer approval.
* **Wind Vector Analysis:**
  * Ingests Open-Meteo wind speed ($v$) and direction ($\theta$).
  * Calculates bearing angle between reported outbreak and user field.
  * If verified outbreak is within $0.5\text{ km} - 5.0\text{ km}$ and sits in the upwind dispersal cone ($\pm 45^\circ$), triggers a **"Community Upwind Inoculum Advisory"**.
* **Farmer Privacy:** Exact farm coordinates are jittered randomly within a $500\text{m}$ radius to protect property privacy.

---

### Module 5: Grounded Kisan Tomato AI Chatbot

#### Specifications
* **Modalities:** Voice-In (Web Speech recognition) + Voice-Out (SpeechSynthesis) + Interactive Chat text.
* **Grounding & Guardrails:**
  * The chatbot references a curated JSON knowledge base built from **ICAR-IIHR Tomato Packages of Practices**.
  * Covers:
    1. Tomato varieties (Arka Rakshak, Saaho, Abhinav).
    2. Nursery management, spacing ($60\text{ cm} \times 45\text{ cm}$), bamboo trellising.
    3. Cultural sucker pruning (clearing lower $20\text{ cm}$ to enhance canopy airflow).
    4. Sucking pest management (Whitefly vector for Leaf Curl virus).
    5. Nutrient deficiencies (Blossom End Rot vs. Early Blight).
  * **Strict Constraint:** When asked for chemical recommendations, the chatbot must only pull approved CIBRC entries and state: *"Consult your local extension officer for prescription confirmation."*

---

### Module 6: Actionable Farmer Guidance & Audio Voice Engine

#### Prescriptive Guidelines (ICAR / CIBRC Aligned)
* **Preventive Phase (Tom-Cast DSV $\ge 10$ or Upwind Community Alert):**
  * *Cultural:* Prune the 2 lowest leaves touching the soil; ensure furrow drainage.
  * *Biological / Organic:* Spray *Trichoderma viride* ($5\text{ g/L}$) or Neem Oil 10,000 ppm ($3\text{ ml/L}$).
* **Curative Phase (Confirmed Early Blight on Leaf):**
  * *Chemical Contact:* **Mancozeb 75% WP** at approved dose of **$2.0 - 2.5\text{ g/L}$** ($30 - 37.5\text{ g}$ in a 15-litre backpack pump).
  * *Safety / PHI:* Minimum 5-day Pre-Harvest Interval before picking fruit. Mandatory mask and rubber gloves.
* **Audio Voice Output:** Every card possesses a Speaker Icon (🔊) that converts English agronomic text into natural spoken Kannada, Marathi, or Hindi using the browser's speech synthesis engine.

---

### Module 7: Ground-Truth Empirical Validation Logging

To prove the 48-hour forecasting hypothesis over real-world farm seasons, the database includes a `ground_truth_logs` table:
* Captures: `field_id`, `forecasted_dsv`, `prediction_date`, `farmer_scan_date`, `agronomist_verified_status`, `actual_symptom_appearance_date`, `true_positive_flag`.
* Automatically calculates warning lead time ($t_{\text{symptom}} - t_{\text{alert}}$), False Alarm Rate (FAR), and Missed Outbreak Rate.

---

## 5. Technology Stack & Implementation Architecture

```
Frontend:
├── React 19 + TypeScript (Strict Type Safety)
├── Tailwind CSS v4 (Responsive Agricultural UI)
├── Leaflet + React-Leaflet (Interactive GIS & Boundary Drawing)
├── Recharts (Microclimate & 72-Hour Tom-Cast DSV Visualizer)
├── Lucide React (Clean Icons)
└── Web Speech API (SpeechSynthesis & SpeechRecognition)

Backend:
├── Python 3.11+ with FastAPI (Asynchronous High-Performance API)
├── Pydantic v2 (Strict Data Validation & Provenance Schemas)
├── SQLAlchemy 2.0 ORM (Async Data Layer)
├── SQLite (agroshield.db - 100% Zero-Setup Portable Hackathon Database)
├── OpenCV (cv2) + NumPy (Image Quality Gate, CLAHE, Color Spaces)
├── PyTorch / Torchvision (Computer Vision Model Inference)
└── HTTPX (Async Weather & Satellite STAC Ingestion)
```

---

## 6. Database Schema (SQLite / SQLAlchemy)

The system relies on 7 core relational tables:
1. `users`: ID, phone, name, preferred language (`kn`, `mr`, `hi`, `en`), center coordinates.
2. `fields`: ID, user_id, field_name, boundary_geojson, acreage, planting_date, tomato_variety.
3. `weather_observations`: ID, field_id, timestamp, temp_c, rh_pct, dew_point_c, rain_mm, estimated_wet_hours, daily_dsv, cum_5day_dsv, source_station, freshness_ts.
4. `satellite_observations`: ID, field_id, pass_date, ndvi_mean, ndre_mean, cloud_cover_pct, is_cloud_fallback.
5. `leaf_scans`: ID, field_id, created_at, image_path, blur_score, quality_passed, predicted_class, confidence_score, affected_area_pct, uncertainty_flag.
6. `community_outbreaks`: ID, reporter_id, jittered_lat, jittered_lng, disease_type, status (`UNVERIFIED` / `VERIFIED`), created_at.
7. `ground_truth_logs`: ID, field_id, alert_timestamp, predicted_risk_tier, symptom_observed_date, agronomist_confirmation, is_correct.

---

## 7. Hackathon Evaluation Verification Matrix

| Evaluation Criteria | Target Metric | How It Is Demonstrated |
| :--- | :--- | :--- |
| **Scientific Defensibility** | Tom-Cast & EDPD model | Live calculation showing Dew Point Depression, LWD, and DSV values for any Indian coordinate. |
| **Transparency** | Zero fabricated data | Every weather view shows data source, timestamp, distance, and *"Estimated"* label. |
| **Satellite Reality** | 20m Red-Edge accuracy | Sentinel-2 Band 5 correctly specified; cloud fallback demonstrated by simulating overcast scene. |
| **Vision Reliability** | Quality-gated inference | Live demo rejecting a blurry photo; showing uncertain nutrient chlorosis vs target rings. |
| **Farmer Usability** | 2–3 clicks to action | Complete voice-enabled flow in Kannada with audio read-out and CIBRC safety guidance. |
| **Kisan Chatbot** | Zero hallucinated chemicals | Voice Q&A answering tomato cultivation questions directly from ICAR-IIHR knowledge base. |

---

*This PRD represents the complete, approved, and defensible architectural blueprint for AGROSHIELD AI. All features specified herein are ready for immediate implementation.*
