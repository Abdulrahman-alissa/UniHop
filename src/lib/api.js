// Thin wrapper around fetch for the UniHop REST API.
// - base URL comes from VITE_API_URL (see .env.example)
// - the JWT is kept in localStorage and sent as "Authorization: Bearer <token>"
// - failures throw ApiError with a human-readable message the UI can show in a toast

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const KEY = "unihop.token";

export const tokenStore = {
  get() { try { return localStorage.getItem(KEY); } catch { return null; } },
  set(t) { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch { /* storage blocked: session just won't persist */ } },
};

export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}

async function request(method, path, body) {
  const token = tokenStore.get();
  // Free hosting can take ~50 s to wake up, so allow a long timeout before giving up.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    throw new ApiError(err.name === "AbortError" ? "The server took too long to answer. Try again." : "Can't reach the server. Check your connection and try again.", 0, "NETWORK");
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error?.message || `Request failed (${res.status}).`, res.status, data?.error?.code);
  return data;
}

export const api = {
  get: (p) => request("GET", p),
  post: (p, b = {}) => request("POST", p, b),
  put: (p, b) => request("PUT", p, b ?? {}),
  patch: (p, b) => request("PATCH", p, b),
  delete: (p) => request("DELETE", p),
};
