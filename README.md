# 🛡️ STRELA — H₂S Exposure Advisory & Plant Safety Platform
### Powered by Rakshak (रक्षक) AI Safety Intelligence

> **Smart India Hackathon (SIH 2026)**  
> **Domain:** Industrial Health & Safety · Petroleum Refining & Hazardous Chemical Facilities  
> **Pilot Implementation:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
> **Technology Stack:** Next.js 15, FastAPI, OpenCV, CIELAB Colorimetry, PyTorch/NumPy MLP, Three.js 3D, SQLite, ReportLab

---

## 🌟 Executive Summary

In petroleum refining and petrochemical processing, **Hydrogen Sulfide ($H_2S$)** is an invisible, deadly hazard. At concentrations as low as 10–20 ppm, it induces **olfactory fatigue** (paralyzing the human sense of smell), meaning workers cannot detect escalating gas leaks until it is too late.

Traditional industrial monitoring relies on bulky battery-powered sensors or hazardous **lead-acetate paper strips** ($Pb(CH_3COO)_2$), which pose toxic disposal liabilities and require manual, error-prone record-keeping.

**STRELA** solves this by uniting **sustainable green chemistry** with **modern computer vision and AI industrial intelligence**:
1. **STRELA Zero-Power Wearable Dosimeter Band:** Uses non-toxic, 100% aqueous anthocyanin plant extract to accumulate airborne $H_2S$ into an irreversible, visible color shift.
2. **STRELA AI Optical Scanner (OpenCV + Neural Network):** Decodes worker QR IDs, validates the substrate, checks lighting/glare quality, measures perceptual CIELAB $\Delta E$, and estimates exact gas exposure time.
3. **Control Room Safety Platform:** Aggregates scans across refinery units into a live **2D fugitive leak triangulation heatmap**, enforces statutory OISD/DGMS safety tiers, and generates **1-click audit-ready OISD-STD-105 Form-A incident PDFs**.
4. **Rakshak (रक्षक) AI Safety Copilot:** Multi-turn conversational safety companion grounded in authoritative OISD, DGMS, and ACGIH protocols, providing immediate clinical triage, PPE fit guidance, and OHC referrals.

---

## 🔬 Core Innovations

### 1. Eco-Friendly Organic Green Chemistry (Pb-Free)
* **100% Aqueous Extraction:** Anthocyanin extracted from natural red cabbage using **distilled water only—zero ethanol and zero toxic solvents**.
* **Ultrasonic Bath (Sonication):** Processed below 30°C for 30 minutes, centrifuged at 3,500 rpm for 15 minutes, and membrane-filtered.
* **Optimized Purple Flavylium Baseline:** Screened across pH 5.0 to 7.0 using dilute NaOH/citric acid for maximum baseline stability.
* **Irreversible Colorimetric Transition:** Upon exposure to airborne $H_2S$, acidic hydronium and hydrosulfide shift the dye permanently from **Purple $\to$ Red/Pink/Amber**, providing tamper-proof zero-battery accumulation.

### 2. Custom OpenCV & Computer Vision Pipeline
The optical scanning engine runs locally and server-side:
* **QR Auto-Detection (`cv2.QRCodeDetector` / `jsQR`):** Instantly parses Employee ID (e.g., `EMP-1042`), assigned plant unit, and badge serial number.
* **Substrate Gating & Anti-Spoofing:** HSV color-space thresholding detects the blue silicone enclosure (Hue 85–135) and purple substrate matrix (Hue 130–178), actively rejecting non-band inputs (human skin, faces, room walls).
* **Photo Quality Scorecard:** Grades lighting (underexposed/overexposed), specular glare ratio (`gray > 245`), and blur sharpness using Laplacian edge variance.
* **Multi-Patch Segmentation:**
  * **Patch A (Central Reactive Spot):** Measures colorimetric change using HSV orange/amber reaction masks.
  * **Patch B (Corner Blank Control):** Normalizes for ambient UV degradation and background lighting.
  * **Patch C (Integrity Indicator):** Flags expired or physically compromised dosimeter bands.
* **CIELAB Colorimetry ($\Delta E$):** Gamma-corrected conversion from RGB to CIE $L^*a^*b^*$, calculating perceptual Euclidean color distance $\Delta E$.
* **3-Layer MLP Neural Network:** Lightweight forward pass mapping ($\Delta E$, orange area fraction) $\to$ predicted exposure duration in minutes/seconds.
* **Microclimate Arrhenius Scaling:** Telemetry integration factoring ambient refinery temperature and relative humidity ($k(T, RH)$) into reaction kinetics.

