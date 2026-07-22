import React, { useState } from "react";
import { apiGet } from "../api/client";
import { formatPatientId } from "../utils/formatters";

function downloadFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = String(v ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [
    headers.map(esc).join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ];
  return lines.join("\n");
}

export default function HospitalReports() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const exportPatientsCSV = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await apiGet('/api/hospital/patients?limit=500');
      const rows = (res.data || []).map((p) => ({
        patientId: formatPatientId(p._id),
        name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
        email: p.email || "",
        needsFollowUp: p.needsFollowUp ? "Yes" : "No",
        openAlerts: p.openAlerts ?? 0,
        lastAdherenceScore: p.lastAdherenceScore ?? "",
        lastLogDate: p.lastLogDate ? new Date(p.lastLogDate).toISOString() : "",
        lastConsultationAt: p.lastConsultationAt ? new Date(p.lastConsultationAt).toISOString() : "",
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : "",
      }));
      downloadFile("patients_report.csv", toCSV(rows));
      setStatus("Patients report downloaded.");
    } catch (e) {
      setStatus(e?.response?.data?.message || "Failed to export patients report.");
    } finally {
      setLoading(false);
    }
  };

  const exportAlertsCSV = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await apiGet('/api/hospital/alerts/recent');
      const rows = (res.data || []).map((a) => ({
        createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : "",
        severity: a.severity || "",
        patient: a.patient?.name || a.patient?.email || a.patientId || "",
        message: a.message || "",
        status: a.resolved ? "Resolved" : "Open",
        alertId: a._id,
      }));
      downloadFile("alerts_report.csv", toCSV(rows));
      setStatus("Alerts report downloaded.");
    } catch (e) {
      setStatus(e?.response?.data?.message || "Failed to export alerts report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="text-lg font-semibold">Reports</div>
      <div className="text-sm text-slate-500 mt-1">
        Export hospital summaries for review and documentation.
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div className="border rounded-xl p-4 flex flex-col h-full">
          <div className="font-medium">Patients summary</div>
          <div className="text-sm text-slate-600 mt-1">
            Exports patient list with follow up flags, open alerts and recent adherence.
          </div>
          <button
            onClick={exportPatientsCSV}
            disabled={loading}
            className="mt-auto px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Preparing..." : "Download CSV"}
          </button>
        </div>

        <div className="border rounded-xl p-4 flex flex-col h-full">
          <div className="font-medium">Recent alerts</div>
          <div className="text-sm text-slate-600 mt-1">
            Exports recent alerts with severity, patient, message and status.
          </div>
          <button
            onClick={exportAlertsCSV}
            disabled={loading}
            className="mt-auto px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Preparing..." : "Download CSV"}
          </button>
        </div>
      </div>

      {status ? (
        <div className="mt-4 text-sm text-slate-700">{status}</div>
      ) : null}

      {/* <div className="mt-6 text-xs text-slate-500">
        Tip: Use exported CSVs to create charts in Excel/Google Sheets for your final-year presentation.
      </div> */}
    </div>
  );
}
