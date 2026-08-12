// src/utils/auth.js
// Helpers to make auth checks more reliable and prevent "stale" sessions.

export function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// Basic JWT validation (no signature verification on client)
export function isJwtValid(token) {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (payload?.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now - 30) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getStoredUser(key) {
  const raw = localStorage.getItem(key);
  if (!raw || raw === "undefined" || raw === "null") return null;
  return safeJsonParse(raw);
}

export function clearDoctorSession() {
  localStorage.removeItem("doctor");
  localStorage.removeItem("doctorToken");
}

export function clearHospitalSession() {
  localStorage.removeItem("hospital");
  localStorage.removeItem("hospitalToken");
}

export function clearPatientSession() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}
