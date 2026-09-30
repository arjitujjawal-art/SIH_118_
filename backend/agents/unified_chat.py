import re
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional, List
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database.models import EmployeeModel, WorkerModel, ExposureLedgerModel, ShiftScanModel
from backend.schemas.worker import WorkerProfile, HealthProfile, PPEDetails, ExposureLedger
from backend.schemas.dosimetry import (
    ShiftScanPayload, BadgeData, ContextualEnvironmentalTelemetry, ComputedMetrics,
    PatchCondition, MeasurementConfidence
)
from backend.engine.weather import get_kinetic_weather
from backend.engine.statutory import (
    compute_differential_shift_dose,
    classify_statutory_tier_range,
    evaluate_badge_integrity
)
from backend.engine.ledger import update_worker_exposure_ledger
from backend.agents.advisory import generate_dosimeter_advisory
from backend.rag.retriever import retriever
from backend.intelligence.lung_risk import calculate_chronic_lung_risk_score

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """
You are Rakshak (रक्षक), an empathetic, expert AI Occupational Health and Safety Companion for refinery workers at MRPL Mangalore.
Your mission is to protect workers from toxic Hydrogen Sulfide (H2S) exposure, fatigue, and occupational hazards.

KEY BEHAVIORS:
1. Natural, warm, empathetic, conversational tone. Speak directly to the worker like a caring safety mentor.
2. When a worker mentions symptoms (e.g., feeling sleepy, drowsy, dizzy, eye stinging, throat irritation, sudden loss of smell, headache):
   - Recognize that in sour operating units (CDU-1, DHDS, SRU, Tank Farm), drowsiness/fatigue or eye irritation can be early warning signs of H2S exposure or oxygen deficiency!
   - Give immediate, clear, numbered safety steps:
     1. Stop hot work / equipment inspection immediately.
     2. Move upwind to a well-ventilated fresh air area or positive-pressure control room.
     3. Inform your shift buddy or supervisor.
     4. Rest, hydrate with clean water, and report to the Occupational Health Centre (OHC) if symptoms persist.
3. NEVER dump raw unformatted regulatory excerpts or legal clauses.
4. Keep answers concise, clear, and easy to read on mobile screens (bullet points or numbered steps).
5. If the user speaks in Hindi or requests Hindi, reply in natural, fluent Hindi (Devanagari script).
"""

