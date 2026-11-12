const API_URL = "/api";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
}

export interface Vehicle {
  vehicle_id: number;
  registration_no: string;
  vehicle_type: string;
  make: string;
  model: string;
  manufacturing_year: number;
}

export interface VehicleInput {
  registration_no: string;
  vehicle_type: string;
  make: string;
  model: string;
  manufacturing_year: number | string;
}

export interface ProfileRecord {
  user_id: number;
  username?: string;
  email?: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
}

export interface EmergencyContact {
  contact_id: number;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
}

export interface EmergencyContactInput {
  name: string;
  phone: string;
  relationship: string;
  priority: number | string;
}

export interface AuthUser {
  user_id: number;
  username: string;
  email: string;
  profile_completed?: boolean;
  token?: string;
}

export interface FatigueEventInput {
  session_id: number;
  event_type_id: number;
  confidence: number;
  severity: string;
  timestamp?: string;
  duration?: number;
  snapshot_url?: string | null;
}

export interface AlertInput {
  event_id: number;
  contact_id?: number | null;
  alert_type: string;
  message: string;
}

export interface DetectionSample {
  sample_id: number;
  session_id: number;
  timestamp: string;
  has_face: boolean;
  eye_status: string;
  ear: number | null;
  yawn_detected: boolean | null;
  mouth_ratio: number | null;
  head_pitch: number | null;
  head_yaw: number | null;
  head_roll: number | null;
  attention_status: string;
  drowsiness_level: string;
  fatigue_score: number | null;
}

export interface SessionEvent {
  event_id: number;
  timestamp: string;
  severity: string;
  duration: number | null;
  event_type: { event_name: string };
  alerts: Array<{
    alert_id: number;
    alert_type: string;
    message: string;
    status: string;
    created_at: string;
  }>;
}

export interface DrivingSession {
  session_id: number;
  user_id: number;
  vehicle_id: number;
  start_time: string;
  end_time: string | null;
  status: string;
  created_at: string;
  duration_ms?: number;
  vehicle?: Vehicle;
  _count?: { fatigue_events: number; detection_samples: number };
  average_fatigue_score?: number | null;
  maximum_fatigue_score?: number | null;
  alert_count?: number;
  event_counts?: Record<string, number>;
}

export interface SessionSummary {
  session: DrivingSession & { duration_ms: number; alert_count: number };
  metrics: {
    average_fatigue_score: number | null;
    maximum_fatigue_score: number | null;
    average_ear: number | null;
    sample_count: number;
    event_counts: Record<string, number>;
    alert_count: number;
    attention_distribution: Record<string, number>;
  };
  samples: DetectionSample[];
  events: SessionEvent[];
}

export interface AlertRecord {
  alert_id: number;
  alert_type: string;
  message: string;
  status: string;
  created_at: string;
  event: {
    timestamp: string;
    severity: string;
    event_type: { event_name: string };
    session: { session_id: number };
  };
}

export interface DetectionResult {
  sessionId: string;
  timestamp: string;
  hasFace: boolean;
  eyeStatus: string;
  ear: number | null;
  yawnDetected: boolean | null;
  mouthRatio: number | null;
  headPose: { pitch: number; yaw: number; roll: number } | null;
  attentionStatus: string;
  drowsinessLevel: string;
  fatigueScore: number | null;
  faceBox: { x: number; y: number; width: number; height: number } | null;
  eyeLandmarks: number[][] | null;
  events: Array<{
    type: string;
    severity: string;
    message: string;
    durationMs: number;
  }>;
}

/**
 * Generic fetch wrapper with error handling.
 *
 * Handles three distinct failure modes cleanly:
 *  1. Network error / no response   → "Unable to connect to server"
 *  2. Server returned non-JSON      → "Server error (500)" etc., not a JSON parse crash
 *  3. Server returned JSON error    → uses the message field from the response body
 */
async function apiCall<T = Record<string, unknown>>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (typeof options.headers === "object") {
      Object.assign(headers, options.headers);
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    // Network-level failure: no server, DNS failure, CORS preflight blocked, etc.
    throw new Error(
      "Unable to connect to the server. Please check your connection and try again."
    );
  }

  // Try to parse JSON. If the server returned HTML (e.g. a 404 page from a
  // misconfigured proxy) we catch the parse error and fall back to a status-based message.
  let data: unknown = {};
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      throw new Error(`Server returned malformed JSON (${response.status}).`);
    }
  } else if (!response.ok) {
    // Non-JSON error response (HTML 404 page, plain-text 500, etc.)
    throw new Error(
      `Server error (${response.status}). The API may be unreachable — check BACKEND_API_URL.`
    );
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Request failed";
    throw new Error(message);
  }

  return data as T;
}

/**
 * Authentication API calls
 */
