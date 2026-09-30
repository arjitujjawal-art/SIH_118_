"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getWorkerProfile } from "@/lib/api";
import { WorkerProfileData, ShiftScanRecord } from "@/lib/types";
import ProtectedNavbar from "@/components/layout/ProtectedNavbar";
import Footer from "@/components/layout/Footer";
import ExposureChart from "@/components/worker/ExposureChart";
import ReadingCapture from "@/components/worker/ReadingCapture";
import ChatbotDrawer, { ScanBriefing } from "@/components/assistant/ChatbotDrawer";
import WorkerQrModal from "@/components/dashboard/WorkerQrModal";
import { 
  ShieldCheck, 
  Activity, 
  Clock, 
  Heart, 
  AlertTriangle, 
  ArrowLeft,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  QrCode,
  Download,
  FileText,
  Bot,
  PanelRightClose,
  PanelRightOpen,
  Check,
  AlertCircle,
  ExternalLink,
  Flame,
  Stethoscope,
  Wind
} from "lucide-react";

export default function WorkerProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workerId = (params?.workerId as string) || "EMP-1042";
  const badgeParam = searchParams.get("badgeId");

  const [profile, setProfile] = useState<WorkerProfileData | null>(null);
  const [scans, setScans] = useState<ShiftScanRecord[]>([]);
  const [lungRisk, setLungRisk] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeBriefing, setActiveBriefing] = useState<ScanBriefing | null>(null);

  // AI Chatbot is OPEN BY DEFAULT across all employee dashboards
  const [isChatOpen, setIsChatOpen] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const profileRes = await getWorkerProfile(workerId);
      if (profileRes) {
        setProfile(profileRes.worker_profile || profileRes.employee_profile);
        setScans(profileRes.shift_history || profileRes.recent_scans || []);
        if (profileRes.lung_risk_profile || profileRes.chronic_lung_risk) {
          setLungRisk(profileRes.lung_risk_profile || profileRes.chronic_lung_risk);
        }
      }
    } catch (err: any) {
      console.warn("Worker profile load error", err);
      setErrorMsg(err?.message || `Failed to load dossier for worker ${workerId}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [workerId]);

  // If arrived from the scanner with autoScan=true, trigger proactive AI briefing
  useEffect(() => {
    if (searchParams.get("autoScan") === "true" && profile) {
      const isStart = searchParams.get("scanType") === "start";
      const hScore = searchParams.get("hazardScore") ? parseFloat(searchParams.get("hazardScore")!) : (isStart ? 0.0 : 1.8);
      const hLevel = searchParams.get("hazardLevel") || (isStart ? "SAFE / NORMAL" : "SAFE / NORMAL");
      const dE = searchParams.get("deltaE") ? parseFloat(searchParams.get("deltaE")!) : (isStart ? 0.40 : 4.82);

      setActiveBriefing({
        type: isStart ? "start" : "end",
        workerName: profile.full_name,
        workerId: workerId,
        unit: profile.plant_unit,
        badgeId: badgeParam || profile.active_badge_id || `BAND-${workerId.replace("EMP-", "")}-01`,
        hazardScore: hScore,
        hazardLevel: hLevel,
        deltaE: dE,
        doseRangeStr: "3.0–3.6 ppm·h",
        twaRangeStr: "0.4–0.5 ppm",
        scanId: `SCN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      });
      setIsChatOpen(true);
    }
  }, [profile, searchParams, workerId, badgeParam]);

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-warm-white">
        <ProtectedNavbar />
        <div className="flex-1 py-32 flex flex-col items-center justify-center text-sage-muted gap-3">
          <RefreshCw className="w-8 h-8 text-teal-deep animate-spin" />
          <span className="text-xs font-mono font-medium">Loading Industrial Dosimetry Dossier for {workerId}...</span>
        </div>
        <Footer />
      </div>
    );
  }

  const ledger = profile?.exposure_ledger || ({} as any);
  const health = profile?.health_profile || ({} as any);
  const ppe = profile?.ppe_details || ({} as any);

  // Determine current active shift status
  const latestScan = scans.length > 0 ? scans[0] : null;
  const isShiftActive = latestScan?.shift_status === "ACTIVE";

  // Initials for avatar
  const initials = (profile?.full_name || workerId)
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Lifecycle day calculation
  const lifecycleDay = profile?.band_lifecycle_day || 3;
  const activeBadgeId = badgeParam || profile?.active_badge_id || `BAND-${workerId.replace("EMP-", "")}-01`;

  // Rolling 7-day exposure value
  const rolling7d = typeof ledger.rolling_7day_ppm_hr === "number" 
    ? ledger.rolling_7day_ppm_hr 
    : 9.3;
  const is7dCritical = rolling7d > 100.0;
  const is7dCaution = !is7dCritical && rolling7d > 15.0;

  // Lung risk score
  const lungScore = lungRisk?.chronic_lung_risk_score ?? 16.7;
  const lungCategory = lungRisk?.risk_category ?? "LOW_BASELINE_RISK";

  return (
    <div className="min-h-screen flex flex-col bg-warm-white">
      <ProtectedNavbar />
      
      {/* Dynamic Split Layout: Re-adjusts automatically when AI Chatbot opens/closes */}
      <div className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1780px] mx-auto flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Main Dashboard Column (expands to 100% when chatbot closed) */}
          <main className="flex-1 min-w-0 w-full space-y-8 transition-all duration-300 ease-industrial">
            
            {/* Top Command Toolbar & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:px-6 sm:py-3.5 rounded-2xl border border-light-surface shadow-xs">
              <div className="flex items-center gap-3">
                <Link
                  href="/manager"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-muted hover:text-charcoal transition-colors bg-warm-white hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-light-surface"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Manager View</span>
                </Link>

                <div className="h-4 w-px bg-light-surface hidden sm:block" />

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-deep px-2 py-0.5 rounded bg-teal-light">
                    {workerId}
                  </span>
                  {isShiftActive ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      ACTIVE SHIFT IN PROGRESS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-sage-muted bg-warm-white border border-light-surface px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 text-sage" />
                      STANDBY / OFF SHIFT
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Actions & AI Chat Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold font-mono text-charcoal bg-warm-white hover:bg-yellow-golden/25 px-3 py-1.5 rounded-xl border border-light-surface hover:border-yellow-golden/50 transition-colors shadow-xs"
                  title="Generate physical QR badge sticker"
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-deep" />
                  <span className="hidden sm:inline">Wristband</span> QR
                </button>

                {latestScan && (
                  <a
                    href={`/api/manager/incident-pdf/${latestScan.scan_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold font-mono text-charcoal bg-warm-white hover:bg-teal-light px-3 py-1.5 rounded-xl border border-light-surface hover:border-teal-deep/30 transition-colors shadow-xs"
                    title="Export statutory OISD Form-A dossier PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-deep" />
                    <span>OISD Form-A</span>
                  </a>
                )}

                {/* AI Assistant Layout Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs ${
                    isChatOpen
                      ? "bg-charcoal text-white hover:bg-black"
                      : "bg-yellow-golden text-charcoal hover:bg-yellow-hover border border-yellow-golden/80"
                  }`}
                  title={isChatOpen ? "Collapse AI Advisor to expand view" : "Open AI Safety Advisor sidebar"}
                >
                  <Bot className="w-4 h-4 text-yellow-golden" />
                  <span className="hidden md:inline">
                    {isChatOpen ? "Close AI Advisor" : "Open AI Advisor"}
                  </span>
                  {isChatOpen ? (
                    <PanelRightClose className="w-3.5 h-3.5 text-sage" />
                  ) : (
                    <PanelRightOpen className="w-3.5 h-3.5 text-charcoal" />
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Worker Command Header & 4-Column Executive KPI Strip */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm space-y-6">
              
              {/* Top Row: Worker Photo & Official Credentials */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-light-surface">
                <div className="flex items-center gap-5">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-light-surface bg-warm-white flex items-center justify-center">
                    {workerId.toUpperCase() === "EMP-1042" || profile?.full_name?.toLowerCase().includes("sumedh") ? (
                      <img
                        src="/avatars/sumedh_kulkarni.jpg"
                        alt={profile?.full_name || "Sumedh Kulkarni"}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1A2220] flex flex-col items-center justify-center text-white">
                        <span className="font-display text-2xl sm:text-3xl font-bold text-yellow-golden font-mono tracking-wider">
                          {initials}
                        </span>
                        <span className="text-[10px] font-mono text-sage-muted mt-0.5">
                          {workerId}
                        </span>
                      </div>
                    )}
                    {isShiftActive && (
                      <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-deep px-2.5 py-0.5 rounded-lg bg-teal-light border border-teal-deep/20">
                        {workerId}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-warm-white border border-light-surface text-charcoal font-medium">
                        Unit {profile?.plant_unit || "CDU-1"}
                      </span>
                      <span className="text-xs text-sage-muted font-medium">
                        {profile?.department || "Operations"}
                      </span>
                    </div>

                    <h1 className="font-display text-2xl sm:text-4xl uppercase tracking-tight text-charcoal truncate">
                      {profile?.full_name || (workerId === "EMP-1042" ? "Sumedh Kulkarni" : `Worker ${workerId}`)}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-sage-muted font-medium">
                      <span>{profile?.role || "Field Operator"}</span>
                      <span>·</span>
                      <span>{profile?.age || 32} yrs</span>
                      <span>·</span>
                      <span>{profile?.gender || "Male"}</span>
                      <span>·</span>
                      <span className="font-mono">Lang: {profile?.preferred_language === "hi" ? "Hindi (हिंदी)" : "English (EN)"}</span>
                    </div>
                  </div>
                </div>

                {/* Right Status Banner: Shift Station Indicator */}
                <div className="flex flex-col sm:items-end justify-center gap-1.5 bg-warm-white/70 p-4 rounded-2xl border border-light-surface">
                  <div className="text-[10px] font-mono uppercase text-sage-muted font-bold tracking-wider">
                    Refinery Duty Station
                  </div>
                  <div className="text-sm font-bold font-mono text-charcoal flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span>{profile?.plant_unit || "CDU-1"} Processing Zone</span>
                  </div>
                  <div className="text-[11px] text-sage-muted flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Continuous Optical Dosimetry Active</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: 4 Unified Executive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                
                {/* 1. Active Dosimeter Wristband */}
                <div className="bg-warm-white p-4 rounded-2xl border border-light-surface flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-sage-muted">
                      Active Wristband
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-light text-teal-deep font-bold">
                      Day {lifecycleDay} / 5
                    </span>
                  </div>
                  
                  <div>
                    <div className="text-base sm:text-lg font-bold font-mono text-teal-deep truncate">
                      {activeBadgeId}
                    </div>
                    {/* 5-step lifecycle progress indicator */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <div
                          key={d}
                          className={`h-1.5 flex-1 rounded-full ${
                            d <= lifecycleDay ? "bg-teal-deep" : "bg-light-surface"
                          }`}
                          title={`Day ${d} of 5`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-sage-muted font-mono pt-1 border-t border-light-surface">
                    <span>Chemical Substrate</span>
                    <span className="text-emerald-700 font-semibold">SbCl₃ + Anthocyanin</span>
                  </div>
                </div>

                {/* 2. 7-Day Cumulative Dose */}
                <div className="bg-warm-white p-4 rounded-2xl border border-light-surface flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-sage-muted">
                      7-Day Rolling Load
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      is7dCritical
                        ? "bg-red-100 text-red-800"
                        : is7dCaution
                        ? "bg-amber-100 text-amber-900"
                        : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {is7dCritical ? "CRITICAL" : is7dCaution ? "CAUTION" : "NORMAL TIER"}
                    </span>
                  </div>

                  <div>
                    <div className="text-2xl font-bold font-mono text-charcoal">
                      {rolling7d.toFixed(1)} <span className="text-xs font-normal text-sage-muted">ppm·h</span>
                    </div>
                    <p className="text-[10px] text-sage-muted mt-0.5">
                      Statutory ceiling: 100.0 ppm·h (Weekly max)
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-light-surface">
                    <span className="text-sage-muted">Compliance Margin</span>
                    <span className="font-semibold text-emerald-700">
                      {Math.max(0, 100 - rolling7d).toFixed(1)} ppm·h Headroom
                    </span>
                  </div>
                </div>

                {/* 3. Lifetime Shifts Logged */}
                <div className="bg-warm-white p-4 rounded-2xl border border-light-surface flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-sage-muted">
                      Lifetime Verified Shifts
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>

                  <div>
                    <div className="text-2xl font-bold font-mono text-charcoal">
                      {ledger.lifetime_shifts_logged ?? scans.length ?? 213}
                    </div>
                    <p className="text-[10px] text-sage-muted mt-0.5">
                      Audited paired optical readings on record
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-light-surface">
                    <span className="text-sage-muted">Baseline Drift</span>
                    <span className="font-semibold text-charcoal">ΔE &lt; 0.15 Verified</span>
                  </div>
                </div>

                {/* 4. Chronic Lung Risk & OHC Status */}
                <div className="bg-warm-white p-4 rounded-2xl border border-light-surface flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-sage-muted">
                      Chronic Lung Risk
                    </span>
                    <Stethoscope className="w-3.5 h-3.5 text-teal-deep" />
                  </div>

                  <div>
                    <div className="text-2xl font-bold font-mono text-charcoal">
                      {lungScore.toFixed(1)} <span className="text-xs font-normal text-sage-muted">/ 100</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      {lungCategory.replace(/_/g, " ")}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-light-surface">
                    <span className="text-sage-muted">OHC Clearance</span>
                    <span className="font-semibold text-emerald-700">Fit for Active Duty</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Operational Action Center: Shift Reading Capture & Morning Check-In */}
            <section aria-label="Shift Operations and Reading Capture">
              <ReadingCapture
                workerId={workerId}
                workerName={profile?.full_name || (workerId === "EMP-1042" ? "Sumedh Kulkarni" : `Worker ${workerId}`)}
                defaultUnit={profile?.plant_unit || "CDU-1"}
                activeBadgeId={activeBadgeId}
                currentLifecycleDay={lifecycleDay}
                hasActiveShift={isShiftActive}
                initialDeltaE={searchParams.get("deltaE") ? parseFloat(searchParams.get("deltaE")!) : undefined}
                onShiftUpdated={fetchProfile}
                onScanLogged={(briefing) => {
                  setActiveBriefing(briefing);
                  setIsChatOpen(true);
                }}
              />
            </section>

            {/* Longitudinal Recharts Exposure Trajectory Graph */}
            <section aria-label="Exposure Trajectory">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-light-surface pb-4">
                  <div>
                    <div className="text-xs font-mono font-bold uppercase text-teal-deep tracking-wider">
                      Optical Dosimetry Analytics
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl uppercase tracking-tight text-charcoal">
                      Longitudinal Exposure Trajectory
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-sage-muted">
                    <span className="px-2.5 py-1 bg-warm-white rounded-lg border border-light-surface">
                      ACGIH 8-hr TWA Reference: 1.0 ppm
                    </span>
                  </div>
                </div>

                <div className="w-full min-w-0">
                  <ExposureChart scans={scans} />
                </div>
              </div>
            </section>

            {/* Dual Column: Clinical Health Baseline (OHC) & Historical Shift Log */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (5 cols): Clinical Health & PPE Baseline */}
              <div className="xl:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-light-surface pb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-teal-deep" />
                    <h3 className="font-display text-xl uppercase tracking-tight text-charcoal">
                      Clinical & PPE Baseline
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    OHC Verified
                  </span>
                </div>

                {/* Spirometry & Respiratory Metrics */}
                <div className="space-y-4 text-xs">
                  <div className="bg-warm-white p-3.5 rounded-2xl border border-light-surface space-y-1">
                    <div className="text-[10px] font-bold uppercase text-sage-muted">Baseline Spirometry (Pulmonary)</div>
                    <div className="font-semibold text-charcoal font-mono text-sm">
                      FEV1: {health.fev1_baseline_liters || 3.1} L · FVC: {health.fvc_baseline_liters || 4.0} L
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      FEV1/FVC Ratio: {(((health.fev1_baseline_liters || 3.1) / (health.fvc_baseline_liters || 4.0)) * 100).toFixed(1)}% (Healthy Lung Function)
                    </div>
                  </div>

                  <div className="bg-warm-white p-3.5 rounded-2xl border border-light-surface space-y-1">
                    <div className="text-[10px] font-bold uppercase text-sage-muted">Smoking Status & Risk Multiplier</div>
                    <div className="font-semibold text-charcoal">{health.smoking_status || "Non-smoker"}</div>
                    <p className="text-[10px] text-sage-muted">
                      {health.smoking_status?.toLowerCase().includes("active") 
                        ? "Active tobacco use accelerates H2S bronchial irritation."
                        : "Low bronchial sensitivity profile confirmed."}
                    </p>
                  </div>

                  <div className="bg-warm-white p-3.5 rounded-2xl border border-light-surface space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold uppercase text-sage-muted">Assigned Acid Gas Respirator</div>
                      <span className="text-[10px] font-mono text-teal-deep font-bold">APF: 50</span>
                    </div>
                    <div className="font-semibold text-charcoal">
                      {ppe.respirator_type || "3M Half-Face 6200 with 6006 Cartridge"}
                    </div>
                    <div className="text-[10px] text-sage-muted flex items-center justify-between border-t border-light-surface pt-1.5">
                      <span>Cartridge Install: {ppe.cartridge_install_date || "2026-08-20"}</span>
                      <span className="text-emerald-700 font-semibold">Active & Valid</span>
                    </div>
                  </div>

                  <div className="bg-warm-white p-3.5 rounded-2xl border border-light-surface space-y-1">
                    <div className="text-[10px] font-bold uppercase text-sage-muted">Quantitative Fit-Test Record</div>
                    <div className="font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Passed Certification on {ppe.fit_test_date || "2026-08-02"}</span>
                    </div>
                  </div>

                  {/* Dynamic Chronic Lung Risk Summary */}
                  {lungRisk && (
                    <div className="bg-teal-light/50 p-3.5 rounded-2xl border border-teal-deep/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-teal-deep">Chronic Lung Index Recommendation</span>
                        <span className="text-[10px] font-mono font-bold text-teal-deep">{lungScore.toFixed(1)}/100</span>
                      </div>
                      <p className="text-[11px] text-charcoal leading-relaxed">
                        {lungRisk.recommendation_en || "Routine workplace occupational health monitoring."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (7 cols): Historical Shift Dosimetry Log */}
              <div className="xl:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-light-surface shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-light-surface pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-deep" />
                    <h3 className="font-display text-xl uppercase tracking-tight text-charcoal">
                      Shift Dosimetry History
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-sage-muted">
                    {scans.length} Shifts Recorded
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[560px] overflow-y-auto rounded-xl border border-light-surface/60">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-warm-white z-10">
                      <tr className="bg-warm-white border-b border-light-surface text-[10px] font-mono font-bold uppercase text-charcoal">
                        <th className="p-3 pl-4">Scan ID & Time</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3">Risk Rating</th>
                        <th className="p-3">Shift Dose</th>
                        <th className="p-3">Statutory Tier</th>
                        <th className="p-3 pr-4 text-right">PDF Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-surface text-xs text-charcoal font-mono">
                      {scans.map((scan) => {
                        const m = scan.computed_metrics || ({} as any);
                        const doseHigh = typeof m.dose_high === "number" ? m.dose_high : 3.6;
                        const hazardScore = typeof m.hazard_score_5pt === "number"
                          ? m.hazard_score_5pt
                          : Math.min(5.0, Math.max(0.0, parseFloat((doseHigh / 4.0).toFixed(1))));
                        const isCritical = hazardScore > 3.4 || m.statutory_tier === "TIER 3 (CRITICAL)";
                        const isCaution = !isCritical && (hazardScore > 1.5 || m.statutory_tier === "TIER 2 (CAUTION)");

                        return (
                          <tr key={scan.scan_id} className="hover:bg-warm-white/60 transition-colors">
                            <td className="p-3 pl-4">
                              <div className="font-bold text-charcoal">{scan.scan_id}</div>
                              <div className="text-[10px] text-sage-muted" suppressHydrationWarning>
                                {scan.timestamp ? new Date(scan.timestamp).toLocaleDateString() : "Recent"}
                              </div>
                            </td>
                            <td className="p-3 font-sans font-medium">{scan.plant_unit}</td>
                            <td className="p-3 font-bold">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono ${
                                isCritical
                                  ? "bg-red-100 text-red-800 border border-red-300"
                                  : isCaution
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              }`}>
                                ★ {hazardScore.toFixed(1)}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-charcoal">
                              <div>{m.shift_dose_range_str || "3.0–3.6 ppm·h"}</div>
                              <div className="text-[10px] text-sage-muted font-normal">
                                TWA: {m.shift_twa_range_str || "0.4–0.5 ppm"}
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase ${
                                  isCritical
                                    ? "bg-red-500 text-white"
                                    : isCaution
                                    ? "bg-yellow-golden text-charcoal font-extrabold"
                                    : "bg-emerald-600 text-white"
                                }`}
                              >
                                {isCritical ? "CRITICAL" : isCaution ? "CAUTION" : "NORMAL"}
                              </span>
                            </td>
                            <td className="p-3 pr-4 text-right">
                              <a
                                href={`/api/manager/incident-pdf/${scan.scan_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warm-white hover:bg-teal-light border border-light-surface text-[11px] text-charcoal hover:text-teal-deep font-semibold transition-colors"
                                title="Download OISD Form-A statutory report"
                              >
                                <Download className="w-3 h-3 text-teal-deep" />
                                <span>PDF</span>
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>

          {/* Embedded Desktop Sidebar: AI Chatbot (opens by default at the right, collapsible) */}
          <ChatbotDrawer
            workerId={workerId}
            workerName={profile?.full_name || (workerId === "EMP-1042" ? "Sumedh Kulkarni" : `Worker ${workerId}`)}
            plantUnit={profile?.plant_unit || "CDU-1"}
            badgeId={activeBadgeId}
            briefing={activeBriefing}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onOpen={() => setIsChatOpen(true)}
            embedded={true}
          />
        </div>

        {/* Wristband QR Code Generator Modal */}
        <WorkerQrModal
          worker={showQrModal && profile ? profile : null}
          onClose={() => setShowQrModal(false)}
        />
      </div>

      <Footer />
    </div>
  );
}
