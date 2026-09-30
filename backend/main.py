import os
import json
import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Query, Response, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database.db import get_db, init_db
from backend.database.models import EmployeeModel, WorkerModel, ExposureLedgerModel, ShiftScanModel, IncidentReportModel
from backend.schemas.worker import WorkerProfile, HealthProfile, PPEDetails, ExposureLedger
from backend.schemas.auth import DemoLoginRequest, StandardLoginRequest, SessionUserResponse
from backend.schemas.dosimetry import (
    StartShiftRequest, EndShiftRequest, ShiftScanPayload, BadgeData,
    ContextualEnvironmentalTelemetry, EnvironmentalTelemetry, ComputedMetrics,
    PatchCondition
)
from backend.schemas.advisory import DosimeterAdvisoryPayload
from backend.engine.weather import get_kinetic_weather
from backend.engine.statutory import (
    compute_differential_shift_dose,
    classify_statutory_tier_range,
    evaluate_badge_integrity
)
from backend.engine.ledger import update_worker_exposure_ledger
from backend.engine.vision_scanner import vision_scanner
from backend.engine.event_bus import event_bus
from backend.agents.onboarding import onboarding_manager
from backend.agents.advisory import generate_dosimeter_advisory
from backend.agents.unified_chat import unified_chat
from backend.intelligence.leak_triangulation import calculate_plant_leak_heatmap
from backend.intelligence.neuro_screener import evaluate_neuro_olfactory_screen, NeuroScreeningResponse
from backend.intelligence.lung_risk import calculate_chronic_lung_risk_score
from backend.intelligence.incident_report import generate_oisd_form_a_pdf

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: Initializes database schema and seeds default data on startup."""
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Occupational H2S Exposure Advisory & Plant Safety Intelligence Platform",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Frontend Templates & Static Files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
TEMPLATES_DIR = os.path.join(FRONTEND_DIR, "templates")
STATIC_DIR = os.path.join(FRONTEND_DIR, "static")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

templates = Jinja2Templates(directory=TEMPLATES_DIR) if os.path.exists(TEMPLATES_DIR) else None

# ----------------- REQUEST / RESPONSE MODELS -----------------

class UnifiedChatRequest(BaseModel):
    session_id: str = "sess_default"
    message: str

class OnboardingChatRequest(BaseModel):
    session_id: str
    message: str

class OnboardingChatResponse(BaseModel):
    session_id: str
    reply: str
    current_step: str
    profile_completed: bool
    worker_profile: Optional[Dict[str, Any]] = None

class ScanSubmissionRequest(BaseModel):
    worker_id: str = "EMP-1042"
    employee_id: Optional[str] = None
    plant_unit: str = "CDU-1"
    shift_duration_hours: float = 8.0
    badge_id: str = "BAND-1042-01"
    band_lifecycle_day: int = 1
    start_delta_e: float = 0.0
    end_delta_e: float = 4.2
    patch_b_drift: float = 0.10
    patch_c_condition: str = "NORMAL"

# ----------------- HTML PAGE ROUTES -----------------

FALLBACK_HTML = """
<!DOCTYPE html>
<html>
<head><title>STRELA / Rakshak Dosimeter Monitoring Platform</title></head>
<body style="font-family: sans-serif; text-align: center; padding: 50px;">
  <h1>STRELA / Rakshak Occupational Dosimeter Monitoring Platform</h1>
  <p>Worker Safety Portal & Dashboard is running on Next.js frontend at <a href="http://localhost:3000">http://localhost:3000</a></p>
  <p>Backend API & Telemetry Engine: Active on port 8000</p>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
def index_page(request: Request):
    """Primary Worker/Employee Entrypoint — Rakshak AI Safety Chatbot."""
    if not templates or not os.path.exists(TEMPLATES_DIR):
        return HTMLResponse(FALLBACK_HTML)
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    """Login Page with 1-Click Instant Demo Role Selectors."""
    if not templates or not os.path.exists(TEMPLATES_DIR):
        return HTMLResponse(FALLBACK_HTML)
    return templates.TemplateResponse(request=request, name="login.html")

