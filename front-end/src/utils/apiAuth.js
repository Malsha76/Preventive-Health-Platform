// src/utils/apiAuth.js

// IMPORTANT:
// Keep Hospital and Doctor tokens separate.
// Mixing tokens can cause 403 Forbidden when a page sends the wrong role.

export function getDoctorToken() {
  return localStorage.getItem('doctorToken') || '';
}

export function doctorAuthHeaders() {
  const token = getDoctorToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getHospitalToken() {
  return localStorage.getItem('hospitalToken') || '';
}

export function hospitalAuthHeaders() {
  const token = getHospitalToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Backwards compatibility (avoid breaking older imports)
export function getStaffToken() {
  return getHospitalToken() || getDoctorToken();
}

export function staffAuthHeaders() {
  // Choose token based on current route to prevent role mix-ups.
  const path = window.location.pathname || '';
  if (path.startsWith('/doctor')) return doctorAuthHeaders();
  if (path.startsWith('/hospital')) return hospitalAuthHeaders();

  // Fallback (older routes)
  const token = getStaffToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getPatientToken() {
  return localStorage.getItem('token') || '';
}

export function patientAuthHeaders() {
  const token = getPatientToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