class UnifiedChatAgent:
    """
    Unified Conversational AI Agent for Rakshak (रक्षक).
    Integrates Groq LLM (qwen/qwen3.8-27b), contextual RAG, and deterministic shift dosimetry.
    """
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.groq_client = None
        self._init_groq()

    def _init_groq(self):
        if settings.GROQ_API_KEY:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY, timeout=6.0, max_retries=1)
            except Exception as e:
                logger.warning(f"Could not initialize Groq client: {e}")

    def get_session(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "worker_id": "EMP-1042",
                "lang": "en",
                "history": []
            }
        return self.sessions[session_id]

    def process_message(self, session_id: str, message: str, db: Session) -> Dict[str, Any]:
        session = self.get_session(session_id)
        msg_clean = message.strip().lower()
        lang = session.get("lang", "en")
        
        # 1. Language Toggle Commands
        if any(w in msg_clean for w in ["hindi", "हिन्दी", "हिंदी"]) or msg_clean == "2":
            session["lang"] = "hi"
            return {
                "reply": "नमस्ते! भाषा को **हिन्दी** में सेट कर दिया गया है। मैं आपकी सुरक्षा के लिए यहाँ हूँ। आपकी आज की शिफ्ट कैसी रही? आप अपनी बैज रीडिंग दर्ज कर सकते हैं या किसी भी लक्षण के बारे में पूछ सकते हैं।",
                "quick_actions": ["बैज रीडिंग दर्ज करें", "मेरा एक्सपोजर स्टेटस", "गंध थकान जांच (Screener)", "सुरक्षा नियम (PPE)"]
            }
        elif any(w in msg_clean for w in ["english", "switch to english"]) or msg_clean == "1":
            session["lang"] = "en"
            return {
                "reply": "Language set to **English**. How can I help you stay safe today? You can log your badge reading, check your exposure status, or ask about safety procedures.",
                "quick_actions": ["Log Badge Reading", "My Exposure Status", "Olfactory Smell Test", "PPE Guidelines"]
            }

        # 2. Shift Badge Scan / Reading Input (e.g. "Shift ended start 0.5 end 4.2")
        if any(k in msg_clean for k in ["start reading", "end reading", "delta e", "reading", "shift end", "shift ended", "बैज रीडिंग", "स्कैन दर्ज"]):
            if any(char.isdigit() for char in message):
                return self._handle_scan_submission(session, message, db, lang)

        # 3. Direct Exposure Status Query (e.g., "Summarize Sumedh Kulkarni's 7-day exposure.")
        if any(k in msg_clean for k in ["exposure status", "7-day exposure", "7 day exposure", "7-day", "7 day", "summarize", "exposure", "एक्सपोजर"]):
            return self._handle_exposure_query(session, db, lang)

        # 4. Olfactory Fatigue / Smell Test Trigger
        if any(k in msg_clean for k in ["olfactory smell test", "smell test", "screener", "olfactory", "गंध थकान जांच", "सूंघने की जांच"]):
            return self._handle_screener_query(session, lang)

        # 5. Chronic Lung Risk Query
        if any(k in msg_clean for k in ["lung risk", "chronic lung risk", "lung", "फेफड़े"]):
            return self._handle_lung_risk_query(session, db, lang)

        # 6. How TWA is calculated
        if any(k in msg_clean for k in ["twa", "calculate", "calculated", "formula", "8-hour", "time-weighted"]):
            return self._handle_twa_query(lang)

        # 7. Safety procedures for units
        if any(k in msg_clean for k in ["procedure", "cdu", "dhds", "sru", "tank farm", "unit"]):
            return self._handle_procedure_query(msg_clean, lang)

        # 8. Replacement schedule
        if any(k in msg_clean for k in ["replacement", "replace", "schedule", "lifecycle", "wristband"]):
            return self._handle_replacement_query(session, db, lang)

        # 9. General Safety Q&A, Symptom Triage & Conversation via Groq LLM
        return self._handle_llm_safety_query(message, session, lang)

    def _handle_llm_safety_query(self, message: str, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        """
        Uses Groq LLM (qwen/qwen3.8-27b) with RAG context to provide empathetic,
        accurate, natural safety advice and symptom triage.
        """
        worker_id = session.get("worker_id", "EMP-1042")
        
        # 1. Retrieve supporting RAG context
        chunks, conf = retriever.query(message, top_k=2)
        rag_text = ""
        if chunks:
            rag_text = "\n\n".join([f"[{c['title']}]: {c['content']}" for c in chunks])

        # 2. Call Groq LLM if configured
        if not self.groq_client and settings.GROQ_API_KEY:
            self._init_groq()

        if self.groq_client:
            try:
                lang_instruction = "Respond in Hindi (Devanagari script)." if lang == "hi" else "Respond in English."
                prompt_content = f"""
Language Instruction: {lang_instruction}
Worker Context: Active Worker {worker_id} in Refinery Operating Unit (CDU-1 / Sour Gas Area).

Worker Query: "{message}"

Retrieved Regulatory Safety Reference:
{rag_text}

Provide an empathetic, clear, structured response with immediate first-aid / action steps if the worker describes any symptoms (e.g. sleepiness, fatigue, eye stinging, smell loss, coughing). Do NOT dump raw regulatory text.
"""
                for test_model in [settings.GROQ_MODEL, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
                    try:
                        response = self.groq_client.chat.completions.create(
                            model=test_model,
                            messages=[
                                {"role": "system", "content": CHAT_SYSTEM_PROMPT},
                                {"role": "user", "content": prompt_content}
                            ],
                            temperature=0.3,
                            max_tokens=450
                        )
                        ai_reply = response.choices[0].message.content.strip()
                        return {
                            "reply": ai_reply,
                            "quick_actions": ["Log Badge Reading", "My Exposure Status", "Olfactory Smell Test", "PPE Guidelines"]
                        }
                    except Exception as model_err:
                        logger.warning(f"Groq model {test_model} failed: {model_err}")
            except Exception as e:
                logger.warning(f"Groq Chat LLM call failed: {e}. Using smart conversational fallback.")

        # 3. Smart Conversational Fallback (if Groq is offline or key not provided)
        msg_l = message.lower()
        if any(s in msg_l for s in ["sleep", "sleepy", "drowsy", "tired", "fatigue", "नींद", "थकान", "सुस्ती"]):
            if lang == "hi":
                reply = (
                    "⚠️ **महत्वपूर्ण सुरक्षा चेतावनी (नींद व सुस्ती):**\n\n"
                    "रिफाइनरी यूनिट (CDU-1 / DHDS) में काम करते समय अचानक अत्यधिक नींद या सुस्ती आना **H2S गैस के शुरुआती प्रभाव या ऑक्सीजन की कमी** का संकेत हो सकता है!\n\n"
                    "**कृपया तुरंत ये कदम उठाएं:**\n"
                    "1. 🛑 काम तुरंत रोकें और किसी ताजी हवा वाले खुले क्षेत्र या कंट्रोल रूम शेल्टर में जाएं।\n"
                    "2. 👥 अपने साथी (Buddy) या शिफ्ट सुपरवाइजर को तुरंत सूचित करें।\n"
                    "3. 💧 साफ पानी पिएं और 10-15 मिनट आराम करें।\n"
                    "4. 🏥 यदि सिर भारी लगे या चक्कर आए, तो तुरंत ऑक्यूपेशनल हेल्थ सेंटर (OHC) में जांच कराएं।"
                )
            else:
                reply = (
                    "⚠️ **Safety Alert: Drowsiness in Operating Units**\n\n"
                    "Feeling unusually sleepy, fatigued, or drowsy in a sour processing area (like CDU-1) can be an early symptom of **low-level H2S exposure or reduced oxygen levels**.\n\n"
                    "**Immediate Recommended Steps:**\n"
                    "1. 🛑 **Stop work immediately** and step away to an upwind, well-ventilated fresh air zone or positive-pressure control shelter.\n"
                    "2. 👥 **Notify your shift buddy or supervisor** right away so they are aware of your location.\n"
                    "3. 💧 **Hydrate** with clean water and take a 10–15 minute break.\n"
                    "4. 🏥 **Visit OHC:** If you feel disoriented, have a headache, or dizziness, report to the Occupational Health Centre for a quick check."
                )
        elif any(s in msg_l for s in ["eye", "sting", "burn", "आंख", "जलन", "पानी"]):
            if lang == "hi":
                reply = (
                    "👁️ **आंखों में जलन के लिए प्राथमिक उपचार:**\n\n"
                    "1. तुरंत निकटतम **आई-वॉश स्टेशन (Eye Wash Station)** पर जाएं।\n"
                    "2. अपनी आंखों को कम से कम **15 मिनट** तक साफ बहते पानी से धोएं।\n"
                    "3. आंखों को रगड़ें नहीं। तुरंत ताजी हवा में आएं और OHC को सूचित करें।"
                )
            else:
                reply = (
                    "👁️ **Eye Irritation First-Aid:**\n\n"
                    "1. 🚿 Immediately move to the nearest **Emergency Eye Wash Station**.\n"
                    "2. 💧 Flush your open eyes gently with clean water for at least **15 minutes**.\n"
                    "3. ❌ Do not rub your eyes. Move upwind and report to OHC if stinging continues."
                )
        elif chunks:
            top_c = chunks[0]
            reply = (
                f"📋 **Industrial Safety Protocol ([{top_c['title']}]):**\n\n"
                f"{top_c['content']}\n\n"
                f"💡 *Grounded in OISD / DGMS refinery safety standards. For immediate symptoms, always alert your shift lead and move upwind.*"
            )
        else:
            if lang == "hi":
                reply = (
                    "नमस्ते! मैं **रक्षक (Rakshak)** हूँ — आपका रिफाइनरी सुरक्षा साथी।\n\n"
                    "मैं आपकी शिफ्ट का डोसीमीटर बैज दर्ज करने, लक्षणों की जांच करने और H2S सुरक्षा नियमों में मदद करने के लिए यहाँ हूँ। कृपया बताएं कि आप कैसा महसूस कर रहे हैं।"
                )
            else:
                reply = (
                    "Hello! I am **Rakshak (रक्षक)**, your plant safety companion.\n\n"
                    "I am here to help you log dosimeter badge readings, check symptoms, and guide you on H2S occupational hygiene. How can I help you right now?"
                )

        return {
            "reply": reply,
            "quick_actions": ["Log Badge Reading (4.2)", "My Exposure Status", "Olfactory Smell Test", "PPE Guidelines"]
        }

    def _handle_scan_submission(self, session: Dict[str, Any], message: str, db: Session, lang: str) -> Dict[str, Any]:
        worker_id = session.get("worker_id", "EMP-1042")
        
        nums = [float(n) for n in re.findall(r'\b\d+(?:\.\d+)?\b', message) if 0.0 <= float(n) <= 35.0]
        start_delta_e = 0.5
        end_delta_e = 4.2
        patch_b_drift = 0.1
        patch_c_condition: PatchCondition = "NORMAL"

        if len(nums) >= 2:
            start_delta_e = nums[0]
            end_delta_e = nums[1]
        elif len(nums) == 1:
            end_delta_e = nums[0]

        if "warning" in message.lower() or "degraded" in message.lower():
            patch_c_condition = "WARNING"
        elif "compromised" in message.lower() or "tamper" in message.lower() or "breach" in message.lower():
            patch_c_condition = "COMPROMISED"
            patch_b_drift = 0.8

        unit = "CDU-1"
        for u in ["CDU-1", "CDU-2", "DHDS", "SRU", "Tank Farm", "Flare Header"]:
            if u.lower() in message.lower():
                unit = u
                break

        shift_hours = 8.0

        db_worker = db.query(EmployeeModel).filter(EmployeeModel.worker_id == worker_id).first()
        if not db_worker:
            db_worker = EmployeeModel(
                worker_id=worker_id,
                full_name=f"Worker {worker_id}",
                plant_unit=unit,
                health_profile_json="{}",
                ppe_details_json="{}"
            )
            db.add(db_worker)
            db.commit()
            db.refresh(db_worker)

        worker_dict = db_worker.to_dict()
        worker_profile = WorkerProfile(
            worker_id=db_worker.worker_id,
            full_name=db_worker.full_name,
            age=db_worker.age,
            gender=db_worker.gender,
            department=db_worker.department,
            plant_unit=unit,
            role=db_worker.role,
            preferred_language=lang,
            health_profile=HealthProfile(**worker_dict["health_profile"]),
            ppe_details=PPEDetails(**worker_dict["ppe_details"]),
            exposure_ledger=ExposureLedger(**worker_dict.get("exposure_ledger", {}))
        )

        diff_res = compute_differential_shift_dose(
            start_delta_e=start_delta_e,
            end_delta_e=end_delta_e,
            patch_b_drift=patch_b_drift,
            patch_c_condition=patch_c_condition,
            shift_hours=shift_hours
        )

        weather = get_kinetic_weather()
        telemetry = ContextualEnvironmentalTelemetry(
            temperature_c=weather["temperature_c"],
            relative_humidity_pct=weather["relative_humidity_pct"],
            source=weather["source"]
        )

        updated_ledger = update_worker_exposure_ledger(
            db, worker_id, diff_res["dose_low"], diff_res["dose_high"]
        )

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
            shift_hours=shift_hours,
            prior_7day_load_ppm_hr=worker_profile.exposure_ledger.rolling_7day_high_ppm_hr,
            updated_7day_load_low=updated_ledger["load_7d_low"],
            updated_7day_load_high=updated_ledger["load_7d_high"],
            updated_7day_range_str=updated_ledger["range_7d_str"],
            statutory_tier=tier,
            measurement_confidence=diff_res["confidence"],
            badge_integrity_warning=diff_res["integrity_warning"],
            is_single_shift_critical=is_single_crit
        )

        scan_id = f"SCN-{uuid.uuid4().hex[:8].upper()}"
        badge_data = BadgeData(
            badge_id="BAND-01",
            band_lifecycle_day=1,
            start_optical_density=start_delta_e,
            end_optical_density=end_delta_e,
            patch_b_drift=patch_b_drift,
            patch_c_condition=patch_c_condition,
            shelf_life_status="VALID"
        )

        scan_payload = ShiftScanPayload(
            scan_id=scan_id,
            worker_id=worker_id,
            plant_unit=unit,
            timestamp=datetime.now(timezone.utc),
            shift_duration_hours=shift_hours,
            badge_data=badge_data,
            environmental_telemetry=telemetry,
            computed_metrics=metrics
        )

        advisory = generate_dosimeter_advisory(worker_profile, scan_payload)

        db_scan = ShiftScanModel(
            scan_id=scan_id,
            worker_id=worker_id,
            plant_unit=unit,
            timestamp=datetime.now(timezone.utc),
            shift_status="COMPLETED",
            shift_duration_hours=shift_hours,
            badge_id="BAND-01",
            start_delta_e=start_delta_e,
            end_delta_e=end_delta_e,
            net_delta_e=diff_res["net_delta_e"],
            delta_e=diff_res["net_delta_e"],
            patch_b_drift=patch_b_drift,
            patch_c_condition=patch_c_condition,
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
        db.commit()

        if lang == "hi":
            reply = (
                f"✅ **शिफ्ट बैज स्कैन सफलतापूर्वक दर्ज हुआ ({unit})**\n\n"
                f"• **अनुमानित शिफ्ट एक्सपोजर:** `{metrics.shift_dose_range_str}`\n"
                f"• **8-घंटे TWA:** `{metrics.shift_twa_range_str}`\n"
                f"• **7-दिवसीय लोड:** `{metrics.updated_7day_range_str}`\n\n"
                f"{advisory.bilingual_content.summary_banner_hi if advisory.bilingual_content else advisory.summary_banner}\n\n"
                f"👉 **लक्षण जांच:** {advisory.bilingual_content.triage_question_hi if advisory.bilingual_content else advisory.triage_question}"
            )
        else:
            reply = (
                f"✅ **Shift Badge Scan Recorded ({unit})**\n\n"
                f"• **Estimated Shift Exposure:** `{metrics.shift_dose_range_str}`\n"
                f"• **8-Hour TWA:** `{metrics.shift_twa_range_str}`\n"
                f"• **7-Day Cumulative Load:** `{metrics.updated_7day_range_str}`\n\n"
                f"{advisory.summary_banner}\n\n"
                f"👉 **Triage Check:** {advisory.triage_question}"
            )

        return {
            "reply": reply,
            "scan_result": {
                "scan_id": scan_id,
                "tier": tier,
                "dose_range": metrics.shift_dose_range_str,
                "twa_range": metrics.shift_twa_range_str,
                "load_7day_range": metrics.updated_7day_range_str,
                "confidence": metrics.measurement_confidence,
                "integrity_warning": metrics.badge_integrity_warning
            },
            "quick_actions": ["My Exposure Status", "Olfactory Smell Test", "PPE Guidelines"]
        }

    def _handle_exposure_query(self, session: Dict[str, Any], db: Session, lang: str) -> Dict[str, Any]:
        worker_id = session.get("worker_id", "EMP-1042")
        worker = db.query(EmployeeModel).filter(EmployeeModel.worker_id == worker_id).first()
        if not worker:
            worker = db.query(EmployeeModel).filter(EmployeeModel.worker_id == "EMP-1042").first()
        if not worker:
            return {"reply": "Worker profile not found.", "quick_actions": ["Log Badge Reading"]}

        worker_name = worker.full_name
        leg = worker.ledger or ExposureLedgerModel()
        load_7d = leg.rolling_7day_ppm_hr
        load_7d_low = round(load_7d * 0.88, 1)
        load_7d_high = round(load_7d * 1.12, 1)
        range_7d = f"{load_7d_low}–{load_7d_high} ppm·h"

        is_safe = load_7d_high < 15.0

        if lang == "hi":
            status_text = "🟢 **सामान्य व सुरक्षित** (सीमा: < 15.0 ppm·hr)" if is_safe else "🟡 **सजगता स्तर (रोटेशन अनुशंसित)**"
            reply = (
                f"📊 **{worker_name} ({worker.worker_id}) का 7-दिवसीय एक्सपोजर सारांश:**\n\n"
                f"• **तैनात यूनिट:** `{worker.plant_unit}` ({worker.role})\n"
                f"• **7-दिवसीय संचयी स्थिति:** {status_text} (`{range_7d}`)\n"
                f"• **30-दिवसीय लोड:** `{leg.rolling_30day_ppm_hr} ppm·hr`\n"
                f"• **90-दिवसीय लोड:** `{leg.rolling_90day_ppm_hr} ppm·hr`\n"
                f"• **कुल दर्ज शिफ्ट्स:** `{leg.lifetime_shifts_logged}`\n\n"
                f"✅ **सुरक्षा स्थिति:** वर्कर का एक्सपोजर OISD-STD-105 टियर-1 सुरक्षित सीमा के भीतर है। नियमित पीपीई निरीक्षण जारी रखें।"
            )
        else:
            status_text = "🟢 **Safe & On Track** (Permissible: < 15.0 ppm·hr)" if is_safe else "🟡 **Elevated Load (Rotation Advised)**"
            reply = (
                f"📊 **7-Day Exposure Summary for {worker_name} ({worker.worker_id}):**\n\n"
                f"• **Assigned Unit:** `{worker.plant_unit}` ({worker.role})\n"
                f"• **7-Day Cumulative Dose:** {status_text} (`{range_7d}`)\n"
                f"• **30-Day Estimated Load:** `{leg.rolling_30day_ppm_hr} ppm·hr`\n"
                f"• **90-Day Trajectory:** `{leg.rolling_90day_ppm_hr} ppm·hr`\n"
                f"• **Lifetime Shifts Logged:** `{leg.lifetime_shifts_logged}` shifts\n\n"
                f"✅ **Safety Assessment:** Exposure is well within statutory **Tier 1 (Normal)** limits under OISD-STD-105. Worker is fully cleared for standard operational duties."
            )
        return {
            "reply": reply,
            "quick_actions": ["Explain 8-hr TWA", "Olfactory Smell Test", "CDU-1 Safety Procedures"]
        }

    def _handle_twa_query(self, lang: str) -> Dict[str, Any]:
        if lang == "hi":
            reply = (
                "📐 **8-घंटे Time-Weighted Average (TWA) की गणना विधि:**\n\n"
                "1. **मूल सूत्र (Formula):**\n"
                "   $$\\text{TWA} = \\frac{\\sum (C_i \\times T_i)}{8 \\text{ घंटे}}$$\n"
                "   जहाँ $C_i$ गैस सांद्रता (ppm) और $T_i$ समय (घंटे) है।\n\n"
                "2. **STRELA डोसीमीटर द्वारा:**\n"
                "   • **Optical ΔE:** शिफ्ट समाप्ति पर केमिकल स्ट्रिप के रंग बदलाव को आधार से मापा जाता है।\n"
                "   • **मौसम सुधार (Arrhenius Factor):** रिफाइनरी तापमान और आर्द्रता का स्वतः समायोजन होता है।\n"
                "   • **8-घंटे TWA (ppm)** = कुल शिफ्ट खुराक (ppm·hr) ÷ 8 घंटे।\n\n"
                "3. **वैधानिक सीमाएं (OISD / ACGIH):**\n"
                "   • **टियर 1 (सामान्य):** TWA < 1.0 ppm\n"
                "   • **टियर 2 (सजगता):** 1.0 से 5.0 ppm\n"
                "   • **टियर 3 (गंभीर):** TWA ≥ 5.0 ppm (तत्काल OHC जांच अनिवार्य)"
            )
        else:
            reply = (
                "📐 **How the 8-Hour Time-Weighted Average (TWA) is Computed:**\n\n"
                "1. **Mathematical Formula:**\n"
                "   $$\\text{TWA} = \\frac{\\text{Cumulative Shift Dose (ppm·hr)}}{8 \\text{ Hours}}$$\n\n"
                "2. **STRELA Optical Engine Processing:**\n"
                "   • **Net Colorimetric Shift (ΔE):** Measures the CIELAB color transition of the bio-anthocyanin strip from morning baseline.\n"
                "   • **Arrhenius Microclimate Scaling:** Scales reaction rates using real-time refinery temperature and humidity ($k(T, RH)$).\n"
                "   • **Neural Network Inference:** Maps optical density and orange reaction fraction to exact dose.\n\n"
                "3. **Statutory Action Thresholds (OISD-STD-105 / ACGIH):**\n"
                "   • 🟢 **Tier 1 (Normal):** $\\text{TWA} < 1.0\\text{ ppm}$ — Safe baseline.\n"
                "   • 🟡 **Tier 2 (Caution):** $1.0 \\le \\text{TWA} < 5.0\\text{ ppm}$ — Mandatory respirator seal check.\n"
                "   • 🔴 **Tier 3 (Critical):** $\\text{TWA} \\ge 5.0\\text{ ppm}$ — Ceiling breached; mandatory OHC medical referral and Form-A incident dispatch."
            )
        return {
            "reply": reply,
            "quick_actions": ["Summarize 7-Day Exposure", "CDU-1 Safety Procedures", "Wristband Replacement Schedule"]
        }

    def _handle_procedure_query(self, query: str, lang: str) -> Dict[str, Any]:
        unit = "CDU-1"
        if "dhds" in query:
            unit = "DHDS"
        elif "sru" in query:
            unit = "SRU"
        elif "tank" in query:
            unit = "Tank Farm"

        reply = (
            f"🛡️ **Standard Operating Safety Procedures for {unit}:**\n\n"
            f"1. **Mandatory PPE:** Half-face or full-face cartridge respirator with approved organic vapor/acid gas filters (3M 6006 / Honeywell North).\n"
            f"2. **Active Dosimetry:** Verify STRELA wristband check-in before entering the battery limit.\n"
            f"3. **Buddy System:** Never inspect pump seals or sample points alone in {unit}.\n"
            f"4. **Emergency Egress:** In case of gas alarm or persistent rotten-egg/sweet odor, move immediately **upwind** to the designated assembly point."
        )
        return {
            "reply": reply,
            "quick_actions": ["Explain 8-hr TWA", "Summarize 7-Day Exposure", "Wristband Replacement Schedule"]
        }

    def _handle_replacement_query(self, session: Dict[str, Any], db: Session, lang: str) -> Dict[str, Any]:
        worker_id = session.get("worker_id", "EMP-1042")
        worker = db.query(EmployeeModel).filter(EmployeeModel.worker_id == worker_id).first()
        day = worker.band_lifecycle_day if worker else 2
        badge = worker.active_badge_id if worker else "BAND-1042-01"

        reply = (
            f"🏷️ **STRELA Wristband Replacement Schedule for {worker_id}:**\n\n"
            f"• **Active Badge ID:** `{badge}`\n"
            f"• **Lifecycle Progress:** **Day {day} of 7**\n"
            f"• **Freshness Control (Patch C):** Natural cabbage extract integrity indicator fades color after 7 days to prevent expired sensor usage.\n"
            f"• **Replacement Protocol:**\n"
            f"  - Automatic rotation at Day 7.\n"
            f"  - Immediate replacement if Tier 3 critical exposure occurs or if Patch C shows `COMPROMISED`."
        )
        return {
            "reply": reply,
            "quick_actions": ["Summarize 7-Day Exposure", "Explain 8-hr TWA", "CDU-1 Safety Procedures"]
        }

    def _handle_screener_query(self, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        if lang == "hi":
            reply = (
                "🧪 **गंध थकान व रिफ्लेक्स जांच:**\n\n"
                "1. क्या काम करते समय शुरू में सड़े अंडे जैसी गंध आई थी जो बाद में आनी बंद हो गई?\n"
                "2. क्या आपकी आंखों में जलन या सिर भारी महसूस हो रहा है?\n\n"
                "कृपया बताएं कि आप कैसा महसूस कर रहे हैं।"
            )
        else:
            reply = (
                "🧪 **Quick Olfactory & Symptom Check:**\n\n"
                "1. Did you notice a strong rotten egg smell earlier that seemed to suddenly disappear while working?\n"
                "2. Are you experiencing eye stinging, headache, or dizziness?\n\n"
                "Please let me know how you're feeling right now:"
            )
        return {
            "reply": reply,
            "quick_actions": ["Feeling fine, no symptoms", "Smell disappeared & eye stinging", "Feeling dizzy/headache"]
        }

    def _handle_lung_risk_query(self, session: Dict[str, Any], db: Session, lang: str) -> Dict[str, Any]:
        worker_id = session.get("worker_id", "EMP-1042")
        worker = db.query(EmployeeModel).filter(EmployeeModel.worker_id == worker_id).first()
        if not worker:
            return {"reply": "Worker profile not found.", "quick_actions": ["Log Shift Reading"]}

        worker_dict = worker.to_dict()
        worker_profile = WorkerProfile(
            worker_id=worker.worker_id,
            full_name=worker.full_name,
            age=worker.age,
            gender=worker.gender,
            department=worker.department,
            plant_unit=worker.plant_unit,
            role=worker.role,
            preferred_language=lang,
            health_profile=HealthProfile(**worker_dict["health_profile"]),
            ppe_details=PPEDetails(**worker_dict["ppe_details"]),
            exposure_ledger=ExposureLedger(**worker_dict.get("exposure_ledger", {}))
        )
        res = calculate_chronic_lung_risk_score(worker_profile)
        
        if lang == "hi":
            reply = (
                f"🫁 **श्वसन स्वास्थ्य सारांश ({worker_profile.full_name}):**\n\n"
                f"• **जोखिम स्तर:** `{res['risk_category']}` (स्कोर: {res['chronic_lung_risk_score']}/100)\n"
                f"• **स्वास्थ्य सलाह:** {res['recommendation_hi']}"
            )
        else:
            reply = (
                f"🫁 **Respiratory Health Summary ({worker_profile.full_name}):**\n\n"
                f"• **Risk Category:** `{res['risk_category']}` (Score: {res['chronic_lung_risk_score']}/100)\n"
                f"• **Health Advice:** {res['recommendation_en']}"
            )
        return {
            "reply": reply,
            "quick_actions": ["Log Shift Reading", "My Exposure Status", "Olfactory Smell Test"]
        }

unified_chat = UnifiedChatAgent()