### 3. Industrial Safety Intelligence & Compliance
* **2D Fugitive Leak Triangulation:** Employs spatial Inverse Distance Weighting (IDW) interpolation from mobile worker dosimeter readings to pinpoint unseen gas leaks on the plant grid.
* **Deterministic Statutory Tiers (Zero-LLM Math):**
  * **Tier 1 (Normal):** $\text{TWA} < 1.0\text{ ppm}$ AND $\text{7-day load} < 15.0\text{ ppm}\cdot\text{hr}$
  * **Tier 2 (Caution):** $1.0 \le \text{TWA} < 5.0\text{ ppm}$ OR $15.0 \le \text{7-day load} < 35.0\text{ ppm}\cdot\text{hr}$ (Triggers cartridge seal check).
  * **Tier 3 (Critical):** $\text{TWA} \ge 5.0\text{ ppm}$ OR $\text{Single-shift dose} > 20.0\text{ ppm}\cdot\text{hr}$ (Mandatory OHC referral).
* **1-Click OISD-STD-105 Form-A PDF Generator:** Automatically generates formatted, legal incident reports with worker history, shift dose, and medical recommendations.
* **Neuro-Olfactory Screener & Lung Risk Index:** Assesses olfactory fatigue and reaction delays, paired with a 0–100 chronic occupational lung risk model.

---

## 🏗️ System Architecture

```
[ Plant Worker wearing Bio-Dosimeter Band ]
                  │
                  ▼ (Post-Shift Camera Scan)
[ OpenCV Optical Scanner / Smartphone Viewfinder ]
       ├── QR Code Decoding (Employee ID & Unit)
       ├── Substrate Gating (Anti-Spoofing Filter)
       ├── Image Quality Check (Glare, Contrast, Sharpness)
       ├── Multi-Patch CIELAB Color Difference (ΔE)
       └── 3-Layer MLP Neural Network (Predicted Exposure)
                  │
                  ▼ (REST / SSE)
[ FastAPI Backend Safety Engine ]
       ├── Weather Telemetry & Arrhenius Scaling k(T, RH)
       ├── Rolling Exposure Ledgers (7-Day / 30-Day / 90-Day)
       ├── Deterministic Statutory Classifier (Tier 1/2/3)
       ├── 2D Fugitive Leak Triangulation (IDW Grid)
       ├── Automated OISD-STD-105 Form-A PDF Engine
       └── Corrective RAG (CRAG) Advisor (OISD / DGMS / ACGIH)
                  │
                  ▼
[ Next.js 15 Web Platform ]
       ├── 3D Exploded Interactive Dosimeter Hardware Teardown
       ├── Supervisory Control Room & Heatmap (/control-room)
       ├── Live Band Scanner (/manager/scan)
       ├── Worker Medical Dossiers (/workers/[id])
       └── Lab Extraction Walkthrough & Videos (/working)
```

---

## 📁 Repository Structure

```
├── backend/                         # FastAPI Backend Application
│   ├── agents/                      # Conversational AI & Safety Advisory
│   ├── database/                    # SQLite Models & Seed Database
│   ├── engine/                      # Kinetics, Vision Scanner, Statutory Rules, Weather
│   │   ├── h2s_strip_model.json     # Trained 3-layer neural network weights
│   │   ├── kinetics.py              # Arrhenius microclimate equations
│   │   ├── statutory.py             # Tier 1/2/3 deterministic classification
│   │   └── vision_scanner.py        # OpenCV computer vision pipeline
│   ├── intelligence/                # Heatmap triangulation, lung risk, OISD Form-A PDF
│   ├── rag/                         # Corrective RAG over OISD / DGMS safety standards
│   ├── schemas/                     # Pydantic data schemas
│   ├── config.py                    # Environment settings
│   └── main.py                      # FastAPI application entrypoint
│
├── frontend-next/                   # Next.js 15 App Router Frontend
│   ├── public/                      # Static assets, demonstration videos & 3D models
│   ├── src/
│   │   ├── app/                     # Next.js Pages (/, /control-room, /manager, /working, etc.)
│   │   ├── components/              # 3D Canvas, Scanner Viewfinder, Bento Grids, Heatmap
│   │   └── lib/                     # API client & TypeScript interfaces
│   ├── next.config.mjs              # Production proxy & deployment rewrites
│   └── tailwind.config.ts           # Industrial design system
│
├── docs/                            # Technical documentation & lab MOPs
│   ├── H2S_Detection_Project_MOP_Anthocyanin_Extraction.md
│   ├── H2S_Wristband_SbCl3_Anthocyanin_Complete.md
│   ├── api-reference.md
│   └── backend-audit.md
│
├── sample_data/                     # Evaluator testing suite
│   ├── printable_qr_badges/         # Printable test QR codes (EMP-1042, EMP-1043)
│   ├── test_wristband_scans/        # Real photo samples of exposed wristbands
│   └── README.md                    # Instructions for testing scanner
│
├── tests/                           # Pytest automated test suite (42 unit & integration tests)
├── Procfile                         # Cloud hosting deployment config (Render / Heroku)
├── render.yaml                      # Render Blueprint infrastructure-as-code
├── requirements.txt                 # Backend Python dependencies
├── run.py                           # Local backend launcher
└── README.md                        # Project documentation
```

