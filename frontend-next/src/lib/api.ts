import { 
  WorkerProfileData, 
  ShiftScanRecord, 
  ManagerDashboardData, 
  IncidentReport, 
  SessionUser 
} from "./types";

const getApiBase = () => {
  let url = "";
  if (typeof window === "undefined") {
    url = process.env.INTERNAL_API_URL || process.env.BACKEND_URL || "http://127.0.0.1:8000";
  } else {
    url = process.env.NEXT_PUBLIC_API_URL || "";
  }
  url = url.trim().replace(/\/+$/, "");
  if (url && !url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
    url = `https://${url}`;
  }
  return url;
};

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getApiBase();
  const url = `${base}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const text = await response.text();

  if (!response.ok) {
    let errorDetail = `API Error (${response.status})`;
    try {
      const errJson = JSON.parse(text);
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      if (text && text.length < 200) errorDetail = text;
    }
    throw new Error(errorDetail);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

// Authentication API
export async function getSessionMe(): Promise<SessionUser> {
  return fetchApi<SessionUser>("/api/auth/me");
}

export async function loginDemo(role: "employee" | "manager" | "hse_officer", employeeId?: string): Promise<SessionUser> {
  return fetchApi<SessionUser>("/api/auth/demo-login", {
    method: "POST",
    body: JSON.stringify({ role, employee_id: employeeId }),
  });
}

export async function loginStandard(username: string, password: string): Promise<SessionUser> {
  return fetchApi<SessionUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logoutUser(): Promise<{ authenticated: boolean; message: string }> {
  return fetchApi<{ authenticated: boolean; message: string }>("/api/auth/logout", {
    method: "POST",
  });
}

// Manager & Control Room API
export async function getManagerDashboard(): Promise<ManagerDashboardData> {
  return fetchApi<ManagerDashboardData>("/api/manager/dashboard");
}

export async function getEmployeesList(): Promise<WorkerProfileData[]> {
  return fetchApi<WorkerProfileData[]>("/api/manager/employees");
}

export async function getWorkerProfile(workerId: string): Promise<{
  worker_id: string;
  employee_id: string;
  employee_profile: WorkerProfileData;
  worker_profile: WorkerProfileData;
  lung_risk_profile?: any;
  chronic_lung_risk?: any;
  recent_scans: ShiftScanRecord[];
  shift_history: ShiftScanRecord[];
}> {
  return fetchApi(`/api/manager/employees/${workerId}`);
}

export async function getManagerHeatmap(): Promise<any> {
  return fetchApi("/api/manager/heatmap");
}

export async function getManagerIncidents(): Promise<IncidentReport[]> {
  return fetchApi<IncidentReport[]>("/api/manager/incidents");
}

// Shift & Dosimetry API
export async function startShift(payload: {
  employee_id: string;
  plant_unit: string;
  badge_id: string;
  start_delta_e: number;
  band_lifecycle_day: number;
}): Promise<any> {
  return fetchApi("/api/scan/start-shift", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function endShift(payload: {
  worker_id: string;
  employee_id?: string;
  plant_unit: string;
  shift_duration_hours: number;
  badge_id: string;
  band_lifecycle_day: number;
  start_delta_e: number;
  end_delta_e: number;
  patch_b_drift: number;
  patch_c_condition: string;
}): Promise<any> {
  return fetchApi("/api/scan/end-shift", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function analyzeBadgeImage(formData: FormData): Promise<any> {
  return fetchApi("/api/scan/analyze-image", {
    method: "POST",
    body: formData,
  });
}

// Assistant & Chat API
export async function sendChatMessage(sessionId: string, message: string): Promise<any> {
  return fetchApi("/api/chat", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, message }),
  });
}
