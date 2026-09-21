const API_URL = "/api";

/**
 * Generic fetch wrapper with error handling.
 *
 * Handles three distinct failure modes cleanly:
 *  1. Network error / no response   → "Unable to connect to server"
 *  2. Server returned non-JSON      → "Server error (500)" etc., not a JSON parse crash
 *  3. Server returned JSON error    → uses the message field from the response body
 */
async function apiCall(endpoint: string, options: RequestInit = {}) {
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
  let data: Record<string, unknown> = {};
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
      typeof data.message === "string" ? data.message : "Request failed";
    throw new Error(message);
  }

  return data;
}

/**
 * Authentication API calls
 */
export const authAPI = {
  signup: (credentials: { username: string; email: string; password: string }) =>
    apiCall("/auth/signup", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  login: (credentials: { email: string; password: string }) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  googleLogin: (credentials: { credential?: string; email?: string; name?: string; username?: string }) =>
    apiCall("/auth/google", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  getMe: () => apiCall("/auth/me", { method: "GET" }),

  logout: () => apiCall("/auth/logout", { method: "POST" }),
};

/**
 * Profile API calls
 */
export const profileAPI = {
  get: () => apiCall("/profile", { method: "GET" }),

  create: (data: any) =>
    apiCall("/profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (data: any) =>
    apiCall("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

/**
 * Vehicle API calls
 */
export const vehicleAPI = {
  getAll: () => apiCall("/vehicles", { method: "GET" }),

  create: (data: any) =>
    apiCall("/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (vehicleId: number, data: any) =>
    apiCall(`/vehicles/${vehicleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (vehicleId: number) =>
    apiCall(`/vehicles/${vehicleId}`, {
      method: "DELETE",
    }),
};

/**
 * Emergency Contact API calls
 */
export const emergencyContactAPI = {
  getAll: () => apiCall("/emergency-contacts", { method: "GET" }),

  create: (data: any) =>
    apiCall("/emergency-contacts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (contactId: number, data: any) =>
    apiCall(`/emergency-contacts/${contactId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (contactId: number) =>
    apiCall(`/emergency-contacts/${contactId}`, {
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
    }),

  end: (sessionId: number) =>
    apiCall(`/sessions/${sessionId}/end`, {
      method: "POST",
    }),

  getAll: () => apiCall("/sessions", { method: "GET" }),

  getById: (sessionId: number) =>
    apiCall(`/sessions/${sessionId}`, { method: "GET" }),
};

/**
 * Fatigue Event API calls
 */
export const fatigueEventAPI = {
  create: (data: any) =>
    apiCall("/fatigue-events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getBySession: (sessionId: number) =>
    apiCall(`/fatigue-events/session/${sessionId}`, {
      method: "GET",
    }),
};

/**
 * Alert API calls
 */
export const alertAPI = {
  create: (data: any) =>
    apiCall("/alerts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: () => apiCall("/alerts", { method: "GET" }),

  getById: (alertId: number) =>
    apiCall(`/alerts/${alertId}`, { method: "GET" }),
};

/**
 * Health check
 */
export const healthAPI = {
  check: () => apiCall("/health", { method: "GET" }),
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