---

## 🚀 Quick Start Guide (Run Locally)

### Prerequisites
* **Python 3.10+** (Tested on Python 3.12)
* **Node.js 18+** & **npm**

### Step 1: Clone the Repository
```bash
git clone https://github.com/arjitujjawal-art/SIH_118_.git
cd SIH_118_
```

### Step 2: Set Up Backend
```bash
# Create and activate Python virtual environment
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
python run.py
```
> Backend runs at: **`http://127.0.0.1:8000`**  
> OpenAPI Swagger Documentation: **`http://127.0.0.1:8000/docs`**

### Step 3: Set Up Frontend
In a new terminal window:
```bash
cd frontend-next
npm install
npm run dev
```
> Frontend runs at: **`http://localhost:3000`**

---

## 🌐 Cloud Hosting & Deployment Guide

### Deploying Backend (FastAPI on Render / Railway)
1. Fork or push this repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Connect your repository:
   * **Runtime:** Python 3
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   * `GROQ_API_KEY`: *(Optional, for RAG advisor chatbot)*
   * `PYTHON_VERSION`: `3.12.0`
5. Click **Deploy**. Note your backend URL (e.g. `https://strela-api.onrender.com`).

### Deploying Frontend (Next.js on Vercel)
1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Set the **Root Directory** to `frontend-next`.
3. Add Environment Variables:
   * `BACKEND_URL`: `https://strela-api.onrender.com`
   * `NEXT_PUBLIC_API_URL`: `https://strela-api.onrender.com`
4. Click **Deploy**. Your full-stack platform is live!

---

## 🧪 Testing & Verification

The platform includes **42 automated test cases** covering the OpenCV vision pipeline, kinetics, statutory tiers, authentication, and RAG retrieval:

```bash
# Run the complete test suite
.\venv\Scripts\pytest -v
```

```text
======================= 42 passed in ~57s =======================
tests/test_api.py::test_health_endpoint PASSED
tests/test_guardrails.py::test_tier_3_hard_override_lock PASSED
tests/test_kinetics_and_statutory.py::test_statutory_tier_3_critical_by_twa PASSED
tests/test_vision_scanner.py::test_reject_non_blue_strip PASSED
tests/test_vision_scanner.py::test_cielab_conversion_neutral PASSED
tests/test_vision_scanner.py::test_mlp_forward_pass PASSED
...
```

---

## 📜 Industrial Safety Standards Compliance

STRELA and the Rakshak AI advisory engine are built in strict adherence to Indian and international occupational health standards:
* **OISD-STD-105:** Work Permit System and Standard Incident Reporting in Petroleum Refineries.
* **OISD-STD-155:** Personnel Protective Equipment (PPE) Guidelines.
* **DGMS (Directorate General of Mines Safety):** Periodic Medical Examination (PME) protocols.
* **ACGIH / NIOSH:** Threshold Limit Values ($TLV\text{-}TWA = 1.0\text{ ppm}$, $STEL = 5.0\text{ ppm}$).

---

## 👥 Hackathon Team & Acknowledgements

* **Developed for:** Smart India Hackathon (SIH 2026)
* **Target Industry:** Refineries, Petrochemicals, Oil & Gas Processing Facilities
* **License:** MIT License
