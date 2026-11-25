# AGROSHIELD AI
## Predictive Crop Health Intelligence & Early Disease Warning Platform

> **Target Crop:** Tomato (*Solanum lycopersicum*)  
> **Target Pathogen:** Tomato Early Blight (*Alternaria solani*)  
> **Architecture:** 100% Software-Only | Zero Hardware Probes | Production Full-Stack  
> **Built for:** National-Level Agricultural AI Hackathons  

---

## 1. Quick Start Guide (How to Run)

### Option A: Double-Click Batch Launchers (Easiest)
1. Double-click `start_backend.bat` $\rightarrow$ Launches the Python FastAPI backend on `http://localhost:8000` (Interactive Swagger docs: `http://localhost:8000/docs`).
2. Double-click `start_frontend.bat` $\rightarrow$ Launches the React 19 / Vite frontend on `http://localhost:5173`.

### Option B: Terminal Command Launch
* **Start Backend:**
  ```bash
  python backend/run_server.py
  ```
* **Start Frontend:**
  ```bash
  cd frontend
  npx vite
  ```

---

## 2. Running Automated End-to-End Tests
To run the automated verification test suite verifying all 9 endpoints, OpenCV filters, cloud fallback, and Tom-Cast algorithms:
```bash
python backend/test_e2e.py
```
*(All 9 tests pass with 100% success).*

---

## 3. Project Structure

```
AGROSHIELD-AI/
├── backend/
│   ├── main.py                  # FastAPI REST API Router
│   ├── database.py              # SQLite (agroshield.db) Database Layer
│   ├── schemas.py               # Pydantic Strict Request/Response Schemas
│   ├── agroshield.db            # Portable SQLite Database
│   ├── run_server.py            # Uvicorn Backend Server Launcher
│   ├── test_e2e.py              # 9-Step Automated Verification Suite
│   └── services/
│       ├── tomcast_service.py   # Tom-Cast / FAST Epidemiological Engine (EDPD Model)
│       ├── vision_service.py    # OpenCV Blur Quality Gating & Lesion Diagnostics
│       ├── satellite_service.py # Sentinel-2 NDRE @ 20m & Cloud Fallback State Machine
│       ├── community_service.py # Participatory Disease Network & Wind Proximity Cone
│       └── chatbot_service.py   # Grounded ICAR-IIHR Tomato Agronomy Voice Assistant
│
├── frontend/
│   ├── index.html               # Web Shell with Leaflet GIS CDN
│   ├── package.json             # React 19 & Tailwind v4 Dependencies
│   ├── vite.config.ts           # Vite Bundler with API Proxy
│   ├── tsconfig.json            # Strict TypeScript Compiler Settings
│   └── src/
│       ├── main.tsx             # Application Entrypoint
│       ├── App.tsx              # Main Dashboard Component
│       ├── translations.ts      # Kannada, Marathi, Hindi & English Natural Dialects
│       ├── index.css            # Tailwind CSS v4 Theme
│       └── components/
│           ├── FieldMap.tsx         # Leaflet Farm Polygon & Outbreak Overlay
│           ├── RiskMeter.tsx        # Tom-Cast DSV Gauge & Microclimate Breakdown
│           ├── LeafScanner.tsx      # Quality-Gated Camera Scanner & CIBRC Guidance
│           ├── CommunityRadar.tsx   # Neighbor Outbreak & Wind Vector Direction
│           ├── SatelliteCard.tsx    # Sentinel-2 NDRE @ 20m & Cloud Fallback Simulator
│           ├── GroundTruthCard.tsx  # Empirical Field Trial Validation Logger
│           ├── KisanChatbot.tsx     # Voice-In & Voice-Out Tomato AI Chatbot
│           └── Icons.tsx            # Clean, Accessible SVG Icon Library
│
├── PRD.md                       # Approved Product Requirement Document (v2.0)
├── start_backend.bat            # 1-Click Windows Backend Launcher
├── start_frontend.bat           # 1-Click Windows Frontend Launcher
└── README.md                    # Project Documentation
```

---

## 4. The Winning Hackathon Demonstration Walkthrough

When presenting to judges, follow this concise 6-step script:

1. **Language & Location:**
   * Open `http://localhost:5173`. Show that the application auto-detects Karnataka coordinates and presents in **Kannada (ಕನ್ನಡ)** with a 1-tap toggle to **Marathi**, **Hindi**, or **English**.
   * Click the **"Listen Aloud" (ಧ್ವನಿಯಲ್ಲಿ ಆಲಿಸಿ)** button to demonstrate the native Web Speech API audio output.

2. **The Tom-Cast Microclimate Risk Engine:**
   * Walk through the **Tom-Cast Disease Risk Card**:
     * Shows 5-Day Cumulative DSVs, Estimated Canopy Wetness (Dew-Point Model), and Air Temperature.
     * Click the **"💧 Drip"** vs **"🚿 Foliar / Sprinkler"** toggle to show how on-farm watering immediately recalculates the canopy wetness duration and biological risk.
     * Highlight the **Data Provenance Card** displaying forecast source, station coordinates, distance, and the explicit *"Estimated Microclimate"* label (addressing Problem A from the review).

3. **OpenCV Quality-Gated Leaf Vision (Live Test):**
   * Under the **AI Leaf Doctor** card, click the **"Blurry Rejection"** demo button:
     * Show that the OpenCV Laplacian filter rejects out-of-focus photos: *"Photo Rejected: Blur score 0.0 < Threshold 75.0"*.
   * Click the **"Early Blight Spot"** demo button:
     * Shows high-confidence diagnosis, affected leaf area %, and CIBRC-registered **Mancozeb 75% WP @ 2.0–2.5 g/L** dosage per 15L backpack pump with mandatory 5-day Pre-Harvest Interval (PHI).
     * Click **"Listen to Cure"** to hear the instructions spoken aloud.

4. **Community Disease Reporting Network:**
   * Show the **Community Disease Network Card**:
     * Displays verified sightings within 5 km and checks whether your field lies downwind of airborne conidia plumes based on real-time wind speed and direction.

5. **Sentinel-2 Satellite & Cloud Fallback Simulator:**
   * Show the **Satellite Canopy Vigor Card**:
     * Clarify that Sentinel-2 Band 5 is **20 metres resolution** and monitors general canopy vigor, not specific disease.
     * Move the **Cloud Cover Slider** from 12% to 45%:
       * Watch the system automatically trigger the **Cloud Fallback State Machine**, displaying the last clean observation while keeping all weather and camera features 100% operational (addressing Problem B from the review).

6. **Grounded Kisan Tomato AI Chatbot:**
   * Open the **Kisan Tomato AI Assistant**:
     * Tap the microphone or click a suggested pill (*"Why are tomato flowers falling?"*).
     * Listen to the bot speak the answer in Kannada/English, referencing **Boron foliar spray** and **balanced drip irrigation** directly from the ICAR-IIHR knowledge base without hallucinating unverified chemicals.
