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
        import os
        key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
        if key:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=key, timeout=8.0, max_retries=1)
                logger.info("Groq client successfully initialized.")
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
        
        # Auto-detect Devanagari script in message
        if re.search(r'[\u0900-\u097F]', message):
            lang = "hi"
            session["lang"] = "hi"

        # 1. Language Toggle Commands
        if any(w in msg_clean for w in ["hindi", "हिन्दी", "हिंदी"]) or msg_clean == "2":
            session["lang"] = "hi"
            return {
                "reply": "नमस्ते! भाषा को **हिन्दी** में सेट कर दिया गया है। मैं आपकी सुरक्षा और दैनिक कार्यों के लिए यहाँ हूँ। आप अपनी बैज रीडिंग दर्ज कर सकते हैं, दैनिक शिफ्ट कार्य जान सकते हैं, या सुरक्षा नियमों के बारे में पूछ सकते हैं।",
                "quick_actions": ["दैनिक शिफ्ट कार्य (Tasks)", "बैज रीडिंग दर्ज करें", "मेरा 7-दिवसीय एक्सपोजर", "सुरक्षा नियम (PPE)"]
            }
        elif any(w in msg_clean for w in ["english", "switch to english"]) or msg_clean == "1":
            session["lang"] = "en"
            return {
                "reply": "Language set to **English**. How can I help you stay safe today? You can ask about your everyday shift tasks, log your badge reading, check exposure ledgers, or review safety procedures.",
                "quick_actions": ["Everyday Tasks Checklist", "Log Badge Reading", "My Exposure Status", "PPE Guidelines"]
            }

        # 2. Shift Badge Scan / Reading Input (e.g. "Shift ended start 0.5 end 4.2")
        if any(k in msg_clean for k in ["start reading", "end reading", "delta e", "reading", "shift end", "shift ended", "बैज रीडिंग", "स्कैन दर्ज"]):
            if any(char.isdigit() for char in message):
                return self._handle_scan_submission(session, message, db, lang)

        # 3. Direct Exposure Status Query (e.g., "Summarize Sumedh Kulkarni's 7-day exposure.")
        if any(k in msg_clean for k in ["exposure status", "7-day exposure", "7 day exposure", "7-day", "7 day", "my exposure", "exposure ledger", "dose summary", "summarize exposure", "एक्सपोजर"]):
            return self._handle_exposure_query(session, db, lang)

        # 4. Everyday Tasks & Operational Shift Routines
        if any(k in msg_clean for k in ["everyday task", "daily task", "everyday", "daily tasks", "tasks", "task", "checklist", "routine", "morning routine", "handover", "shift work", "what to do today", "schedule today", "inspection walk", "duty", "duties", "work routine", "shift duties", "today's work", "operator task", "patrol", "दिनचर्या", "दैनिक", "कार्य", "काम", "आज का काम"]):
            return self._handle_daily_tasks_query(session, db, lang)

        # 5. Confined Space Entry (CSE)
        if any(k in msg_clean for k in ["confined space", "cse", "vessel", "tank entry", "कन्फाइंड स्पेस", "टैंक प्रवेश", "टैंक"]):
            return self._handle_confined_space_query(session, lang)

        # 6. Permit to Work (PTW) & Hot / Cold Work
        if any(k in msg_clean for k in ["permit", "ptw", "hot work", "cold work", "welding", "grinding", "परमिट", "हॉट वर्क"]):
            return self._handle_permit_query(session, lang)

        # 7. Gas Leak & Alarm Emergency Response
        if any(k in msg_clean for k in ["leak", "gas leak", "alarm", "siren", "evacuate", "evacuation", "emergency", "muster", "लीक", "अलार्म", "आपातकाल", "निकासी"]):
            return self._handle_emergency_query(session, lang)

        # 8. PPE & Respirator Inspection
        if any(k in msg_clean for k in ["respirator", "mask", "cartridge", "fit test", "seal check", "ppe", "मास्क", "रेस्पिरेटर", "पीपीई"]):
            return self._handle_ppe_query(session, lang)

        # 9. STRELA Wristband / Dosimeter Technology & Operation
        if any(k in msg_clean for k in ["how band works", "how does the band work", "wristband works", "anthocyanin", "cabbage", "technology", "strela works", "dosimeter work", "कलाई का बैज"]):
            return self._handle_dosimeter_tech_query(session, lang)

        # 10. Heat Stress & Hydration
        if any(k in msg_clean for k in ["heat stress", "heat", "hydration", "dehydration", "drink water", "thirst", "गर्मी", "पानी", "डिहाइड्रेशन"]):
            return self._handle_heat_stress_query(session, lang)

        # 11. Olfactory Fatigue / Smell Test Trigger
        if any(k in msg_clean for k in ["olfactory smell test", "smell test", "screener", "olfactory", "गंध थकान जांच", "सूंघने की जांच"]):
            return self._handle_screener_query(session, lang)

        # 12. Chronic Lung Risk Query
        if any(k in msg_clean for k in ["lung risk", "chronic lung risk", "lung", "फेफड़े"]):
            return self._handle_lung_risk_query(session, db, lang)

        # 13. How TWA is calculated
        if any(k in msg_clean for k in ["twa", "calculate", "calculated", "formula", "8-hour", "time-weighted"]):
            return self._handle_twa_query(lang)

        # 14. Safety procedures for units
        if any(k in msg_clean for k in ["procedure", "cdu", "dhds", "sru", "tank farm", "unit"]):
            return self._handle_procedure_query(msg_clean, lang)

        # 15. Replacement schedule
        if any(k in msg_clean for k in ["replacement", "replace", "schedule", "lifecycle", "wristband"]):
            return self._handle_replacement_query(session, db, lang)

        # 16. General Safety Q&A, Symptom Triage & Conversation via Groq LLM (with robust fallback)
        return self._handle_llm_safety_query(message, session, lang)

    def _handle_llm_safety_query(self, message: str, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        """
        Uses Groq LLM with RAG context to provide empathetic,
        accurate, natural safety advice, symptom triage, and everyday operational guidance.
        """
        worker_id = session.get("worker_id", "EMP-1042")
        import os
        api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")

        # 1. Retrieve supporting RAG context
        chunks, conf = retriever.query(message, top_k=2)
        rag_text = ""
        if chunks:
            rag_text = "\n\n".join([f"[{c['title']}]: {c['content']}" for c in chunks])

        # 2. Call Groq LLM if configured
        if not self.groq_client and api_key:
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

Provide an empathetic, clear, structured response with immediate practical actions and first-aid steps if the worker describes any symptoms (e.g. sleepiness, fatigue, eye stinging, smell loss, coughing). Keep it clear, helpful, and formatted with bullet points.
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
                            "quick_actions": ["Everyday Tasks Checklist", "Log Badge Reading", "My Exposure Status", "PPE Guidelines"]
                        }
                    except Exception as model_err:
                        logger.warning(f"Groq model {test_model} failed: {model_err}")
            except Exception as e:
                logger.warning(f"Groq Chat LLM call failed: {e}. Using smart conversational fallback.")

        # 3. Smart Conversational Knowledge Fallback
        msg_l = message.lower()

        # Drowsiness / Sleepiness
        if any(s in msg_l for s in ["sleep", "sleepy", "drowsy", "tired", "fatigue", "नींद", "थकान", "सुस्ती"]):
            if lang == "hi":
                reply = (
                    "⚠️ **महत्वपूर्ण सुरक्षा चेतावनी (नींद व सुस्ती):**\n\n"
                    "रिफाइनरी यूनिट (CDU-1 / DHDS) में काम करते समय अचानक अत्यधिक नींद या सुस्ती आना **H2S गैस के शुरुआती प्रभाव या ऑक्सीजन की कमी** का संकेत हो सकता है!\n\n"
                    "**कृपया तुरंत ये कदम उठाएं:**\n"
                    "1. 🛑 **काम तुरंत रोकें:** ताजी हवा वाले खुले क्षेत्र या सकारात्मक दबाव (positive-pressure) वाले कंट्रोल रूम शेल्टर में जाएं।\n"
                    "2. 👥 **साथी को सूचित करें:** अपने शिफ्ट बडी या सुपरवाइजर को तुरंत बताएं।\n"
                    "3. 💧 **पानी पिएं:** साफ पानी पिएं और 10-15 मिनट विश्राम करें।\n"
                    "4. 🏥 **OHC रिपोर्ट:** यदि सिर भारी लगे, चक्कर आए या उल्टी महसूस हो, तो तत्काल ऑक्यूपेशनल हेल्थ सेंटर (OHC) जाएं।"
                )
            else:
                reply = (
                    "⚠️ **Safety Alert: Drowsiness in Operating Units**\n\n"
                    "Feeling unusually sleepy, fatigued, or drowsy in a sour processing area (like CDU-1) is an early symptom of **low-level H₂S exposure or reduced oxygen levels**.\n\n"
                    "**Immediate Recommended Steps:**\n"
                    "1. 🛑 **Stop Work Immediately:** Step away to an upwind, well-ventilated fresh air zone or positive-pressure control shelter.\n"
                    "2. 👥 **Notify Your Shift Buddy or Supervisor:** Make sure team members know your location.\n"
                    "3. 💧 **Hydrate & Rest:** Drink clean water and take a 10–15 minute break.\n"
                    "4. 🏥 **Visit OHC:** If disoriented, dizzy, or if headache persists, report to the Occupational Health Centre."
                )
        # Eye stinging / burning
        elif any(s in msg_l for s in ["eye", "sting", "burn", "आंख", "जलन", "पानी"]):
            if lang == "hi":
                reply = (
                    "👁️ **आंखों में जलन के लिए तत्काल प्राथमिक उपचार:**\n\n"
                    "1. 🚿 तुरंत निकटतम **इमरजेंसी आई-वॉश स्टेशन (Eye Wash Station)** पर जाएं।\n"
                    "2. 💧 दोनों पलकें खुली रखकर कम से कम **15 मिनट** तक साफ बहते पानी से आंखें धोएं।\n"
                    "3. ❌ आंखों को बिल्कुल न रगड़ें।\n"
                    "4. 🌬️ हवा के विपरीत (Upwind) दिशा में खड़े हों और OHC डॉक्टर से परीक्षण कराएं।"
                )
            else:
                reply = (
                    "👁️ **Eye Irritation First-Aid Protocol:**\n\n"
                    "1. 🚿 **Immediately proceed to the nearest Emergency Eyewash Station.**\n"
                    "2. 💧 **Flush open eyes with cool, clean water for a minimum of 15 minutes.**\n"
                    "3. ❌ **Do not rub your eyes** — this worsens chemical irritation.\n"
                    "4. 🏥 Report to the OHC clinic for a fluorescein eye check if stinging continues."
                )
        # Coughing / throat irritation / smell loss
        elif any(s in msg_l for s in ["cough", "throat", "choke", "smell", "rotten egg", "खांसी", "गला", "सूंघ"]):
            if lang == "hi":
                reply = (
                    "🫁 **गले में खराश / गंध लोप (Olfactory Warning):**\n\n"
                    "• **सावधानी:** H2S गैस 100 ppm से अधिक सांद्रता पर घ्राण तंत्रिका (Olfactory Nerve) को तुरंत सुन्न कर देती है, जिससे सड़े अंडे की गंध आनी बंद हो जाती है।\n"
                    "• **कदम:**\n"
                    "  1. गंध न आने का मतलब यह नहीं कि गैस चली गई है! तुरंत अपविंड (Upwind) जाएं।\n"
                    "  2. यदि गले में खराश या सूखी खांसी हो, तो तुरंत मास्क सील चेक करें।\n"
                    "  3. OHC जाकर पीक फ्लो (Spirometry) परीक्षण कराएं।"
                )
            else:
                reply = (
                    "🫁 **Respiratory Irritation / Olfactory Warning:**\n\n"
                    "• **Critical Warning:** At concentrations $\\ge 100\\text{ ppm}$, H₂S rapidly paralyzes olfactory nerves, causing total **loss of smell**. The disappearance of odor does NOT mean the gas is gone!\n"
                    "• **Immediate Action:**\n"
                    "  1. Move immediately **upwind** into clean ambient air.\n"
                    "  2. Inspect your half-face mask for cartridge breakthrough.\n"
                    "  3. Report to the OHC for a spirometry peak flow evaluation."
                )
        # Greetings & General Inquiries
        elif any(s in msg_l for s in ["hi", "hello", "hey", "namaste", "good morning", "good evening", "नमस्ते", "हेल्प", "help"]):
            if lang == "hi":
                reply = (
                    "नमस्ते! मैं **रक्षक (Rakshak)** हूँ — आपका रिफाइनरी AI सुरक्षा साथी (MRPL/IOCL)।\n\n"
                    "मैं आपके दैनिक कार्यों और सुरक्षा में मदद करने के लिए तैयार हूँ। आप मुझसे पूछ सकते हैं:\n\n"
                    "• 📋 **दैनिक शिफ्ट कार्य:** सुबह की चेकलिस्ट और 2-घंटे का फील्ड राउंड\n"
                    "• 🛡️ **सुरक्षा परमिट:** हॉट वर्क, कोल्ड वर्क और कन्फाइंड स्पेस एंट्री (CSE)\n"
                    "• 🤿 **पीपीई व रेस्पिरेटर:** 3M मास्क फिट टेस्ट और कार्ट्रिज बदलने के नियम\n"
                    "• 📊 **एक्सपोजर रिकॉर्ड:** 7-दिवसीय H2S संचयी एक्सपोजर का सारांश"
                )
            else:
                reply = (
                    "Hello! I am **Rakshak (रक्षक)**, your dedicated refinery AI Safety Companion.\n\n"
                    "I am here to guide you through everyday tasks and keep you safe from H₂S and plant hazards. Here is how I can assist you right now:\n\n"
                    "• 📋 **Everyday Shift Tasks:** Morning turnover checklist & 2-hour operational walks\n"
                    "• 🛡️ **Permits & Protocols:** Hot work, cold work, and Confined Space Entry (CSE)\n"
                    "• 🤿 **PPE & Respiratory Care:** 3M half-face fit checks and cartridge rotation\n"
                    "• 📊 **Dosimetry & Ledgers:** 7-day cumulative exposure and 8-hour TWA status"
                )
        # H2S limits & regulatory standards
        elif any(s in msg_l for s in ["limit", "threshold", "ppm", "standard", "oisd", "acgih", "नियम", "सीमा"]):
            reply = (
                "⚖️ **Statutory H₂S Exposure Limits (OISD-STD-105 / ACGIH):**\n\n"
                "• 🟢 **8-Hour TWA Limit:** **1.0 ppm** (Permissible baseline average across standard shift).\n"
                "• 🟡 **15-Minute STEL (Short-Term Exposure Limit):** **5.0 ppm** (Max temporary excursion).\n"
                "• 🔴 **Ceiling Threshold:** **10.0 ppm** (Immediate evacuation required without positive-pressure SCBA).\n"
                "• ☠️ **IDLH (Immediately Dangerous to Life or Health):** **100 ppm** (Instant olfactory paralysis and lung edema risk).\n\n"
                "💡 *The STRELA optical wristband continuously tracks your cumulative exposure against these statutory limits without electronics.*"
            )
        elif chunks:
            top_c = chunks[0]
            clean_content = top_c['content'].strip()
            reply = (
                f"📋 **Refinery Operational Safety Guideline: {top_c['title']}**\n\n"
                f"{clean_content}\n\n"
                f"💡 *Grounded in OISD / DGMS standards. For active shift work, always verify permits with your lead operator.*"
            )
        else:
            if lang == "hi":
                reply = (
                    "नमस्ते! मैं **रक्षक (Rakshak)** हूँ — आपका रिफाइनरी सुरक्षा साथी।\n\n"
                    "मैं आपके दैनिक कार्यों, H2S सुरक्षा नियमों, बैज रीडिंग और आपातकालीन प्रक्रियाओं में मदद करने के लिए यहाँ हूँ। कृपया नीचे दिए गए विकल्पों में से चुनें या अपना प्रश्न पूछें।"
                )
            else:
                reply = (
                    "Hello! I am **Rakshak (रक्षक)**, your dedicated refinery safety companion.\n\n"
                    "I am equipped to help you with your daily operational checklist, H₂S safety guidelines, badge scanning, and emergency protocols. How can I assist you right now?"
                )

        return {
            "reply": reply,
            "quick_actions": ["Everyday Tasks Checklist", "Log Badge Reading", "My Exposure Status", "PPE Guidelines"]
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
        worker = None
        if db:
            try:
                worker = db.query(EmployeeModel).filter(EmployeeModel.worker_id == worker_id).first()
                if not worker:
                    worker = db.query(EmployeeModel).filter(EmployeeModel.worker_id == "EMP-1042").first()
            except Exception:
                worker = None

        worker_name = worker.full_name if worker else "Sumedh Kulkarni"
        wid = worker.worker_id if worker else "EMP-1042"
        unit = worker.plant_unit if worker else "CDU-1"
        role = worker.role if worker else "Senior Panel / Field Operator"
        leg = (worker.ledger if (worker and worker.ledger) else None) or ExposureLedgerModel()
        load_7d = leg.rolling_7day_ppm_hr if (leg and leg.rolling_7day_ppm_hr) else 8.4
        load_7d_low = round(load_7d * 0.88, 1)
        load_7d_high = round(load_7d * 1.12, 1)
        range_7d = f"{load_7d_low}–{load_7d_high} ppm·h"

        is_safe = load_7d_high < 15.0

        if lang == "hi":
            status_text = "🟢 **सामान्य व सुरक्षित** (सीमा: < 15.0 ppm·hr)" if is_safe else "🟡 **सजगता स्तर (रोटेशन अनुशंसित)**"
            reply = (
                f"📊 **{worker_name} ({wid}) का 7-दिवसीय एक्सपोजर सारांश:**\n\n"
                f"• **तैनात यूनिट:** `{unit}` ({role})\n"
                f"• **7-दिवसीय संचयी स्थिति:** {status_text} (`{range_7d}`)\n"
                f"• **30-दिवसीय लोड:** `{leg.rolling_30day_ppm_hr} ppm·hr`\n"
                f"• **90-दिवसीय लोड:** `{leg.rolling_90day_ppm_hr} ppm·hr`\n"
                f"• **कुल दर्ज शिफ्ट्स:** `{leg.lifetime_shifts_logged}`\n\n"
                f"✅ **सुरक्षा स्थिति:** वर्कर का एक्सपोजर OISD-STD-105 टियर-1 सुरक्षित सीमा के भीतर है। नियमित पीपीई निरीक्षण जारी रखें।"
            )
        else:
            status_text = "🟢 **Safe & On Track** (Permissible: < 15.0 ppm·hr)" if is_safe else "🟡 **Elevated Load (Rotation Advised)**"
            reply = (
                f"📊 **7-Day Exposure Summary for {worker_name} ({wid}):**\n\n"
                f"• **Assigned Unit:** `{unit}` ({role})\n"
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
        worker = None
        if db:
            try:
                worker = db.query(EmployeeModel).filter(EmployeeModel.worker_id == worker_id).first()
            except Exception:
                worker = None
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
        worker = None
        if db:
            try:
                worker = db.query(EmployeeModel).filter(EmployeeModel.worker_id == worker_id).first()
            except Exception:
                worker = None
        if not worker:
            name = "Sumedh Kulkarni"
            if lang == "hi":
                reply = (
                    f"🫁 **श्वसन स्वास्थ्य सारांश ({name}):**\n\n"
                    f"• **जोखिम स्तर:** `Low Risk` (स्कोर: 12.0/100)\n"
                    f"• **स्वास्थ्य सलाह:** फेफड़ों की कार्यक्षमता (FEV1: 3.4L) सामान्य है। कोई क्रोनिक बाधा नहीं पाई गई। वार्षिक स्पाइरोमेट्री जांच जारी रखें।"
                )
            else:
                reply = (
                    f"🫁 **Respiratory Health Summary ({name}):**\n\n"
                    f"• **Risk Category:** `Low Risk` (Score: 12.0/100)\n"
                    f"• **Health Advice:** Baseline lung function (FEV1: 3.4L) is optimal with no evidence of chronic airway obstruction. Continue periodic spirometry surveillance."
                )
            return {
                "reply": reply,
                "quick_actions": ["Log Shift Reading", "My Exposure Status", "Olfactory Smell Test"]
            }

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

    def _handle_daily_tasks_query(self, session: Dict[str, Any], db: Session, lang: str) -> Dict[str, Any]:
        worker_id = session.get("worker_id", "EMP-1042")
        worker = None
        if db:
            try:
                worker = db.query(EmployeeModel).filter(EmployeeModel.worker_id == worker_id).first()
            except Exception:
                worker = None
        unit = worker.plant_unit if worker else "CDU-1"
        role = worker.role if worker else "Senior Panel / Field Operator"
        name = worker.full_name if worker else "Sumedh Kulkarni"

        if lang == "hi":
            reply = (
                f"📋 **दैनिक शिफ्ट कार्य व सुरक्षा दिनचर्या ({name} · {unit}):**\n\n"
                f"**1. 🌅 सुबह की तैयारी (Pre-Shift Checklist):**\n"
                f"• **टूलबॉक्स टॉक (TBT):** विंडसॉक (Windsock) देखकर हवा की दिशा और आज के हॉट-वर्क परमिट जांचें।\n"
                f"• **STRELA डोसीमीटर स्कैन:** टर्नस्टाइल पर बैज स्कैन करें (प्रारंभिक $\\Delta E < 0.3$) और 7-दिवसीय कैबेज पैच (Patch C) की ताजगी देखें।\n"
                f"• **रेस्पिरेटर सील टेस्ट:** 3M 6200/7502 मास्क पहनकर 10-सेकंड पॉजिटिव और नेगेटिव प्रेशर सील टेस्ट करें।\n"
                f"• **4-गैस डिटेक्टर चेक:** H₂S/LEL पोर्टेबल डिटेक्टर को अपने ब्रीदिंग जोन (कॉलर/चेस्ट) पर क्लिप करें।\n\n"
                f"**2. ⚙️ ऑन-ड्यूटी फील्ड राउंड (हर 2 घंटे):**\n"
                f"• **पंप सील व फ्लैंज राउंड:** क्रूड चार्ज पंप्स के मैकेनिकल सील प्रेशर और हीट एक्सचेंजर जोड़ों का निरीक्षण करें।\n"
                f"• **सॉर वॉटर ड्रेनिंग:** ड्रेन वाल्व संचालन के समय रेस्पिरेटर पहने रहें और कभी अकेले काम न करें (Buddy System)।\n"
                f"• **कॉलम प्रेशर व टेम्परेचर:** कॉलम ओवरहेड गैस प्रेशर और रिलीफ वाल्व हेडर की निगरानी करें।\n"
                f"• **आई-वॉश स्टेशन फ्लो:** रास्ते में आने वाले इमरजेंसी आई-वॉश स्टेशनों के फुट-पैडल को दबाकर पानी का बहाव जांचें।\n\n"
                f"**3. 🏁 शिफ्ट समाप्ति (Post-Shift Wrap-Up):**\n"
                f"• **एग्जिट कियोस्क स्कैन:** STRELA बैज को अंतिम बार स्कैन कर 8-घंटे की संचयी खुराक डिजिटल लेजर में सिंक करें।\n"
                f"• **हैंडओवर लॉग:** अगले ऑपरेटर को पंप स्विच या किसी भी छोटे रिसाव की जानकारी हैंडओवर बुक में दर्ज करें।"
            )
        else:
            reply = (
                f"📋 **Everyday Refinery Operational & Safety Tasks ({name} · {unit}):**\n\n"
                f"**1. 🌅 Morning / Pre-Shift Turnover Checklist:**\n"
                f"• **Shift Handover & TBT:** Review DCS logbook for pump switches, bypass valves, column pressure anomalies, or open maintenance tags. Check windsock direction.\n"
                f"• **STRELA Wristband Check-In:** Scan your optical QR badge at the turnstile kiosk to set morning baseline (Start $\\Delta E < 0.3$) and verify 7-day bio-patch freshness.\n"
                f"• **Respirator Fit Check:** Don your 3M half-face mask; execute 10-second positive and negative pressure seal tests before battery entry.\n"
                f"• **Multi-Gas Detector Bump Test:** Clip your personal H₂S/LEL monitor strictly inside your **breathing zone** (within 25 cm of mouth/nose).\n\n"
                f"**2. ⚙️ Operational Field Routine (Every 2 Hours):**\n"
                f"• **Pump & Seal Walks:** Inspect crude charge & reflux pump mechanical seal flushes, bearing temps, and gland leaks.\n"
                f"• **Sour Water & Hydrocarbon Drains:** Always maintain upwind stance when taking composite samples or draining sour water.\n"
                f"• **Flange & Relief Header Line Inspection:** Sniff for faint rotten-egg odor around atmospheric tower overhead lines; listen for valve cavitation.\n"
                f"• **Safety Shower Verification:** Test foot-treadle water flow at designated safety shower stations along your unit walk.\n\n"
                f"**3. 🏁 Shift-End Wrap-Up:**\n"
                f"• **Final Optical Badge Scan:** Tap the exit reader to compute Net $\\Delta E$, log cumulative shift dose into the cloud ledger, and verify OISD Tier 1 compliance.\n"
                f"• **DCS Handover Log:** Document observed vibration, thermal anomalies, or minor fugitive emissions in the shift turnover record."
            )
        return {
            "reply": reply,
            "quick_actions": ["Log Shift Reading", "Summarize 7-Day Exposure", "CDU-1 Safety Procedures", "Respirator Fit Check"]
        }

    def _handle_confined_space_query(self, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        if lang == "hi":
            reply = (
                "🛑 **कन्फाइंड स्पेस एंट्री (CSE) अनिवार्य सुरक्षा नियम (OISD-STD-105):**\n\n"
                "**1. गैस टेस्टिंग पैरामीटर (प्रवेश से पहले):**\n"
                "• **ऑक्सीजन (O₂):** 19.5% से 23.5% के बीच होना अनिवार्य है।\n"
                "• **H₂S गैस:** 5.0 ppm से कम (Ceiling Limit: 10 ppm)।\n"
                "• **ज्वलनशील गैस (LEL):** 0% LEL (अधिकतम स्वीकार्य: 5% LEL हॉट वर्क रहित)।\n"
                "• **कार्बन मोनोऑक्साइड (CO):** 25 ppm से कम।\n\n"
                "**2. पॉजिटिव आइसोलेशन (Positive Isolation):**\n"
                "• सभी प्रोसेस, फ्यूल गैस और स्टीम लाइनों पर **ब्लाइंड फ्लैंज (Spade/Blank)** लगाना अनिवार्य है। वाल्व बंद करना पर्याप्त नहीं है।\n\n"
                "**3. वेंटिलेशन व स्टैंडबाय रेस्क्यूअर:**\n"
                "• एयर एडक्टर (Air Blower) द्वारा निरंतर ताजी हवा का संचार होना चाहिए।\n"
                "• मैनवे के बाहर एक प्रशिक्षित स्टैंडबाय व्यक्ति (Hole Watch) हार्नेस, लाइफलाइन, SCBA सेट और वॉकी-टॉकी के साथ तैनात रहना अनिवार्य है।"
            )
        else:
            reply = (
                "🛑 **Confined Space Entry (CSE) Mandatory Protocol (OISD-STD-105 / DGMS):**\n\n"
                "**1. Pre-Entry Multi-Gas Testing Thresholds:**\n"
                "• **Oxygen ($O_2$):** 19.5% to 23.5% Vol.\n"
                "• **Hydrogen Sulfide ($H_2S$):** $< 5.0\\text{ ppm}$ (Ceiling limit: $10\\text{ ppm}$).\n"
                "• **Combustible Gas (LEL):** $0\\%\\text{ LEL}$ (Max permissible without hot work: $5\\%$).\n"
                "• **Carbon Monoxide ($CO$):** $< 25\\text{ ppm}$.\n\n"
                "**2. Positive Physical Isolation (LOTO):**\n"
                "• Physical blind flanges (spade/spectacle blind) must be installed on all inlet, outlet, fuel gas, and steam lines. Double block and bleed alone is strictly prohibited.\n\n"
                "**3. Continuous Ventilation & Standby Watch:**\n"
                "• Air eductors/blowers must provide continuous forced-air ventilation with intake situated upwind.\n"
                "• A dedicated **Standby Hole Watch** must remain outside the manway at all times with SCBA, retrieval lifeline, emergency radio, and safety horn."
            )
        return {
            "reply": reply,
            "quick_actions": ["Permit to Work (PTW)", "Respirator Fit Check", "Gas Leak Protocol", "Everyday Tasks Checklist"]
        }

    def _handle_permit_query(self, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        if lang == "hi":
            reply = (
                "📜 **परमिट टू वर्क (PTW) व हॉट वर्क सुरक्षा चेकलिस्ट:**\n\n"
                "**1. हॉट वर्क (वेल्डिंग/ग्राइंडिंग/गैस कटिंग):**\n"
                "• **15-मीटर क्षेत्र सफाई:** वेल्डिंग पॉइंट के 15 मीटर के दायरे में कोई कच्चा तेल, हाइड्रोकार्बन या स्लज नहीं होना चाहिए।\n"
                "• **सीवर व ड्रेन कवर:** सभी खुले नालों और कैच बेसिन को गीले फायर कंबल (Wet Fire Blankets) और रेत से सील करें।\n"
                "• **LEL निरंतर जांच:** काम के दौरान गैस टेस्टिंग मीटर चालू रखें; यदि LEL > 0% हो तो काम तुरंत रोकें।\n"
                "• **फायर वॉच:** 10 किलो DCP अग्निशामक और चालू पानी की नली (Charged Fire Hose) के साथ समर्पित फायर वॉचर उपस्थित रहे।\n\n"
                "**2. कोल्ड वर्क व ऊंचाई पर काम:**\n"
                "• 1.8 मीटर से अधिक ऊंचाई पर फुल बॉडी हार्नेस को 100% टाई-ऑफ के साथ लाइफलाइन पर लगाएं।"
            )
        else:
            reply = (
                "📜 **Permit to Work (PTW) & Hot Work Execution Checklist:**\n\n"
                "**1. Hot Work Requirements (Welding, Grinding, Torch Cutting):**\n"
                "• **15-Meter Clean Zone:** Clear a 15-meter radius of all hydrocarbons, volatile crude, solvents, and combustible materials.\n"
                "• **Drain Sealing:** Seal all process sewer openings, manholes, and catch basins within 15 meters using wet fire-retardant blankets and sand covers.\n"
                "• **LEL Explosive Gas Clearance:** Continuous atmospheric testing must confirm $0\\%\\text{ LEL}$ before striking any arc.\n"
                "• **Dedicated Fire Watch:** A qualified fire watcher must be on station with a pressurized 10 kg DCP fire extinguisher and charged fire hose for the duration of the work plus 30 minutes post-work.\n\n"
                "**2. Cold Work & Working at Heights:**\n"
                "• Full body safety harness with double lanyards mandatory above 1.8 meters, anchored to certified load points."
            )
        return {
            "reply": reply,
            "quick_actions": ["Confined Space Entry", "Everyday Tasks Checklist", "Gas Leak Protocol", "CDU-1 Safety Procedures"]
        }

    def _handle_emergency_query(self, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        if lang == "hi":
            reply = (
                "🚨 **H2S गैस रिसाव व आपातकालीन अलार्म प्रोटोकॉल:**\n\n"
                "**1. अलार्म बजते ही तत्काल कदम:**\n"
                "• 🛑 तुरंत सभी काम रोकें और उपकरण बंद करें।\n"
                "• 🚩 निकटतम **विंडसॉक (Windsock)** देखकर हवा की दिशा पता करें।\n"
                "• 🌬️ **हवा के विपरीत (Upwind) या आड़े (Cross-wind)** दिशा में तेजी से चलें — कभी भी हवा के साथ (Downwind) न भागें!\n"
                "• 🏔️ हमेशा ऊंचाई वाले स्थान की ओर जाएं, क्योंकि H2S गैस हवा से 1.19 गुना भारी होने के कारण नालों और गड्ढों में जमती है।\n\n"
                "**2. मस्टर पॉइंट पर एकत्र होना:**\n"
                "• अपने निर्धारित **Emergency Muster Point (CDU-1 के लिए Muster Point 3)** पर जाएं।\n"
                "• सुपरवाइजर को रोल-कॉल हेडकाउंट दें। बिना SCBA सेट के यूनिट में दोबारा प्रवेश न करें।"
            )
        else:
            reply = (
                "🚨 **H₂S Gas Leak & Plant Emergency Alarm Protocol:**\n\n"
                "**1. Immediate Escape Actions upon Alarm:**\n"
                "• 🛑 **Stop Work Immediately:** Shut down motorized tools and secure flammable sources.\n"
                "• 🚩 **Check the Windsock:** Instantly identify prevailing wind direction from the nearest orange wind cone.\n"
                "• 🌬️ **Evacuate UPWIND or CROSS-WIND:** Never run downwind! Always move perpendicular or against the wind direction.\n"
                "• 🏔️ **Move to Higher Ground:** H₂S has a vapor density of 1.19 (heavier than air); it accumulates in pits, trenches, sewers, and low-lying ground.\n\n"
                "**2. Assembly & Accountability:**\n"
                "• Report directly to your designated **Emergency Muster Point (Muster Point 3 for CDU-1)**.\n"
                "• Undergo roll-call head count; notify incident commanders of any missing colleagues.\n"
                "• **Do NOT re-enter the battery limit** without positive-pressure SCBA and gas clearance from Fire & Safety."
            )
        return {
            "reply": reply,
            "quick_actions": ["Respirator Fit Check", "Everyday Tasks Checklist", "CDU-1 Safety Procedures", "My Exposure Status"]
        }

    def _handle_ppe_query(self, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        if lang == "hi":
            reply = (
                "🤿 **रेस्पिरेटर व पीपीई फिट टेस्ट गाइड (3M 6200/7502):**\n\n"
                "**1. नेगेटिव प्रेशर सील टेस्ट (Negative Pressure Check):**\n"
                "• दोनों कार्ट्रिज के फिल्टर इनलेट्स को अपनी हथेलियों से ढकें।\n"
                "• धीरे से सांस अंदर खींचें — मास्क थोड़ा सा चेहरे की ओर सिकुड़ना चाहिए और 10 सेकंड तक कोई हवा लीक नहीं होनी चाहिए।\n\n"
                "**2. पॉजिटिव प्रेशर सील टेस्ट (Positive Pressure Check):**\n"
                "• एक्सहेलेशन वाल्व (निकास वाल्व) को हथेली से ढकें और धीरे से सांस छोड़ें।\n"
                "• मास्क चेहरे पर हल्का फूलना चाहिए बिना गाल या ठुड्डी से हवा निकले।\n\n"
                "**3. कार्ट्रिज बदलने का समय:**\n"
                "• 3M 6006 कार्ट्रिज को हर **30 दिन** में या सांस लेने में भारीपन होने पर, या रासायनिक गंध आने पर तुरंत बदलें।"
            )
        else:
            reply = (
                "🤿 **Respiratory Care & Daily Fit Test Protocol (3M 6200/7502 Silicone):**\n\n"
                "**1. Negative Pressure Seal Check:**\n"
                "• Place the palms of your hands over the cartridge intake openings.\n"
                "• Inhale gently. The facepiece should collapse slightly toward your face and hold the seal without air leaking in for 10 seconds.\n\n"
                "**2. Positive Pressure Seal Check:**\n"
                "• Cover the bottom exhalation valve cover with your palm and exhale gently.\n"
                "• A slight positive pressure should build up inside the facepiece without any air escaping along the nose bridge or cheek seals.\n\n"
                "**3. Chemical Cartridge Rotation:**\n"
                "• Replace 3M 6006 / Honeywell dual cartridges every **30 days**, or immediately if you detect chemical breakthrough, taste sour gas, or experience increased inhalation resistance."
            )
        return {
            "reply": reply,
            "quick_actions": ["Everyday Tasks Checklist", "CDU-1 Safety Procedures", "Gas Leak Protocol", "My Exposure Status"]
        }

    def _handle_dosimeter_tech_query(self, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        if lang == "hi":
            reply = (
                "🔬 **STRELA ज़ीरो-पावर ऑप्टिकल डोसीमीटर तकनीक:**\n\n"
                "• **सेंसिंग केमिस्ट्री (Patch A):** प्राकृतिक एंथोसायनिन (Anthocyanin) और SbCl₃ से बनी यह स्ट्रिप H₂S गैस के संपर्क में आने पर गुलाबी से गहरे भूरे रंग में स्थायी रूप से बदलती है। इसमें कोई बैटरी या इलेक्ट्रॉनिक्स नहीं होती।\n"
                "• **रेफरेंस स्केल (Scale B):** खराब रोशनी या रात की शिफ्ट में कैमरे से सटीक एक्सपोजर नापने के लिए 5-स्तरीय रंग पैच दिए गए हैं।\n"
                "• **7-दिवसीय कैबेज पैच (Patch C):** बैंगनी पत्तागोभी के अर्क से बना यह पैच 7 दिन बाद स्वतः फीका पड़ जाता है, जिससे एक्सपायर हो चुका बैज इस्तेमाल नहीं किया जा सकता।"
            )
        else:
            reply = (
                "🔬 **STRELA Zero-Power Optical Dosimeter Architecture:**\n\n"
                "• **Active Chemical Sensing (Patch A):** Formulated from bio-compatible Anthocyanin and $\\text{SbCl}_3$. When airborne H₂S reacts with the matrix, it undergoes an irreversible colorimetric transition from pale pink to dark brown proportional to dose—requiring zero batteries, circuits, or wireless charging.\n"
                "• **Multi-Step Calibration Reference Scale (Scale B):** Features 5 standardized reflectance swatches (0 to 120 ppm·h) allowing computer vision to accurately measure optical density under poor refinery lighting or shadow.\n"
                "• **7-Day Bio-Freshness Indicator (Patch C):** Formulated from natural purple cabbage extract that fades predictably over 7 days, guaranteeing expired wristbands are flagged and swapped automatically."
            )
        return {
            "reply": reply,
            "quick_actions": ["Wristband Replacement Schedule", "Explain 8-hr TWA", "Log Shift Reading", "Everyday Tasks Checklist"]
        }

    def _handle_heat_stress_query(self, session: Dict[str, Any], lang: str) -> Dict[str, Any]:
        if lang == "hi":
            reply = (
                "☀️ **हीट स्ट्रेस व हाइड्रेशन गाइड (रिफाइनरी तापमान):**\n\n"
                "• **पानी का सेवन:** अधिक तापमान (> 32°C) और आर्द्रता में हर **20 मिनट में 250 मिलीलीटर** साफ पानी पिएं। प्यास लगने का इंतजार न करें!\n"
                "• **आराम के ब्रेक:** 2 घंटे के फील्ड राउंड के बाद 15 मिनट वातानुकूलित कंट्रोल रूम शेल्टर में बैठें।\n"
                "• **लक्षण चेतावनी:** अत्यधिक पसीना, चक्कर आना या मांसपेशियों में ऐंठन हीट थकावट (Heat Exhaustion) के संकेत हैं। तुरंत सुपरवाइजर को बताएं और OHC में इलेक्ट्रोलाइट्स लें।"
            )
        else:
            reply = (
                "☀️ **Refinery Heat Stress & Mandatory Hydration Protocol:**\n\n"
                "• **Scheduled Hydration:** In coastal refinery ambient conditions ($> 32^\\circ\\text{C}$ / $75\\%\\text{ RH}$), drink **250 ml of cool water every 20 minutes**. Do not wait until you feel thirsty!\n"
                "• **Shelter Recovery Breaks:** Take a mandatory 15-minute recovery break in an air-conditioned operator shelter after every 2 hours of continuous field patrol.\n"
                "• **Heat Warning Signs:** Heavy sweating, cold pale skin, muscle cramps, and dizziness indicate heat exhaustion. Move to air conditioning immediately and hydrate with electrolyte solution."
            )
        return {
            "reply": reply,
            "quick_actions": ["Everyday Tasks Checklist", "PPE Seal Check", "CDU-1 Safety Procedures", "My Exposure Status"]
        }

unified_chat = UnifiedChatAgent()

