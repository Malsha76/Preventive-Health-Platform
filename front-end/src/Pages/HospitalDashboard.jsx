import React, { useEffect, useState } from "react";
import { apiGet } from "../api/client";
import { getSocket, joinRoom } from "../services/socket";
import { formatPatientId } from "../utils/formatters";
import { FiActivity, FiAlertTriangle, FiClipboard, FiClock, FiUsers } from "react-icons/fi";

function Stat({ label, value, sub, icon: Icon, tone = "blue" }) {
  const toneMap = {
    blue: "from-blue-50 to-white text-blue-700 border-blue-100",
    emerald: "from-emerald-50 to-white text-emerald-700 border-emerald-100",
    amber: "from-amber-50 to-white text-amber-700 border-amber-100",
    rose: "from-rose-50 to-white text-rose-700 border-rose-100",
    violet: "from-violet-50 to-white text-violet-700 border-violet-100",
  };
  return (
    <div className={`bg-gradient-to-br ${toneMap[tone] || toneMap.blue} border rounded-2xl p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs tracking-wide text-slate-500 font-semibold">{label}</div>
        <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
          <Icon className="text-slate-600" />
        </div>
      </div>
      <div className="text-3xl leading-tight font-semibold mt-2 text-slate-900">{value}</div>
      {sub ? <div className="text-xs text-slate-500 mt-1">{sub}</div> : null}
    </div>
  );
}

function SeverityPill({ severity }) {
  const s = String(severity || "").toLowerCase();
  const cls =
    s === "high"
      ? "bg-red-50 border-red-100 text-red-700"
      : s === "low"
      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
      : "bg-amber-50 border-amber-100 text-amber-700";
  return <span className={`px-2.5 py-1 rounded-full text-xs border font-medium capitalize ${cls}`}>{severity || "-"}</span>;
}

export default function HospitalDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, a] = await Promise.all([
          apiGet('/api/hospital/metrics'),
          apiGet('/api/hospital/alerts/recent'),
        ]);
        setMetrics(m.data);
        setRecentAlerts(a.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Near real-time refresh when alerts/consultations/adherence updates occur
  useEffect(() => {
    joinRoom({ role: 'hospital' });
    const s = getSocket();
    const refresh = async () => {
      try {
        const [m, a] = await Promise.all([
          apiGet('/api/hospital/metrics'),
          apiGet('/api/hospital/alerts/recent'),
        ]);
        setMetrics(m.data);
        setRecentAlerts(a.data || []);
      } catch {
        // ignore
      }
    };
    s.on('alert:new', refresh);
    s.on('consultation:new', refresh);
    s.on('adherence:updated', refresh);
    return () => {
      s.off('alert:new', refresh);
      s.off('consultation:new', refresh);
      s.off('adherence:updated', refresh);
    };
  }, []);

  if (loading) return <div className="text-slate-600">Loading hospital metrics...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xl font-semibold tracking-tight text-slate-900">Hospital Operations Dashboard</div>
            <div className="text-sm text-slate-500 mt-1">Population trends, adherence risk signals, and operational workload</div>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-fit">
            <FiClock className="text-slate-500" />
            Updated: {metrics?.generatedAt ? new Date(metrics.generatedAt).toLocaleString() : "-"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Key Metrics</div>
          <div className="text-sm text-slate-500 mt-1">Live snapshot across patients, consultations, adherence, and alerts</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat label="Registered Patients" value={metrics?.patientCount ?? 0} icon={FiUsers} tone="blue" />
        <Stat label="Consultations" value={metrics?.consultationCount ?? 0} sub="Captured recommendations" icon={FiClipboard} tone="violet" />
        <Stat label="Adherence Logs" value={metrics?.logCount ?? 0} sub="Tracking entries" icon={FiActivity} tone="emerald" />
        <Stat label="Avg Adherence (7d)" value={`${metrics?.avgAdherence7d ?? 0}%`} sub="Across active patients" icon={FiActivity} tone="amber" />
        <Stat label="Open Alerts" value={metrics?.openAlerts ?? 0} sub={`Dropout risk: ${metrics?.dropoutRiskCount ?? 0}`} icon={FiAlertTriangle} tone="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:col-span-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Recent Alerts</div>
              <div className="text-sm text-slate-500">Most recent 20 system-generated risk alerts</div>
            </div>
          </div>

          <div className="mt-4 overflow-auto border border-slate-100 rounded-xl">
            <table className="w-full text-sm min-w-[780px]">
              <thead className="text-xs text-slate-500 bg-slate-50">
                <tr className="border-b">
                  <th className="text-left py-3 px-3 font-semibold">Date</th>
                  <th className="text-left px-3 font-semibold">Patient</th>
                  <th className="text-left px-3 font-semibold">Severity</th>
                  <th className="text-left px-3 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.length === 0 ? (
                  <tr><td className="py-5 px-3 text-slate-500" colSpan={4}>No alerts generated yet.</td></tr>
                ) : recentAlerts.map((a) => (
                  <tr key={a._id} className="border-b last:border-0 hover:bg-slate-50/60">
                    <td className="py-3 px-3 whitespace-nowrap">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "-"}</td>
                    <td className="px-3">
                      {a.patient?.name
                        ? `${a.patient.name} (${formatPatientId(a.patientId)})`
                        : a.patient?.email
                        ? `${a.patient.email} (${formatPatientId(a.patientId)})`
                        : formatPatientId(a.patientId) || "Unknown Patient"}
                    </td>
                    <td className="px-3"><SeverityPill severity={a.severity} /></td>
                    <td className="px-3 text-slate-700">{a.message || a.reason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="font-semibold text-slate-900">Operational Notes</div>
          <ul className="mt-2 text-sm text-slate-600 list-disc pl-5 space-y-2">
            <li>Prioritize follow-ups using adherence trends and open alert counts.</li>
            <li>Closely monitor high-risk flags: low adherence, sugar spikes, and stress.</li>
            <li>Escalate unresolved high-severity alerts for physician review.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
