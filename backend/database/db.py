import os
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings

# SQLite needs check_same_thread=False and timeout for async/multithreaded FastAPI & hot reload
connect_args = {"check_same_thread": False, "timeout": 30.0} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=30000")
            cursor.close()
        except Exception:
            pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def seed_default_data(db):
    from backend.database.models import EmployeeModel, ExposureLedgerModel, ShiftScanModel, IncidentReportModel

    # 1. First priority: Load rich historical workforce & dosimetry dataset from seed_data.json
    seed_json_path = os.path.join(os.path.dirname(__file__), "seed_data.json")
    if os.path.exists(seed_json_path):
        try:
            with open(seed_json_path, "r", encoding="utf-8") as f:
                seed_data = json.load(f)

            # A. Populate Employees if missing
            if db.query(EmployeeModel).count() == 0:
                print("🌱 Populating refinery workforce from seed_data.json...")
                for w in seed_data.get("workers", []):
                    w_dict = {k: v for k, v in w.items() if k not in ["created_at", "updated_at"]}
                    emp = EmployeeModel(**w_dict)
                    db.add(emp)
                db.commit()

            # B. Populate Exposure Ledgers if missing
            if db.query(ExposureLedgerModel).count() == 0:
                for l in seed_data.get("exposure_ledgers", []):
                    l_dict = {k: v for k, v in l.items() if k not in ["id", "last_updated"]}
                    ledger = ExposureLedgerModel(**l_dict)
                    db.add(ledger)
                db.commit()

            # C. Backfill all shift scans if missing or partial
            existing_scan_ids = set(r[0] for r in db.query(ShiftScanModel.scan_id).all())
            scans_to_add = []
            for s in seed_data.get("shift_scans", []):
                if s["scan_id"] not in existing_scan_ids:
                    s_dict = dict(s)
                    if isinstance(s_dict.get("timestamp"), str):
                        try:
                            s_dict["timestamp"] = datetime.fromisoformat(s_dict["timestamp"])
                        except Exception:
                            s_dict["timestamp"] = datetime.now(timezone.utc)
                    scan_obj = ShiftScanModel(**s_dict)
                    scans_to_add.append(scan_obj)

            if scans_to_add:
                db.bulk_save_objects(scans_to_add)
                db.commit()
                print(f"✅ Loaded {len(scans_to_add)} historical shift scans from seed_data.json")

            # D. Backfill incident reports if missing
            existing_incident_ids = set(r[0] for r in db.query(IncidentReportModel.incident_id).all())
            incidents_to_add = []
            for inc in seed_data.get("incident_reports", []):
                if inc["incident_id"] not in existing_incident_ids:
                    inc_dict = dict(inc)
                    if isinstance(inc_dict.get("timestamp"), str):
                        try:
                            inc_dict["timestamp"] = datetime.fromisoformat(inc_dict["timestamp"])
                        except Exception:
                            inc_dict["timestamp"] = datetime.now(timezone.utc)
                    if isinstance(inc_dict.get("created_at"), str):
                        try:
                            inc_dict["created_at"] = datetime.fromisoformat(inc_dict["created_at"])
                        except Exception:
                            inc_dict["created_at"] = datetime.now(timezone.utc)
                    inc_obj = IncidentReportModel(**inc_dict)
                    incidents_to_add.append(inc_obj)

            if incidents_to_add:
                db.bulk_save_objects(incidents_to_add)
                db.commit()
                print(f"✅ Loaded {len(incidents_to_add)} incident reports from seed_data.json")

            if db.query(ShiftScanModel).count() > 0:
                return
        except Exception as e:
            print(f"⚠️ Error loading seed_data.json: {e}")

    if db.query(EmployeeModel).count() > 0 and db.query(ShiftScanModel).count() >= 7:
        return  # Already seeded

    print("🌱 Seeding initial refinery workforce and shift history (procedural fallback)...")
    now = datetime.now(timezone.utc)

    employees_data = [
        {
            "worker_id": "EMP-1042",
            "full_name": "Sumedh Kulkarni",
            "age": 25,
            "gender": "Male",
            "department": "Operations",
            "plant_unit": "CDU-1",
            "role": "Senior Panel Operator",
            "preferred_language": "en",
            "active_badge_id": "BAND-1042-01",
            "band_lifecycle_day": 2,
            "health_profile_json": json.dumps({
                "smoking_status": "Non-smoker",
                "pre_existing_conditions": ["None"],
                "fev1_baseline_liters": 3.8,
                "fvc_baseline_liters": 4.6,
                "baseline_heart_rate_bpm": 72
            }),
            "ppe_details_json": json.dumps({
                "respirator_type": "3M Half-Face 6200 with 6006 Cartridge",
                "cartridge_install_date": (now - timedelta(days=12)).strftime("%Y-%m-%d"),
                "fit_test_date": (now - timedelta(days=45)).strftime("%Y-%m-%d"),
                "fit_test_passed": True
            }),
            "ledger": {
                "rolling_7day_ppm_hr": 7.4,
                "rolling_30day_ppm_hr": 24.1,
                "rolling_90day_ppm_hr": 68.5,
                "lifetime_shifts_logged": 142
            }
        },
        {
            "worker_id": "EMP-1043",
            "full_name": "Sunil Verma",
            "age": 44,
            "gender": "Male",
            "department": "Maintenance",
            "plant_unit": "DHDS",
            "role": "Mechanical Technician",
            "preferred_language": "hi",
            "active_badge_id": "BAND-1043-03",
            "band_lifecycle_day": 3,
            "health_profile_json": json.dumps({
                "smoking_status": "Former smoker",
                "pre_existing_conditions": ["Mild occupational asthma"],
                "fev1_baseline_liters": 3.1,
                "fvc_baseline_liters": 4.0,
                "baseline_heart_rate_bpm": 78
            }),
            "ppe_details_json": json.dumps({
                "respirator_type": "Honeywell North 7700 Half-Mask",
                "cartridge_install_date": (now - timedelta(days=5)).strftime("%Y-%m-%d"),
                "fit_test_date": (now - timedelta(days=30)).strftime("%Y-%m-%d"),
                "fit_test_passed": True
            }),
            "ledger": {
                "rolling_7day_ppm_hr": 16.8,
                "rolling_30day_ppm_hr": 42.0,
                "rolling_90day_ppm_hr": 115.2,
                "lifetime_shifts_logged": 210
            }
        },
        {
            "worker_id": "EMP-1044",
            "full_name": "Amit Patel",
            "age": 29,
            "gender": "Male",
            "department": "Operations",
            "plant_unit": "SRU",
            "role": "Sulfur Recovery Operator",
            "preferred_language": "en",
            "active_badge_id": "BAND-1044-01",
            "band_lifecycle_day": 1,
            "health_profile_json": json.dumps({
                "smoking_status": "Active smoker (5-10/day)",
                "pre_existing_conditions": ["None"],
                "fev1_baseline_liters": 3.6,
                "fvc_baseline_liters": 4.4,
                "baseline_heart_rate_bpm": 80
            }),
            "ppe_details_json": json.dumps({
                "respirator_type": "Dräger X-plore 5500 Full-Face",
                "cartridge_install_date": (now - timedelta(days=2)).strftime("%Y-%m-%d"),
                "fit_test_date": (now - timedelta(days=20)).strftime("%Y-%m-%d"),
                "fit_test_passed": True
            }),
            "ledger": {
                "rolling_7day_ppm_hr": 26.5,
                "rolling_30day_ppm_hr": 58.4,
                "rolling_90day_ppm_hr": 145.0,
                "lifetime_shifts_logged": 88
            }
        },
        {
            "worker_id": "EMP-1045",
            "full_name": "Priya Nair",
            "age": 34,
            "gender": "Female",
            "department": "Inspection & HSE",
            "plant_unit": "Tank Farm",
            "role": "Corrosion & Asset Inspector",
            "preferred_language": "en",
            "active_badge_id": "BAND-1045-02",
            "band_lifecycle_day": 4,
            "health_profile_json": json.dumps({
                "smoking_status": "Non-smoker",
                "pre_existing_conditions": ["None"],
                "fev1_baseline_liters": 3.2,
                "fvc_baseline_liters": 3.9,
                "baseline_heart_rate_bpm": 68
            }),
            "ppe_details_json": json.dumps({
                "respirator_type": "3M 7502 Silicone Half-Face",
                "cartridge_install_date": (now - timedelta(days=15)).strftime("%Y-%m-%d"),
                "fit_test_date": (now - timedelta(days=60)).strftime("%Y-%m-%d"),
                "fit_test_passed": True
            }),
            "ledger": {
                "rolling_7day_ppm_hr": 4.2,
                "rolling_30day_ppm_hr": 14.5,
                "rolling_90day_ppm_hr": 38.0,
                "lifetime_shifts_logged": 95
            }
        }
    ]

    for data in employees_data:
        ledger_data = data.pop("ledger")
        emp = db.query(EmployeeModel).filter(EmployeeModel.worker_id == data["worker_id"]).first()
        if not emp:
            emp = EmployeeModel(**data)
            db.add(emp)
            db.commit()
            db.refresh(emp)

        ledger = db.query(ExposureLedgerModel).filter(ExposureLedgerModel.worker_id == emp.worker_id).first()
        if not ledger:
            ledger = ExposureLedgerModel(
                worker_id=emp.worker_id,
                **ledger_data
            )
            db.add(ledger)
            db.commit()

        # Seed 7-day continuous shifts for each employee
        daily_doses = [1.1, 0.9, 1.4, 1.2, 0.8, 1.0, 1.0] if emp.worker_id == "EMP-1042" else [1.5, 2.0, 2.5, 2.8, 2.5, 2.7, 2.8]
        for day_offset in range(7):
            days_ago = 6 - day_offset
            shift_time = now - timedelta(days=days_ago, hours=4)
            scan_id = f"SCN-{emp.worker_id}-D{day_offset + 1}"
            if db.query(ShiftScanModel).filter(ShiftScanModel.scan_id == scan_id).first():
                continue

            dose = daily_doses[day_offset] if day_offset < len(daily_doses) else 1.0
            scan = ShiftScanModel(
                scan_id=scan_id,
                worker_id=emp.worker_id,
                plant_unit=emp.plant_unit,
                timestamp=shift_time,
                shift_status="COMPLETED",
                shift_duration_hours=8.0,
                badge_id=emp.active_badge_id,
                start_delta_e=0.2 * day_offset,
                end_delta_e=0.2 * day_offset + dose * 0.5,
                net_delta_e=dose * 0.5,
                delta_e=dose * 0.5,
                patch_b_drift=0.02 * day_offset,
                patch_c_condition="NORMAL",
                shelf_life_status="VALID",
                raw_optical_dose=dose,
                temperature_c=28.5 + (day_offset % 3),
                relative_humidity_pct=70.0 - (day_offset % 5),
                k_factor=1.0,
                telemetry_source="Open-Meteo",
                dose_low=round(dose * 0.88, 2),
                dose_high=round(dose * 1.12, 2),
                twa_low=round(dose * 0.88 / 8.0, 2),
                twa_high=round(dose * 1.12 / 8.0, 2),
                compensated_dose_ppm_hr=dose,
                shift_twa_ppm=round(dose / 8.0, 2),
                updated_7day_load=ledger_data["rolling_7day_ppm_hr"],
                statutory_tier="TIER 1 (NORMAL)" if dose < 3.0 else "TIER 2 (CAUTION)",
                measurement_confidence="HIGH",
                is_single_shift_critical=False,
                advisory_json=json.dumps({
                    "summary_banner": "Shift exposure within normal limits. Safe baseline maintained.",
                    "triage_question": "Are you feeling any slight eye dryness or throat tickle?",
                    "recommendations": [
                        {
                            "priority_level": "[LOW / SELF-CARE]",
                            "category": "Self-Care & Hygiene",
                            "action_item": "Wash face and exposed skin with clean water. Rest for 15 minutes and hydrate."
                        }
                    ]
                })
            )
            db.add(scan)
        db.commit()

    print("✅ Seeded refinery employees with 7-day longitudinal shift scans.")

def init_db():
    from backend.database import models  # noqa
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_data(db)
    finally:
        db.close()