@app.get("/manager", response_class=HTMLResponse)
@app.get("/supervisor", response_class=HTMLResponse)
def supervisor_page(request: Request):
    """Supervisor Portal — 2D Fugitive Leak Triangulation & Workforce Ledger."""
    if not templates or not os.path.exists(TEMPLATES_DIR):
        return HTMLResponse(FALLBACK_HTML)
    return templates.TemplateResponse(request=request, name="supervisor.html")

@app.get("/manager/scan", response_class=HTMLResponse)
@app.get("/scan", response_class=HTMLResponse)
def scan_page(request: Request):
    """Post-Scan Result & Interactive Triage Drawer with Live AI Camera Scanner."""
    if not templates or not os.path.exists(TEMPLATES_DIR):
        return HTMLResponse(FALLBACK_HTML)
    return templates.TemplateResponse(request=request, name="scan.html")

@app.get("/control-room/workers/{worker_id}", response_class=HTMLResponse)
@app.get("/manager/employees/{worker_id}", response_class=HTMLResponse)
def worker_insights_page(request: Request, worker_id: str):
    """Worker / Employee Longitudinal Profile, 90-Day Trajectory & AI Query Drawer."""
    if not templates or not os.path.exists(TEMPLATES_DIR):
        return HTMLResponse(FALLBACK_HTML)
    return templates.TemplateResponse(request=request, name="worker_insights.html", context={"worker_id": worker_id})

@app.get("/screener", response_class=HTMLResponse)
def screener_page(request: Request):
    """Neuro-Olfactory Fatigue Screener."""
    if not templates or not os.path.exists(TEMPLATES_DIR):
        return HTMLResponse(FALLBACK_HTML)
    return templates.TemplateResponse(request=request, name="screener.html")

@app.get("/lung-risk", response_class=HTMLResponse)
def lung_risk_page(request: Request):
    """Chronic Occupational Lung-Risk Index."""
    if not templates or not os.path.exists(TEMPLATES_DIR):
        return HTMLResponse(FALLBACK_HTML)
    return templates.TemplateResponse(request=request, name="lung_risk.html")

@app.get("/onboard", response_class=HTMLResponse)
def onboard_page(request: Request):
    if not templates or not os.path.exists(TEMPLATES_DIR):
        return HTMLResponse(FALLBACK_HTML)
    return templates.TemplateResponse(request=request, name="index.html")

# ----------------- AUTH & DEMO MODE ENDPOINTS -----------------