export const authAPI = {
  signup: (credentials: { username: string; email: string; password: string }) =>
    apiCall<ApiEnvelope<AuthUser>>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  login: (credentials: { email: string; password: string }) =>
    apiCall<ApiEnvelope<AuthUser>>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  googleLogin: (credentials: { credential?: string; email?: string; name?: string; username?: string }) =>
    apiCall<ApiEnvelope<AuthUser>>("/auth/google", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  getMe: () => apiCall<ApiEnvelope<AuthUser>>("/auth/me", { method: "GET" }),

  logout: () => apiCall<ApiResponse>("/auth/logout", { method: "POST" }),
};

/**
 * Profile API calls
 */
export const profileAPI = {
  get: () => apiCall<ApiEnvelope<ProfileRecord>>("/profile", { method: "GET" }),

  create: (data: Partial<ProfileRecord>) =>
    apiCall<ApiEnvelope<ProfileRecord>>("/profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (data: Partial<ProfileRecord>) =>
    apiCall<ApiEnvelope<ProfileRecord>>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

/**
 * Vehicle API calls
 */
export const vehicleAPI = {
  getAll: () =>
    apiCall("/vehicles", { method: "GET" }) as Promise<ApiEnvelope<Vehicle[]>>,

  create: (data: VehicleInput) =>
    apiCall<ApiEnvelope<Vehicle>>("/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (vehicleId: number, data: Partial<VehicleInput>) =>
    apiCall<ApiEnvelope<Vehicle>>(`/vehicles/${vehicleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (vehicleId: number) =>
    apiCall<ApiResponse>(`/vehicles/${vehicleId}`, {
      method: "DELETE",
    }),
};

/**
 * Emergency Contact API calls
 */
export const emergencyContactAPI = {
  getAll: () =>
    apiCall<ApiEnvelope<EmergencyContact[]>>("/emergency-contacts", {
      method: "GET",
    }),

  create: (data: EmergencyContactInput) =>
    apiCall<ApiEnvelope<EmergencyContact>>("/emergency-contacts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (contactId: number, data: Partial<EmergencyContactInput>) =>
    apiCall<ApiEnvelope<EmergencyContact>>(`/emergency-contacts/${contactId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (contactId: number) =>
    apiCall<ApiResponse>(`/emergency-contacts/${contactId}`, {
      method: "DELETE",
    }),
};

/**
 * Driving Session API calls
 */
export const sessionAPI = {
  start: (vehicleId: number) =>
    apiCall("/sessions/start", {
      method: "POST",
      body: JSON.stringify({ vehicle_id: vehicleId }),
    }) as Promise<ApiEnvelope<DrivingSession>>,

  end: (sessionId: number) =>
    apiCall<ApiEnvelope<DrivingSession>>(`/sessions/${sessionId}/end`, {
      method: "POST",
    }),

  getAll: () =>
    apiCall("/sessions", {
      method: "GET",
    }) as Promise<ApiEnvelope<DrivingSession[]>>,

  getById: (sessionId: number) =>
    apiCall<ApiEnvelope<DrivingSession & { fatigue_events: SessionEvent[] }>>(
      `/sessions/${sessionId}`,
      { method: "GET" }
    ),

  getDetections: (sessionId: number, limit = 600) =>
    apiCall(`/sessions/${sessionId}/detections?limit=${limit}`, {
      method: "GET",
    }) as Promise<
      ApiEnvelope<{ samples: DetectionSample[]; events: SessionEvent[] }>
    >,

  getSummary: (sessionId: number) =>
    apiCall(`/sessions/${sessionId}/summary`, {
      method: "GET",
    }) as Promise<ApiEnvelope<SessionSummary>>,
};

/**
 * Fatigue Event API calls
 */
export const fatigueEventAPI = {
  create: (data: FatigueEventInput) =>
    apiCall<ApiEnvelope<SessionEvent>>("/fatigue-events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getBySession: (sessionId: number) =>
    apiCall<ApiEnvelope<SessionEvent[]>>(`/fatigue-events/session/${sessionId}`, {
      method: "GET",
    }),
};

/**
 * Alert API calls
 */
export const alertAPI = {
  create: (data: AlertInput) =>
    apiCall<ApiEnvelope<AlertRecord>>("/alerts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: () =>
    apiCall("/alerts", { method: "GET" }) as Promise<ApiEnvelope<AlertRecord[]>>,

  getById: (alertId: number) =>
    apiCall<ApiEnvelope<AlertRecord>>(`/alerts/${alertId}`, { method: "GET" }),
};

/**
 * Health check
 */
export const healthAPI = {
  check: () => apiCall<ApiResponse>("/health", { method: "GET" }),
};

export const monitoringAPI = {
  check: () =>
    apiCall("/monitoring/health", { method: "GET" }) as Promise<
      ApiEnvelope<{ status: "ready" }>
    >,
};

export const getMonitoringSocketUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_BACKEND_WS_URL || "http://localhost:5000";
  const url = new URL("/ws/monitoring", configuredUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
};

/**
 * Utility function to save token
 */
export const saveToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

/**
 * Utility function to clear token
 */
export const clearToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

/**
 * Utility function to get token
 */
export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};
