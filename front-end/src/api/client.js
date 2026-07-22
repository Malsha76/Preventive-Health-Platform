/**
 * Shared API client that automatically attaches the correct Authorization header
 * based on the current route/context.
 *
 * Token mapping:
 * - /doctor/*  -> doctorToken
 * - /hospital/* -> hospitalToken
 * - everything else (patient pages) -> token
 */

import axios from 'axios';

/** Avoid double /api when callers use paths like /api/hospital/... */
function normalizeApiBase(raw) {
  let s = String(raw || '').trim() || 'http://localhost:3001';
  s = s.replace(/\/+$/, '');
  if (s.endsWith('/api')) s = s.slice(0, -4);
  return s;
}

const API_BASE = normalizeApiBase(process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE);

function getAuthHeaders() {
  const path = typeof window !== 'undefined' ? (window.location?.pathname || '') : '';
  let token = '';
  if (path.startsWith('/doctor')) {
    token = localStorage.getItem('doctorToken') || '';
  } else if (path.startsWith('/hospital')) {
    token = localStorage.getItem('hospitalToken') || '';
  } else {
    token = localStorage.getItem('token') || '';
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Global 401 handler: auto-logout and redirect to the correct login page
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    try {
      const status = err?.response?.status;
      if (status === 401) {
        const path = typeof window !== 'undefined' ? (window.location?.pathname || '') : '';
        if (path.startsWith('/doctor')) {
          localStorage.removeItem('doctor');
          localStorage.removeItem('doctorToken');
          if (typeof window !== 'undefined') window.location.assign('/doctor/login');
        } else if (path.startsWith('/hospital')) {
          localStorage.removeItem('hospital');
          localStorage.removeItem('hospitalToken');
          if (typeof window !== 'undefined') window.location.assign('/hospital/login');
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          if (typeof window !== 'undefined') window.location.assign('/login');
        }
      }
    } catch {
      // ignore redirect errors
    }
    return Promise.reject(err);
  }
);

/**
 * GET request with auto-attached auth
 */
export async function apiGet(url, config = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  const headers = { ...getAuthHeaders(), ...(config.headers || {}) };
  const { responseType, ...rest } = config;
  return axios.get(fullUrl, { ...rest, headers, responseType });
}

/**
 * POST request with auto-attached auth
 */
export async function apiPost(url, data, config = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  const headers = { ...getAuthHeaders(), ...(config.headers || {}) };
  return axios.post(fullUrl, data, { ...config, headers });
}

/**
 * PATCH request with auto-attached auth
 */
export async function apiPatch(url, data, config = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  const headers = { ...getAuthHeaders(), ...(config.headers || {}) };
  return axios.patch(fullUrl, data, { ...config, headers });
}

/**
 * DELETE request with auto-attached auth
 */
export async function apiDelete(url, config = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  const headers = { ...getAuthHeaders(), ...(config.headers || {}) };
  return axios.delete(fullUrl, { ...config, headers });
}

/**
 * Fetch-style wrapper for components using fetch() - returns Response-like object
 * with .ok, .status, .json() for compatibility.
 */
export async function apiFetch(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
  const res = await fetch(fullUrl, { ...options, headers });
  return res;
}

export { API_BASE };
