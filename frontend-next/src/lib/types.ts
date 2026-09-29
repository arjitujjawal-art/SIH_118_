export type StatutoryTier = "TIER 1 (NORMAL)" | "TIER 2 (CAUTION)" | "TIER 3 (CRITICAL)";
export type MeasurementConfidence = "HIGH" | "MEDIUM" | "LOW" | "INVALID";
export type PatchCondition = "NORMAL" | "WARNING" | "COMPROMISED";
export type UserRole = "EMPLOYEE" | "MANAGER" | "HSE_OFFICER";

export interface SessionUser {
  authenticated: boolean;
  role: UserRole;
  user_id: string;
  employee_id: string;
  full_name: string;
  plant_unit: string;
  active_badge_id?: string;
  is_demo?: boolean;
}

export interface HealthProfile {
  smoking_status?: string;
  smoking_pack_years?: number;
  pre_existing_conditions?: string[];
  baseline_fev1_fvc_ratio?: number;
  fev1_baseline_liters?: number;
  fvc_baseline_liters?: number;
  baseline_heart_rate_bpm?: number;
  allergies?: string[];
  ocular_sensitivity?: boolean;
  historical_symptoms?: string[];
}

export interface PPEDetails {
  respirator_type?: string;
  cartridge_type?: string;
  last_fit_test_date?: string;
  fit_test_date?: string;
  fit_test_passed?: boolean;
  cartridge_install_date?: string;
}

export interface ExposureLedger {
  rolling_7day_ppm_hr: number;
  rolling_7day_low_ppm_hr?: number;
  rolling_7day_high_ppm_hr?: number;
  rolling_7day_range_str?: string;
  rolling_30day_ppm_hr: number;
  rolling_90day_ppm_hr: number;
  lifetime_shifts_logged: number;
  last_updated?: string;
}

export interface WorkerProfileData {
  employee_id: string;
  worker_id: string;
  full_name: string;
  age: number;
  gender: string;
  department: string;
  plant_unit: string;
  role: string;
  preferred_language: string;
  active_badge_id: string;
  band_lifecycle_day: number;
  health_profile: HealthProfile;
  ppe_details: PPEDetails;
  exposure_ledger: ExposureLedger;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ShiftScanRecord {
  scan_id: string;
  employee_id: string;
  worker_id: string;
  plant_unit: string;
  shift_status: "ACTIVE" | "COMPLETED";
  timestamp: string;
  shift_duration_hours: number;
  badge_data: {
    badge_id: string;
    start_delta_e: number;
    end_delta_e: number;
    net_delta_e: number;
    delta_e: number;
    patch_b_drift: number;
    patch_c_condition: PatchCondition;
    shelf_life_status: string;
    raw_optical_dose: number;
  };
  environmental_telemetry: {
    temperature_c: number;
    relative_humidity_pct: number;
    k_factor: number;
    source: string;
  };
  computed_metrics: {
    shift_dose_range_str: string;
    shift_twa_range_str: string;
    dose_low: number;
    dose_high: number;
    twa_low: number;
    twa_high: number;
    compensated_dose_ppm_hr: number;
    shift_twa_ppm: number;
    shift_hours: number;
    updated_7day_load: number;
    statutory_tier: StatutoryTier;
    measurement_confidence: MeasurementConfidence;
    is_single_shift_critical: boolean;
    hazard_score_5pt?: number;
    hazard_level_simple?: string;
  };
  advisory?: {
    summary_banner?: string;
    triage_question?: string;
    recommendations?: Array<{
      priority_level: string;
      category?: string;
      action_item: string;
    }>;
  };
}

export interface IncidentReport {
  incident_id: string;
  scan_id: string;
  employee_id: string;
  worker_id: string;
  plant_unit: string;
  timestamp: string;
  severity_tier: string;
  status: "OPEN" | "INVESTIGATING" | "CLOSED";
  supervisor_notes: string;
  ohc_clearance: boolean;
  created_at: string;
}

export interface ManagerDashboardData {
  workforce_kpis: {
    total_active_employees: number;
    recent_shifts_logged: number;
    tier2_caution_warnings: number;
    tier3_critical_breaches: number;
    open_oisd_incidents: number;
  };
  unit_breakdown: Array<{
    unit: string;
    total_scans: number;
    average_twa_ppm: number;
    status: "ALERT" | "NORMAL";
  }>;
  recent_scans: ShiftScanRecord[];
}

export interface LeakHeatmapPoint {
  unit: string;
  x: number;
  y: number;
  intensity: number;
  status: "CRITICAL" | "CAUTION" | "NORMAL";
  recent_twa_avg: number;
}
