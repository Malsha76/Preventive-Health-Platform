import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { apiGet } from "../api/client";
import { getSocket, joinRoom } from "../services/socket";
import { FiActivity, FiAlertTriangle, FiFileText, FiShield } from "react-icons/fi";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

function StatCard({ title, value, sub }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {sub ? <div className="mt-1 text-sm text-slate-600">{sub}</div> : null}
    </div>
  );
}

function Panel({ title, children, right }) {
  return (
    <div className="rounded-xl border bg-white">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function DashboardHome() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {}

  const [latestConsult, setLatestConsult] = useState(null);
  const [adherence7d, setAdherence7d] = useState(0);
  const [risk, setRisk] = useState({ score: null, level: null });
  const [openAlerts, setOpenAlerts] = useState([]);
  const [medPack, setMedPack] = useState({ plan: null, today: { takenMedicationIds: [] } });
  const [loading, setLoading] = useState(true);

  const patientId = user?._id || user?.userId; // tolerate both shapes
  const name = user ? ([user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email) : "User";

  const activeRecsCount = useMemo(() => {
    const r = latestConsult?.recommendations;
    if (!r) return 0;
    return (Array.isArray(r.diet) ? r.diet.length : 0)
      + (Array.isArray(r.activity) ? r.activity.length : 0)
      + (Array.isArray(r.avoid) ? r.avoid.length : 0);
  }, [latestConsult]);

  const refresh = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [c, a, logs, meds, summary] = await Promise.all([
        apiGet(`/api/consultations/patient/${patientId}/latest`).catch(() => ({ data: null })),
        apiGet(`/api/alerts/patient/${patientId}`).catch(() => ({ data: [] })),
        apiGet(`/api/adherence/patient/${patientId}`).catch(() => ({ data: [] })),
        apiGet(`/api/medications/patient/${patientId}/active`).catch(() => ({ data: { plan: null, today: { takenMedicationIds: [] } } })),
        apiGet(`/api/adherence/summary/${patientId}?days=30`).catch(() => ({ data: null })),
      ]);
      setLatestConsult(c.data);
      const _alerts = Array.isArray(a.data) ? a.data : [];
      setOpenAlerts(_alerts);
      try { localStorage.setItem("patientAlertsCount", String(_alerts.length)); } catch {}
      setMedPack(meds.data || { plan: null, today: { takenMedicationIds: [] } });

      const r = summary?.data?.risk;
      setRisk({ score: typeof r?.score === "number" ? r.score : null, level: r?.level || null });

      const rows = Array.isArray(logs.data) ? logs.data : [];
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const last7 = rows.filter(r => (r?.date ? new Date(r.date).getTime() : 0) >= sevenDaysAgo);
      const avg = last7.length ? Math.round(last7.reduce((s, x) => s + (x.adherenceScore || 0), 0) / last7.length) : 0;
      setAdherence7d(avg);
    } finally {
      setLoading(false);
    }
  };

  const riskTone = useMemo(() => {
    if (risk.level === "high") return "bg-red-50 border-red-100 text-red-700";
    if (risk.level === "moderate") return "bg-amber-50 border-amber-100 text-amber-700";
    if (risk.level === "low") return "bg-emerald-50 border-emerald-100 text-emerald-700";
    return "bg-slate-50 border-slate-100 text-slate-700";
  }, [risk.level]);

  const riskLabel = useMemo(() => {
    if (!risk.level) return "—";
    return risk.level === "high" ? "High" : risk.level === "moderate" ? "Moderate" : "Low";
  }, [risk.level]);

  const downloadMyReport = async () => {
    if (!patientId) return;
    try {
      const res = await axios.get(`${API}/api/reports/patient/${patientId}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Patient_Health_Report_${patientId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate report. Please try again.");
    }
  };

  const toggleMedicationTaken = async (medId) => {
    if (!patientId || !medId) return;
    const current = new Set(medPack?.today?.takenMedicationIds || []);
    if (current.has(medId)) current.delete(medId);
    else current.add(medId);

    await axios.post(`${API}/api/medications/log`, {
      patientId,
      takenMedicationIds: Array.from(current),
    }).catch(() => null);
    refresh();
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    joinRoom({ role: 'patient', id: patientId });
    const s = getSocket();
    s.on('consultation:new', refresh);
    s.on('adherence:updated', refresh);
    s.on('alert:new', refresh);
    return () => {
      s.off('consultation:new', refresh);
      s.off('adherence:updated', refresh);
      s.off('alert:new', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  if (!patientId) {
    return <div className="text-slate-700">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-bold text-slate-900">Clinical Overview</div>
        <div className="text-sm text-slate-600">
          Welcome back, <span className="font-semibold">{name}</span>. Review your status and continue your prescriptions.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <FiShield /> Risk level
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-2xl font-bold text-slate-900">{loading ? "…" : riskLabel}</div>
                <span className={`text-xs rounded-full border px-2 py-1 ${riskTone}`}>Score: {loading ? "…" : (risk.score ?? "—")}</span>
              </div>
              <div className="mt-1 text-sm text-slate-600">Auto-calculated from your last 30 days logs</div>
            </div>
            <button
              onClick={downloadMyReport}
              className="text-sm px-3 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-2 shadow-sm"
              title="Download PDF health report"
              type="button"
            >
              <FiFileText /> Download report
            </button>
          </div>
        </div>

        <StatCard title={<span className="flex items-center gap-2"><FiActivity /> Adherence (7 days)</span>} value={loading ? "…" : `${adherence7d}%`} sub="From your logs" />
        <StatCard title="Active Recommendations" value={loading ? "…" : activeRecsCount} sub="From latest consultation" />
        <StatCard title={<span className="flex items-center gap-2"><FiAlertTriangle /> Open Alerts</span>} value={loading ? "…" : openAlerts.length} sub="From hospital monitoring" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel
          title="Patient Summary"
          right={<Link className="text-sm text-blue-900 hover:underline" to="/adherence">View logs</Link>}
        >
          <div className="space-y-2 text-sm">
            <Row label="Latest advisor" value={latestConsult?.advisorName || "—"} />
            <Row label="Last consultation" value={latestConsult?.createdAt ? new Date(latestConsult.createdAt).toLocaleDateString() : "—"} />
            <div className="flex items-center justify-between">
              <div className="text-slate-600">Medication plan</div>
              <div className="flex items-center gap-2">
                <div className="font-semibold text-slate-900">
                  {medPack?.plan ? `Active (${(medPack.plan.medications || []).length})` : "—"}
                </div>
                <a
                  className="text-xs text-blue-900 hover:underline"
                  href="#medication"
                  title="Jump to medication plan"
                >
                  View
                </a>
              </div>
            </div>
            <div className="pt-2">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Active Constraints</div>
              <div className="flex flex-wrap gap-2">
                {(latestConsult?.recommendations?.diet || []).slice(0, 3).map((t, idx) => (<Tag key={`d${idx}`}>{t}</Tag>))}
                {(latestConsult?.recommendations?.activity || []).slice(0, 3).map((t, idx) => (<Tag key={`a${idx}`}>{t}</Tag>))}
                {(latestConsult?.recommendations?.avoid || []).slice(0, 2).map((t, idx) => (<Tag key={`x${idx}`}>{t}</Tag>))}
                {activeRecsCount === 0 ? <Tag>No constraints yet</Tag> : null}
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Risk & Alerts"
          right={<span className="text-xs rounded-full bg-red-50 border border-red-100 text-red-700 px-2 py-1">{openAlerts.length} active</span>}
        >
          <ul className="space-y-3 text-sm">
            {openAlerts.length === 0 ? (
              <li className="text-slate-600">No active alerts. Keep tracking to maintain your score.</li>
            ) : openAlerts.slice(0, 5).map((al) => (
              <li key={al._id} className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{al.type || 'Alert'}</div>
                  <div className="text-slate-600">{al.message || '-'}</div>
                </div>
                <span className={`text-xs rounded-full border px-2 py-1 capitalize ${
                  al.severity === 'high' ? 'bg-red-50 border-red-100 text-red-700' :
                  al.severity === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                  'bg-slate-50 border-slate-100 text-slate-700'
                }`}>{al.severity || 'low'}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex gap-2">
            <Link className="px-3 py-2 rounded-md bg-blue-900 text-white text-sm hover:bg-blue-800" to="/meals">
              Open Nutrition
            </Link>
</div>
        </Panel>

        <Panel title="AI Explanation Snapshot" right={<Link className="text-sm text-blue-900 hover:underline" to="/meals">Details</Link>}>
          <div className="text-sm text-slate-700 space-y-2">
            <p className="font-semibold">Why today’s plan?</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Plan optimized using genetic algorithm with constraint-driven decision making.</li>
              <li>Advisor recommendations are applied automatically when generating new plans.</li>
              <li>Alerts are created when lifestyle risks are detected from logs.</li>
            </ul>
            <div className="pt-3">
              <Metric label="Adherence" value={Math.min(100, Math.max(0, adherence7d))} />
              <Metric label="Alerts" value={openAlerts.length > 0 ? 60 : 90} />
              <Metric label="Constraints Applied" value={activeRecsCount > 0 ? 85 : 50} />
            </div>
          </div>
        </Panel>
      </div>

      <div id="medication" />
      <Panel title="Medication plan" right={medPack?.plan ? <span className="text-xs text-slate-500">Active plan</span> : null}>
        {!medPack?.plan ? (
          <div className="text-sm text-slate-600">No active medication plan has been assigned by the hospital team.</div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">Mark medications taken today (self-reported).</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(medPack.plan.medications || []).map((m) => {
                const checked = (medPack?.today?.takenMedicationIds || []).includes(m._id);
                return (
                  <label key={m._id} className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={() => toggleMedicationTaken(m._id)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{m.name}</div>
                      <div className="text-sm text-slate-600">{[m.dosage, m.schedule].filter(Boolean).join(" · ") || "—"}</div>
                      {m.instructions ? <div className="text-xs text-slate-500 mt-1">{m.instructions}</div> : null}
                    </div>
                    <span className={`text-xs rounded-full border px-2 py-1 ${checked ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-700"}`}>
                      {checked ? "Taken" : "Pending"}
                    </span>
                  </label>
                );
              })}
            </div>
            {medPack.plan.notes ? <div className="text-xs text-slate-500">Notes: {medPack.plan.notes}</div> : null}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-slate-600">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Tag({ children }) {
  return <span className="text-xs rounded-full bg-slate-50 border px-2 py-1 text-slate-700">{children}</span>;
}

function Metric({ label, value }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-semibold text-slate-900">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-2 bg-emerald-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
