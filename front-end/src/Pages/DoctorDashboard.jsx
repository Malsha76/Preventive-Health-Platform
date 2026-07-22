import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/client";
import { Link } from "react-router-dom";
import { FiAlertTriangle, FiUsers, FiFileText } from "react-icons/fi";

export default function DoctorDashboard() {
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const updatedAt = useMemo(() => new Date().toLocaleString(), []);

  async function load() {
    setLoading(true);
    try {
      const res = await apiGet('/api/hospital/alerts/recent');
      setRecentAlerts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRecentAlerts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const openCount = recentAlerts.filter((a) => {
    const s = (a.status || (a.resolved ? "Resolved" : "Open")).toLowerCase();
    return s !== "resolved";
  }).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Doctor Dashboard</h1>
          <p className="text-sm text-slate-600">Clinical follow-ups and patient risk monitoring</p>
        </div>
        <div className="text-xs text-slate-500">Updated: {updatedAt}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500">OPEN ALERTS</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">{openCount}</div>
          <div className="mt-2 text-sm text-slate-600">Patients needing attention</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500">QUICK ACTIONS</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/doctor/alerts" className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-3 py-2 text-sm text-white hover:bg-blue-800">
              <FiAlertTriangle /> View alerts
            </Link>
            <Link to="/doctor/patients" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <FiUsers /> Browse patients
            </Link>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500">REPORTS</div>
          <div className="mt-3">
            <Link to="/doctor/reports" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <FiFileText /> Generate reports
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Recent Alerts</div>
            <div className="text-sm text-slate-600">Latest system-generated risk signals</div>
          </div>
          <button
            onClick={load}
            className="text-sm px-3 py-2 rounded-lg border hover:bg-slate-50"
            type="button"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Patient</th>
                <th className="py-2 pr-3">Severity</th>
                <th className="py-2 pr-3">Message</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-slate-600">No alerts yet.</td>
                </tr>
              ) : (
                recentAlerts.slice(0, 10).map((a) => (
                  <tr key={a._id} className="border-b last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-3">
                      {a.patient?.name || a.patient?.email || a.patientId || "—"}
                    </td>
                    <td className="py-2 pr-3 capitalize">{a.severity || "—"}</td>
                    <td className="py-2 pr-3">{a.message}</td>
                    <td className="py-2">
                      <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border " + (
                        (a.status || (a.resolved ? "Resolved" : "Open")) === "Resolved"
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                          : (a.status || (a.resolved ? "Resolved" : "Open")) === "Acknowledged"
                          ? "bg-indigo-50 border-indigo-100 text-indigo-700"
                          : (a.status || (a.resolved ? "Resolved" : "Open")) === "In Progress"
                          ? "bg-sky-50 border-sky-100 text-sky-700"
                          : "bg-amber-50 border-amber-100 text-amber-700"
                      )}>
                        {a.status || (a.resolved ? "Resolved" : "Open")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
