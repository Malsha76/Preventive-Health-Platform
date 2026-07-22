import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/client";
import { Link, useLocation } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { formatPatientId } from "../utils/formatters";

export default function HospitalPatients() {
  const location = useLocation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await apiGet('/api/hospital/patients');
        setPatients(res.data || []);
      } catch {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return (patients || [])
      .filter((p) => (filter === "followup" ? !!p.needsFollowUp : true))
      .filter((p) => {
        if (!qq) return true;
        const name = [p.firstName, p.lastName].filter(Boolean).join(" ").toLowerCase();
        const pid = formatPatientId(p._id).toLowerCase();
        return (
          name.includes(qq) ||
          String(p.email || "").toLowerCase().includes(qq) ||
          pid.includes(qq) ||
          String(p._id || "").toLowerCase().includes(qq)
        );
      });
  }, [patients, q, filter]);

  if (loading) return <div className="text-slate-600">Loading patients…</div>;

  // Reused under /doctor/* routes; make links point to the correct namespace
  const base = location.pathname.startsWith('/doctor') ? '/doctor' : '/hospital';

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4">
        <div className="text-lg font-semibold">Patients</div>
        <div className="text-sm text-slate-500">Search, filter, and open patient profiles</div>

        <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, or patient ID"
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-2 rounded-lg text-sm border ${filter === "all" ? "bg-blue-900 text-white border-blue-900" : "hover:bg-slate-50"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("followup")}
              className={`px-3 py-2 rounded-lg text-sm border ${filter === "followup" ? "bg-blue-900 text-white border-blue-900" : "hover:bg-slate-50"}`}
            >
              Needs follow-up
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="border-b">
              <th className="text-left py-2">Name</th>
              <th className="text-left">Email</th>
              <th className="text-left">Status</th>
              <th className="text-left">Open alerts</th>
              <th className="text-left">Last adherence</th>
              <th className="text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="py-3 text-slate-500" colSpan={7}>No patients found.</td></tr>
            ) : rows.map((p) => (
              <tr key={p._id} className="border-b last:border-0">
                <td className="py-2">{[p.firstName, p.lastName].filter(Boolean).join(" ") || "-"}</td>
                <td>{p.email}</td>
                <td>
                  {p.needsFollowUp ? (
                    <span className="text-xs rounded-full bg-red-50 border border-red-100 text-red-700 px-2 py-1">Needs follow-up</span>
                  ) : (
                    <span className="text-xs rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-1">OK</span>
                  )}
                </td>
                <td>{p.openAlerts || 0}</td>
                <td>{typeof p.lastAdherenceScore === "number" ? `${p.lastAdherenceScore}%` : "—"}</td>
                <td>
                  <Link className="text-sm text-blue-900 hover:underline" to={`${base}/patients/${p._id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