@app.post("/api/auth/demo-login")
def demo_login(payload: DemoLoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    1-Click Frictionless Demo Login for Hackathon Judges and Reviewers:
    - 'employee': Activates employee session (defaults to EMP-1042 Rajesh Kumar).
    - 'manager': Activates Shift Safety Lead session (Vikram Singh).
    - 'hse_officer': Activates OHC Medical Lead session (Dr. Ananya Sharma).
    """
    role = payload.role.lower()
    if role == "manager":
        session_data = {
            "authenticated": True,
            "role": "MANAGER",
            "user_id": "MGR-01",
            "employee_id": "MGR-01",
            "full_name": "Vikram Singh",
            "plant_unit": "Central Control Room",
            "active_badge_id": "MGR-MASTER",
            "is_demo": True
        }
    elif role == "hse_officer":
        session_data = {
            "authenticated": True,
            "role": "HSE_OFFICER",
            "user_id": "HSE-01",
            "employee_id": "HSE-01",
            "full_name": "Dr. Ananya Sharma",
            "plant_unit": "Occupational Health Centre (OHC)",
            "active_badge_id": "HSE-MASTER",
            "is_demo": True
        }
    else:
        emp_id = payload.employee_id or "EMP-1042"
        emp = db.query(EmployeeModel).filter(EmployeeModel.worker_id == emp_id).first()
        full_name = emp.full_name if emp else "Sumedh Kulkarni"
        plant_unit = emp.plant_unit if emp else "CDU-1"
        badge_id = emp.active_badge_id if emp else "BAND-1042-01"

        session_data = {
            "authenticated": True,
            "role": "EMPLOYEE",
            "user_id": emp_id,
            "employee_id": emp_id,
            "full_name": full_name,
            "plant_unit": plant_unit,
            "active_badge_id": badge_id,
            "is_demo": True
        }

    response.set_cookie(key="rakshak_session", value=json.dumps(session_data), max_age=86400, httponly=False)
    return session_data

@app.post("/api/auth/login")
def standard_login(payload: StandardLoginRequest, response: Response, db: Session = Depends(get_db)):
    """Standard credential login (falls back to demo session if testing)."""
    username = payload.username.strip().lower()
    if "mgr" in username or "manager" in username:
        return demo_login(DemoLoginRequest(role="manager"), response, db)
    elif "hse" in username or "doctor" in username:
        return demo_login(DemoLoginRequest(role="hse_officer"), response, db)
    else:
        emp_id = payload.username.upper() if payload.username.upper().startswith("EMP-") else "EMP-1042"
        return demo_login(DemoLoginRequest(role="employee", employee_id=emp_id), response, db)

@app.get("/api/auth/me")
def get_current_session(request: Request):
    """Returns active session details from cookie or default demo user."""
    cookie_val = request.cookies.get("rakshak_session")
    if cookie_val:
        try:
            return json.loads(cookie_val)
        except Exception:
            pass
    return {
        "authenticated": True,
        "role": "EMPLOYEE",
        "user_id": "EMP-1042",
        "employee_id": "EMP-1042",
        "full_name": "Sumedh Kulkarni",
        "plant_unit": "CDU-1",
        "active_badge_id": "BAND-1042-01",
        "is_demo": True
    }

@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie(key="rakshak_session")
    return {"authenticated": False, "message": "Logged out successfully"}

# ----------------- DUAL-SCAN SHIFT LIFECYCLE & VISION SCANNER -----------------

@app.post("/api/scan/start-shift")
def start_shift_checkin(payload: StartShiftRequest, db: Session = Depends(get_db)):
    """
    Start-of-Shift Check-In:
    - Ingests initial baseline optical density (ΔE_start)
    - Records shift status as ACTIVE
    - Broadcasts real-time check-in event to Manager Control Room
    """
    emp_id = payload.employee_id
    emp = db.query(EmployeeModel).filter(EmployeeModel.worker_id == emp_id).first()
    if not emp:
        emp = EmployeeModel(
            worker_id=emp_id,
            full_name=f"Employee {emp_id}",
            plant_unit=payload.plant_unit,
            active_badge_id=payload.badge_id,
            band_lifecycle_day=payload.band_lifecycle_day
        )
        db.add(emp)
        db.commit()
        db.refresh(emp)

    scan_id = f"SCN-START-{uuid.uuid4().hex[:6].upper()}"
    weather = get_kinetic_weather()

    scan = ShiftScanModel(
        scan_id=scan_id,
        worker_id=emp_id,
        plant_unit=payload.plant_unit,
        shift_status="ACTIVE",
        shift_duration_hours=8.0,
        badge_id=payload.badge_id,
        start_delta_e=payload.start_delta_e,
        end_delta_e=payload.start_delta_e,
        net_delta_e=0.0,
        delta_e=payload.start_delta_e,
        temperature_c=weather["temperature_c"],
        relative_humidity_pct=weather["relative_humidity_pct"],
        telemetry_source=weather["source"],
        statutory_tier="TIER 1 (NORMAL)"
    )
    db.add(scan)
    db.commit()

    # Broadcast event to SSE Stream
    event_bus.publish_sync("shift_started", {
        "scan_id": scan_id,
        "employee_id": emp_id,
        "employee_name": emp.full_name,
        "plant_unit": payload.plant_unit,
        "badge_id": payload.badge_id,
        "start_delta_e": payload.start_delta_e,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {
        "status": "ACTIVE_SHIFT_STARTED",
        "scan_id": scan_id,
        "employee_id": emp_id,
        "employee_name": emp.full_name,
        "plant_unit": payload.plant_unit,
        "start_delta_e": payload.start_delta_e,
        "hazard_score_5pt": 0.0,
        "hazard_level_simple": "SAFE / NORMAL",
        "morning_checkin_time": datetime.now(timezone.utc).strftime("%I:%M %p"),
        "message": f"Start-of-shift baseline ΔE {payload.start_delta_e} logged for {emp.full_name}. Have a safe shift!"
    }

@app.post("/api/scan/analyze-image")
async def analyze_badge_photo(file: UploadFile = File(...)):
    """
    Analyzes an uploaded or camera-captured colorimetric dosimeter wristband photo:
    - Decodes image & evaluates lighting/glare quality scorecard
    - Performs QR code decoding (Employee ID, Plant Unit, Badge Barcode)
    - Validates Blue Dosimeter Strip Substrate (rejects human faces, walls, hands)
    - Performs CIELAB color space transformation
    - Segments Patch A (Active Spot ΔE & area), Patch B (Control Drift), and Patch C (Integrity)
    - Runs 3-layer MLP forward pass for exposure duration prediction
    """
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image (PNG, JPG, JPEG, WEBP)")
    
    contents = await file.read()
    if len(contents) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file exceeds 15MB size limit")
        
    analysis = vision_scanner.analyze_badge_image(contents)
    return analysis

@app.post("/api/scan/end-shift")
@app.post("/api/scan/submit")
def submit_shift_scan(payload: ScanSubmissionRequest, db: Session = Depends(get_db)):
    """
    End-of-Shift Differential Calculation & Advisory Generation:
    1. Evaluates Differential Shift Exposure: ΔE_net = max(0, ΔE_end - ΔE_start - Patch B drift)
    2. Maps to Low-High Uncertainty Dose Range & TWA Range
    3. Ingests Contextual Environmental Telemetry
    4. Updates Multi-Window Exposure Ledger (7-day / 30-day / 90-day)
    5. Classifies Statutory Tier (Tier 1 / Tier 2 / Tier 3)
    6. Generates Structured LLM / RAG Advisory with Hard Safety Locks
    7. Broadcasts Live Real-Time Event to Manager Control Room
    """
    emp_id = payload.employee_id or payload.worker_id
    worker = db.query(EmployeeModel).filter(EmployeeModel.worker_id == emp_id).first()
    if not worker:
        worker = EmployeeModel(
            worker_id=emp_id,
            full_name=f"Employee {emp_id}",
            plant_unit=payload.plant_unit
        )
        db.add(worker)
        db.commit()
        db.refresh(worker)

    worker_dict = worker.to_dict()
    worker_profile = WorkerProfile(
        worker_id=worker.worker_id,
        full_name=worker.full_name,
        age=worker.age,
        gender=worker.gender,
        department=worker.department,
        plant_unit=payload.plant_unit,
        role=worker.role,
        preferred_language=worker.preferred_language,
        health_profile=HealthProfile(**worker_dict["health_profile"]),
        ppe_details=PPEDetails(**worker_dict["ppe_details"]),
        exposure_ledger=ExposureLedger(**worker_dict.get("exposure_ledger", {}))
    )

    # 1. Ingest Contextual Environmental Telemetry (Live Weather & Refinery Microclimate)
    weather = get_kinetic_weather()
    telemetry = ContextualEnvironmentalTelemetry(
        temperature_c=weather["temperature_c"],
        relative_humidity_pct=weather["relative_humidity_pct"],
        source=weather["source"]
    )

    # 2. Deterministic Differential Math with Arrhenius Kinetics & Humidity Scaling
    diff_res = compute_differential_shift_dose(
        start_delta_e=payload.start_delta_e,
        end_delta_e=payload.end_delta_e,
        patch_b_drift=payload.patch_b_drift,
        patch_c_condition=payload.patch_c_condition, # type: ignore
        shift_hours=payload.shift_duration_hours,
        temperature_c=weather["temperature_c"],
        relative_humidity_pct=weather["relative_humidity_pct"]
    )

    # 3. Update Rolling Ledger
    prior_7d = worker_profile.exposure_ledger.rolling_7day_high_ppm_hr
    updated_ledger = update_worker_exposure_ledger(
        db, emp_id, diff_res["dose_low"], diff_res["dose_high"]
    )

    # 4. Classify Statutory Tier
    tier, is_single_crit = classify_statutory_tier_range(
        twa_low=diff_res["twa_low"],
        twa_high=diff_res["twa_high"],
        updated_7day_high=updated_ledger["load_7d_high"],
        dose_high=diff_res["dose_high"]
    )

    metrics = ComputedMetrics(
        net_delta_e=diff_res["net_delta_e"],
        shift_dose_low_ppm_hr=diff_res["dose_low"],
        shift_dose_high_ppm_hr=diff_res["dose_high"],
        shift_dose_range_str=diff_res["dose_range_str"],
        shift_twa_low_ppm=diff_res["twa_low"],
        shift_twa_high_ppm=diff_res["twa_high"],
        shift_twa_range_str=diff_res["twa_range_str"],
        shift_hours=payload.shift_duration_hours,
        prior_7day_load_ppm_hr=prior_7d,
        updated_7day_load_low=updated_ledger["load_7d_low"],
        updated_7day_load_high=updated_ledger["load_7d_high"],
        updated_7day_range_str=updated_ledger["range_7d_str"],
        statutory_tier=tier, # type: ignore
        hazard_score_5pt=diff_res.get("hazard_score_5pt", 1.0),
        hazard_level_simple=diff_res.get("hazard_level_simple", "SAFE / NORMAL"),
        measurement_confidence=diff_res["confidence"],
        badge_integrity_warning=diff_res["integrity_warning"],
        is_single_shift_critical=is_single_crit
    )

    scan_id = f"SCN-{uuid.uuid4().hex[:8].upper()}"
    badge_data = BadgeData(
        badge_id=payload.badge_id,
        band_lifecycle_day=payload.band_lifecycle_day,
        start_optical_density=payload.start_delta_e,
        end_optical_density=payload.end_delta_e,
        patch_b_drift=payload.patch_b_drift,
        patch_c_condition=payload.patch_c_condition, # type: ignore
        shelf_life_status="VALID"
    )

    scan_payload = ShiftScanPayload(
        scan_id=scan_id,
        worker_id=emp_id,
        plant_unit=payload.plant_unit,
        timestamp=datetime.now(timezone.utc),
        shift_duration_hours=payload.shift_duration_hours,
        badge_data=badge_data,
        environmental_telemetry=telemetry,
        computed_metrics=metrics
    )

    # 5. Generate Hybrid RAG Advisory with Hard Safety Locks
    advisory = generate_dosimeter_advisory(worker_profile, scan_payload)

    # 6. Save Completed Scan Record
    db_scan = ShiftScanModel(
        scan_id=scan_id,
        worker_id=emp_id,
        plant_unit=payload.plant_unit,
        timestamp=datetime.now(timezone.utc),
        shift_status="COMPLETED",
        shift_duration_hours=payload.shift_duration_hours,
        badge_id=payload.badge_id,
        start_delta_e=payload.start_delta_e,
        end_delta_e=payload.end_delta_e,
        net_delta_e=diff_res["net_delta_e"],
        delta_e=diff_res["net_delta_e"],
        patch_b_drift=payload.patch_b_drift,
        patch_c_condition=payload.patch_c_condition,
        shelf_life_status="VALID",
        raw_optical_dose=diff_res["nominal_dose"],
        temperature_c=weather["temperature_c"],
        relative_humidity_pct=weather["relative_humidity_pct"],
        k_factor=1.0,
        telemetry_source=weather["source"],
        dose_low=diff_res["dose_low"],
        dose_high=diff_res["dose_high"],
        twa_low=diff_res["twa_low"],
        twa_high=diff_res["twa_high"],
        compensated_dose_ppm_hr=diff_res["nominal_dose"],
        shift_twa_ppm=(diff_res["twa_low"] + diff_res["twa_high"]) / 2.0,
        updated_7day_load=updated_ledger["load_7d_high"],
        statutory_tier=tier,
        measurement_confidence=diff_res["confidence"],
        is_single_shift_critical=is_single_crit,
        advisory_json=advisory.model_dump_json()
    )
    db.add(db_scan)

    # If Tier 3, create Incident Record
    if tier == "TIER 3 (CRITICAL)":
        inc = IncidentReportModel(
            incident_id=f"INC-{uuid.uuid4().hex[:6].upper()}",
            scan_id=scan_id,
            worker_id=emp_id,
            plant_unit=payload.plant_unit,
            severity_tier=tier,
            status="OPEN",
            supervisor_notes="Critical H2S exposure limit touched. OHC referral locked."
        )
        db.add(inc)

    db.commit()

    # 7. Broadcast Real-Time SSE Event
    event_bus.publish_sync("scan_completed", {
        "scan_id": scan_id,
        "employee_id": emp_id,
        "employee_name": worker.full_name,
        "plant_unit": payload.plant_unit,
        "tier": tier,
        "twa_range": metrics.shift_twa_range_str,
        "dose_range": metrics.shift_dose_range_str,
        "7day_range": metrics.updated_7day_range_str,
        "confidence": metrics.measurement_confidence,
        "is_tier3": (tier == "TIER 3 (CRITICAL)"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {
        "scan_id": scan_id,
        "employee_id": emp_id,
        "worker_id": emp_id,
        "plant_unit": payload.plant_unit,
        "telemetry": telemetry.model_dump(),
        "computed_metrics": metrics.model_dump(),
        "advisory": advisory.model_dump()
    }

# ----------------- REAL-TIME SSE STREAMING -----------------

@app.get("/api/realtime/stream")
async def realtime_event_stream():
    """Server-Sent Events (SSE) stream for live control room monitoring."""
    return StreamingResponse(event_bus.subscribe(), media_type="text/event-stream")

# ----------------- MANAGER CONTROL ROOM & ANALYTICS -----------------

@app.get("/api/manager/dashboard")
def get_manager_dashboard(db: Session = Depends(get_db)):
    """Aggregate Plant Safety KPIs."""
    total_employees = db.query(EmployeeModel).count()
    recent_scans = db.query(ShiftScanModel).order_by(ShiftScanModel.timestamp.desc()).limit(10).all()
    
    tier3_count = db.query(ShiftScanModel).filter(ShiftScanModel.statutory_tier == "TIER 3 (CRITICAL)").count()
    tier2_count = db.query(ShiftScanModel).filter(ShiftScanModel.statutory_tier == "TIER 2 (CAUTION)").count()
    active_incidents = db.query(IncidentReportModel).filter(IncidentReportModel.status != "CLOSED").count()

    # Unit exposure breakdown
    units = ["CDU-1", "CDU-2", "DHDS", "SRU", "Tank Farm", "Flare Header"]
    unit_stats = []
    for u in units:
        scans_u = db.query(ShiftScanModel).filter(ShiftScanModel.plant_unit == u).all()
        avg_twa = round(sum(s.shift_twa_ppm for s in scans_u) / max(1, len(scans_u)), 2)
        unit_stats.append({
            "unit": u,
            "total_scans": len(scans_u),
            "average_twa_ppm": avg_twa,
            "status": "ALERT" if avg_twa >= 1.0 else "NORMAL"
        })

    return {
        "workforce_kpis": {
            "total_active_employees": total_employees,
            "recent_shifts_logged": len(recent_scans),
            "tier2_caution_warnings": tier2_count,
            "tier3_critical_breaches": tier3_count,
            "open_oisd_incidents": active_incidents
        },
        "unit_breakdown": unit_stats,
        "recent_scans": [s.to_dict() for s in recent_scans]
    }

@app.get("/api/manager/employees")
def list_employees(db: Session = Depends(get_db)):
    """Full Employee Roster with 7-day load ranges and status."""
    employees = db.query(EmployeeModel).all()
    return [e.to_dict() for e in employees]

@app.get("/api/manager/employees/{employee_id}")
@app.get("/api/control-room/workers/{employee_id}")
@app.get("/api/workers/{employee_id}")
@app.get("/api/employees/{employee_id}")
def get_employee_insights(employee_id: str, db: Session = Depends(get_db)):
    """Detailed employee dossier, full shift history, 90-day trajectory."""
    emp = db.query(EmployeeModel).filter(EmployeeModel.worker_id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")

    emp_dict = emp.to_dict()
    worker_profile = WorkerProfile(
        worker_id=emp.worker_id,
        full_name=emp.full_name,
        age=emp.age,
        gender=emp.gender,
        department=emp.department,
        plant_unit=emp.plant_unit,
        role=emp.role,
        preferred_language=emp.preferred_language,
        health_profile=HealthProfile(**emp_dict["health_profile"]),
        ppe_details=PPEDetails(**emp_dict["ppe_details"]),
        exposure_ledger=ExposureLedger(**emp_dict.get("exposure_ledger", {}))
    )

    lung_risk = calculate_chronic_lung_risk_score(worker_profile)
    scans = db.query(ShiftScanModel).filter(ShiftScanModel.worker_id == employee_id).order_by(ShiftScanModel.timestamp.desc()).all()

    return {
        "worker_id": employee_id,
        "employee_id": employee_id,
        "employee_profile": emp_dict,
        "worker_profile": emp_dict,
        "lung_risk_profile": lung_risk,
        "chronic_lung_risk": lung_risk,
        "recent_scans": [s.to_dict() for s in scans],
        "shift_history": [s.to_dict() for s in scans]
    }

@app.get("/api/manager/heatmap")
@app.get("/api/supervisor/heatmap")
def get_supervisor_heatmap(db: Session = Depends(get_db)):
    """2D Spatial Fugitive Leak Triangulation Coordinates."""
    scans = db.query(ShiftScanModel).order_by(ShiftScanModel.timestamp.desc()).limit(50).all()
    scan_dicts = [s.to_dict() for s in scans]
    return calculate_plant_leak_heatmap(scan_dicts)

@app.get("/api/manager/incidents")
def list_incidents(db: Session = Depends(get_db)):
    """Statutory Incident Reports."""
    incidents = db.query(IncidentReportModel).order_by(IncidentReportModel.timestamp.desc()).all()
    return [i.to_dict() for i in incidents]

@app.get("/api/manager/incident-pdf/{scan_id}")
@app.get("/api/supervisor/incident-pdf/{scan_id}")
def download_incident_pdf(scan_id: str, db: Session = Depends(get_db)):
    """1-Click Printable OISD-STD-105 Form-A PDF."""
    scan = db.query(ShiftScanModel).filter(ShiftScanModel.scan_id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    
    worker = scan.worker
    worker_dict = worker.to_dict() if worker else {}
    scan_dict = scan.to_dict()
    
    pdf_buffer = generate_oisd_form_a_pdf(scan_dict, worker_dict)
    filename = f"OISD_Form_A_{scan_id}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ----------------- CHATBOT & SPECIALIZED SCREENERS -----------------

@app.post("/api/chat")
def chat_with_rakshak(payload: UnifiedChatRequest, db: Session = Depends(get_db)):
    """Multi-turn conversational safety advisor endpoint."""
    return unified_chat.process_message(payload.session_id, payload.message, db)

@app.post("/api/onboarding/chat")
@app.post("/api/onboard/chat")
def onboarding_chat(payload: OnboardingChatRequest, db: Session = Depends(get_db)):
    reply, profile, step = onboarding_manager.process_turn(payload.session_id, payload.message)
    completed = (step == "COMPLETED")
    return OnboardingChatResponse(
        session_id=payload.session_id,
        reply=reply,
        current_step=step,
        profile_completed=completed,
        worker_profile=profile.model_dump() if profile else None
    )

@app.post("/api/screener/neuro-test")
def run_neuro_test(response: NeuroScreeningResponse):
    return evaluate_neuro_olfactory_screen(response)

@app.get("/api/employees/{employee_id}/lung-risk")
@app.get("/api/workers/{worker_id}/lung-risk")
def get_worker_lung_risk(worker_id: Optional[str] = None, employee_id: Optional[str] = None, db: Session = Depends(get_db)):
    target_id = employee_id or worker_id or "EMP-1042"
    worker = db.query(EmployeeModel).filter(EmployeeModel.worker_id == target_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail=f"Employee {target_id} not found")
    
    worker_dict = worker.to_dict()
    worker_profile = WorkerProfile(
        worker_id=worker.worker_id,
        full_name=worker.full_name,
        age=worker.age,
        gender=worker.gender,
        department=worker.department,
        plant_unit=worker.plant_unit,
        role=worker.role,
        preferred_language=worker.preferred_language,
        health_profile=HealthProfile(**worker_dict["health_profile"]),
        ppe_details=PPEDetails(**worker_dict["ppe_details"]),
        exposure_ledger=ExposureLedger(**worker_dict.get("exposure_ledger", {}))
    )
    return calculate_chronic_lung_risk_score(worker_profile)

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "groq_configured": bool(settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY")),
        "active_groq_model": settings.GROQ_MODEL or os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b"),
        "database": "connected"
    }
