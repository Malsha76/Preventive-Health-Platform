import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch } from "../api/client";
import { FiFilter, FiSearch } from "react-icons/fi";
import { Store } from "react-notifications-component";
import { useLocation } from "react-router-dom";
import { formatPatientId } from "../utils/formatters";

export default function HospitalAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [updating, setUpdating] = useState({});
  const location = useLocation();
  const isDoctor = (location.pathname || "").startsWith("/doctor");
  const statusOptions = ["Open", "Acknowledged", "In Progress", "Resolved"];

  useEffect(() => {
    async function load() {
      try {
        const res = await apiGet('/api/hospital/alerts/recent');
        setAlerts(res.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return (alerts || [])
      .filter((a) => (severity === "all" ? true : String(a.severity || "").toLowerCase() === severity))
      .filter((a) => {
        if (status === "all") return true;
        const s = (a.status || (a.resolved ? "Resolved" : "Open")).toLowerCase();
        return s === status;
      })
      .filter((a) => {
        if (!qq) return true;
        const patientText = `${a.patient?.name || ""} ${a.patient?.email || ""} ${a.patientId || ""}`.toLowerCase();
        return String(a.message || "").toLowerCase().includes(qq) || patientText.includes(qq);
      });
  }, [alerts, q, severity, status]);

  async function handleStatusChange(id, nextStatus) {
    if (!isDoctor) return;
    setUpdating((u) => ({ ...u, [id]: true }));
    try {
      const res = await apiPatch(`/api/alerts/${id}/status`, { status: nextStatus });
      const updated = res?.data;
      setAlerts((prev) =>
        prev.map((a) =>
          a._id === id ? { ...a, status: updated?.status || nextStatus, resolved: updated?.resolved ?? (nextStatus === "Resolved") } : a
        )
      );
      Store.addNotification({
        title: "Updated",
        message: "Alert status updated",
        type: "success",
        insert: "top",
        container: "top-right",
        dismiss: { duration: 3000, onScreen: true },
      });
    } catch (err) {
      Store.addNotification({
        title: "Error",
        message: "Failed to update alert status",
        type: "danger",
        insert: "top",
        container: "top-right",
        dismiss: { duration: 3000, onScreen: true },
      });
    } finally {
      setUpdating((u) => {
        const copy = { ...u };
        delete copy[id];
        return copy;
      });
    }
  }

  if (loading) return <div className="text-slate-600">Loading alerts…</div>;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <div className="text-xl font-semibold tracking-tight text-slate-900">Risk Alerts</div>
            <div className="text-sm text-slate-500 mt-1">Institution level risk signals with advanced filtering and status tracking</div>
          </div>
          <div className="px-3 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-600 w-fit">
            Total visible: <span className="font-semibold text-slate-800">{rows.length}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <FiSearch className="absolute left-3 top-3 text-slate-400" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by patient or message"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-2 py-1 text-xs text-slate-500">
              <FiFilter size={14} />
              Filters
            </div>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="all">All severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="all">All status</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm overflow-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead className="text-xs text-slate-500 bg-slate-50">
            <tr className="border-b">
              <th className="text-left py-3 px-3 font-semibold">Created</th>
              <th className="text-left px-3 font-semibold">Severity</th>
              <th className="text-left px-3 font-semibold">Patient</th>
              <th className="text-left px-3 font-semibold">Message</th>
              <th className="text-left px-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="py-6 px-3 text-slate-500" colSpan={5}>No alerts match current filters.</td></tr>
            ) : rows.map((a) => (
              <tr key={a._id} className="border-b last:border-0 hover:bg-slate-50/60">
                <td className="py-3 px-3 whitespace-nowrap">{a.createdAt ? new Date(a.createdAt).toLocaleString() : "-"}</td>
                <td className="capitalize px-3">
                  <span className={`px-2 py-1 rounded-full text-xs border ${String(a.severity).toLowerCase()==='high' ? 'bg-red-50 border-red-100 text-red-700' : String(a.severity).toLowerCase()==='low' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>{a.severity || "-"}</span>
                </td>
                <td className="whitespace-nowrap px-3">
                  {a.patient?.name
                    ? `${a.patient.name} (${formatPatientId(a.patientId)})`
                    : a.patient?.email
                    ? `${a.patient.email} (${formatPatientId(a.patientId)})`
                    : formatPatientId(a.patientId) || "Unknown Patient"}
                </td>
                <td className="px-3 text-slate-700">{a.message || "-"}</td>
                <td className="px-3">
                  {isDoctor ? (
                    <select
                      value={a.status || (a.resolved ? "Resolved" : "Open")}
                      onChange={(e) => handleStatusChange(a._id, e.target.value)}
                      disabled={!!updating[a._id]}
                      className={`px-2 py-1 rounded-full text-xs border bg-white ${
                        updating[a._id] ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs border ${
                      (a.status || (a.resolved ? "Resolved" : "Open")) === "Open"
                        ? "bg-amber-50 border-amber-100 text-amber-700"
                        : (a.status || (a.resolved ? "Resolved" : "Open")) === "Acknowledged"
                        ? "bg-indigo-50 border-indigo-100 text-indigo-700"
                        : (a.status || (a.resolved ? "Resolved" : "Open")) === "In Progress"
                        ? "bg-sky-50 border-sky-100 text-sky-700"
                        : "bg-blue-50 border-blue-100 text-blue-800"
                    }`}>
                      {a.status || (a.resolved ? "Resolved" : "Open")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
