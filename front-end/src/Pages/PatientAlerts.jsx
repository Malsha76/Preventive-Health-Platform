import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../api/client";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

function Badge({ severity }) {
  const s = (severity || "low").toLowerCase();
  const cls =
    s === "high"
      ? "bg-red-50 border-red-100 text-red-700"
      : s === "medium"
      ? "bg-amber-50 border-amber-100 text-amber-700"
      : "bg-slate-50 border-slate-100 text-slate-700";
  return <span className={`text-xs rounded-full border px-2 py-1 capitalize ${cls}`}>{s}</span>;
}

export default function PatientAlerts() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const patientId = user?._id || user?.userId;
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await apiGet(`/api/alerts/patient/${patientId}`).catch(() => ({ data: [] }));
      const rows = Array.isArray(res?.data) ? res.data : [];
      setAlerts(rows);
      localStorage.setItem("patientAlertsCount", String(rows.length));
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      await apiPatch(`/api/alerts/${alertId}/resolve`, {});
      await refresh();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  if (!patientId) return <div className="text-slate-700">Please log in to view alerts.</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-bold text-slate-900">Alerts</div>
          <div className="text-sm text-slate-600">These alerts are generated from your logs to support follow-ups.</div>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 text-sm flex items-center gap-2"
          type="button"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 4a9 9 0 00-15.5 6M4 20a9 9 0 0015.5-6"/>
          </svg>
          Refresh
        </button>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Your active alerts</div>
          <span className="text-xs rounded-full bg-red-50 border border-red-100 text-red-700 px-2 py-1">
            {alerts.length} active
          </span>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : alerts.length === 0 ? (
            <div className="text-sm text-slate-600">
              No active alerts. Keep tracking your adherence and lifestyle logs.
              <div className="mt-3">
                <Link className="text-blue-900 hover:underline" to="/adherence">Go to Adherence Logs</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a._id} className="border rounded-xl p-4 hover:bg-slate-50 cursor-pointer" onClick={() => resolveAlert(a._id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900">{a.type || "Alert"}</div>
                      <div className="text-sm text-slate-700">{a.message || "-"}</div>
                      <div className="text-xs text-slate-500">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</div>
                    </div>
                    <Badge severity={a.severity} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
