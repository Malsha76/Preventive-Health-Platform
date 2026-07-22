import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { apiGet, apiPost } from "../api/client";
import { FiDownload } from "react-icons/fi";
import { formatPatientId } from "../utils/formatters";
import { Store } from "react-notifications-component";

function Card({ title, children, right }) {
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

function Badge({ children, tone = "slate" }) {
  const cls =
    tone === "red"
      ? "bg-red-50 border-red-100 text-red-700"
      : tone === "amber"
      ? "bg-amber-50 border-amber-100 text-amber-700"
      : tone === "emerald"
      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
      : "bg-slate-50 border-slate-100 text-slate-700";
  return <span className={`text-xs rounded-full border px-2 py-1 ${cls}`}>{children}</span>;
}

export default function HospitalPatientProfile() {
  const { patientId } = useParams();
  const location = useLocation();
  const basePath = (location.pathname || "").startsWith("/doctor") ? "/doctor" : "/hospital";
  const isDoctor = basePath === "/doctor";

  const [patient, setPatient] = useState(null);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [latestConsult, setLatestConsult] = useState(null);
  const [med, setMed] = useState({ plan: null, today: { takenMedicationIds: [] } });

  const [noteText, setNoteText] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState("");

  const [planDiet, setPlanDiet] = useState("");
  const [planActivity, setPlanActivity] = useState("");
  const [planAvoid, setPlanAvoid] = useState("");
  const [planNotes, setPlanNotes] = useState("");

  const [medItems, setMedItems] = useState([{ name: "", dosage: "", schedule: "", instructions: "" }]);
  const [medNotes, setMedNotes] = useState("");

  const staffUser = useMemo(() => {
    const path = window.location.pathname || "";
    const key = path.startsWith("/doctor") ? "doctor" : "hospital";
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  }, []);

  const clinicianId = staffUser?._id || staffUser?.email || "staff";
  const clinicianName = staffUser
    ? ([staffUser.firstName, staffUser.lastName].filter(Boolean).join(" ").trim() || staffUser.email)
    : "Clinician";

  const refresh = async () => {
    const [u, s, a, f, c, m] = await Promise.all([
      apiGet(`/user/${patientId}`).catch(() => ({ data: null })),
      apiGet(`/api/adherence/summary/${patientId}?days=30`).catch(() => ({ data: null })),
      apiGet(`/api/alerts/patient/${patientId}`).catch(() => ({ data: [] })),
      apiGet(`/api/followups/patient/${patientId}`).catch(() => ({ data: [] })),
      apiGet(`/api/consultations/patient/${patientId}/latest`).catch((err) => ({
        data: err?.response?.status === 404 ? null : null,
      })),
      apiGet(`/api/medications/patient/${patientId}/active`).catch(() => ({ data: { plan: null, today: { takenMedicationIds: [] } } })),
    ]);
    setPatient(u.data);
    setSummary(s.data);
    setAlerts(Array.isArray(a.data) ? a.data : []);
    setFollowups(Array.isArray(f.data) ? f.data : []);
    setLatestConsult(c.data);
    setMed(m.data);
  };

  const downloadPdf = async () => {
    try {
      const res = await apiGet(`/api/reports/patient/${patientId}/pdf`, { responseType: "blob" });
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
      alert("Failed to generate PDF report.");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const saveFollowUp = async () => {
    if (!noteText.trim()) return;
    await apiPost('/api/followups', {
      patientId,
      clinicianId,
      clinicianName,
      comment: noteText.trim(),
      nextReviewDate: nextReviewDate || null,
    });
    setNoteText("");
    setNextReviewDate("");
    refresh();
  };

  const clearFollowUpFlag = async () => {
    await apiPost(`/api/followups/patient/${patientId}/clear-flag`, {});
    refresh();
  };

  const submitUpdatedPlan = async () => {
    try {
      const splitLines = (t) =>
        String(t || "")
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean);
      await apiPost('/api/consultations', {
        patientId,
        advisorId: clinicianId,
        advisorName: clinicianName,
        recommendations: {
          diet: splitLines(planDiet),
          activity: splitLines(planActivity),
          avoid: splitLines(planAvoid),
        },
        notes: planNotes,
      });
      setPlanDiet("");
      setPlanActivity("");
      setPlanAvoid("");
      setPlanNotes("");
      refresh();
      Store.addNotification({
        insert: "top",
        container: "top-right",
        dismiss: { duration: 5000 },
        content: () => (
          <ToastContent
            variant="success"
            title="Success!"
            message="Consultation recommendations saved for this patient."
          />
        ),
      });
    } catch (e) {
      Store.addNotification({
        insert: "top",
        container: "top-right",
        dismiss: { duration: 5000 },
        content: () => (
          <ToastContent
            variant="error"
            title="Error!"
            message={e?.response?.data?.message || "Failed to save consultation recommendations."}
          />
        ),
      });
    }
  };

  const saveMedicationPlan = async () => {
    try {
      const cleaned = (medItems || []).filter((m) => m && String(m.name || "").trim());
      await apiPost('/api/medications/plan', {
        patientId,
        clinicianId,
        clinicianName,
        medications: cleaned,
        notes: medNotes,
      });
      setMedItems([{ name: "", dosage: "", schedule: "", instructions: "" }]);
      setMedNotes("");
      refresh();
      Store.addNotification({
        insert: "top",
        container: "top-right",
        dismiss: { duration: 5000 },
        content: () => (
          <ToastContent
            variant="success"
            title="Success!"
            message="Medication plan saved for this patient."
          />
        ),
      });
    } catch (e) {
      Store.addNotification({
        insert: "top",
        container: "top-right",
        dismiss: { duration: 5000 },
        content: () => (
          <ToastContent
            variant="error"
            title="Error!"
            message={e?.response?.data?.message || "Failed to save medication plan."}
          />
        ),
      });
    }
  };

  const riskBadge = useMemo(() => {
    const lvl = summary?.risk?.level;
    if (lvl === "high") return <Badge tone="red">High risk</Badge>;
    if (lvl === "moderate") return <Badge tone="amber">Moderate risk</Badge>;
    return <Badge tone="emerald">Low risk</Badge>;
  }, [summary]);

  const hasRecent7dData = useMemo(() => {
    const lastUpdated = summary?.lastUpdated ? new Date(summary.lastUpdated) : null;
    if (!lastUpdated || Number.isNaN(lastUpdated.getTime())) return false;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return lastUpdated >= sevenDaysAgo;
  }, [summary]);

  function ToastContent({ variant, title, message }) {
    const [w, setW] = useState("100%");
    useEffect(() => {
      const t1 = setTimeout(() => setW("0%"), 20);
      return () => clearTimeout(t1);
    }, []);
    const box = variant === "error" ? "bg-red-600" : "bg-green-600";
    const track = variant === "error" ? "bg-red-700/50" : "bg-green-700/50";
    return (
      <div className={`w-80 ${box} text-white rounded-lg shadow-lg overflow-hidden`}>
        <div className="p-4">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs mt-1 opacity-90">{message}</div>
        </div>
        <div className={`h-1 ${track}`}>
          <div className="h-1 bg-white/90" style={{ width: w, transition: "width 5s linear" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-900">Patient Profile</div>
          <div className="text-sm text-slate-600">
            <span className="font-semibold">
              {patient ? ([patient.firstName, patient.lastName].filter(Boolean).join(" ") || patient.email) : "—"}
            </span>
            <span className="text-slate-400"> · </span>
            <span className="text-slate-500">Patient ID: {formatPatientId(patientId)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link className="px-3 py-2 rounded-lg border text-sm hover:bg-slate-50" to={`${basePath}/patients`}>
            Back
          </Link>
          <button
            onClick={downloadPdf}
            className="px-3 py-2 rounded-lg border text-sm hover:bg-slate-50 flex items-center gap-2"
            title="Download PDF patient report"
          >
            <FiDownload /> PDF
          </button>
          <button onClick={refresh} className="px-3 py-2 rounded-lg bg-blue-900 text-white text-sm hover:bg-blue-800">
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card title="Adherence (7d)" right={riskBadge}>
          <div className="text-3xl font-bold">
            {hasRecent7dData ? `${summary?.averages?.last7 ?? 0}%` : "No data"}
          </div>
          <div className="text-sm text-slate-600 mt-1">30d avg: {summary?.averages?.last30 ?? "—"}%</div>
          <div className="text-xs text-slate-500 mt-2">Risk score: {summary?.risk?.score ?? "—"}</div>
        </Card>
        <Card title="Open alerts">
          <div className="text-3xl font-bold">{alerts?.length || 0}</div>
          <div className="text-sm text-slate-600 mt-1">Includes automated follow-up alerts</div>
        </Card>
        <Card title="Latest consultation">
          <div className="text-sm text-slate-700">
            {latestConsult?.createdAt ? new Date(latestConsult.createdAt).toLocaleString() : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">Advisor: {latestConsult?.advisorName || "—"}</div>
        </Card>
        <Card
          title="Follow-up status"
          right={patient?.needsFollowUp ? <Badge tone="red">Needs follow-up</Badge> : <Badge tone="emerald">OK</Badge>}
        >
          <div className="text-sm text-slate-700">
            {patient?.needsFollowUpAt ? `Flagged: ${new Date(patient.needsFollowUpAt).toLocaleString()}` : "Not flagged"}
          </div>
          <div className="mt-3">
            <button
              onClick={clearFollowUpFlag}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-slate-50"
            >
              Clear flag
            </button>
          </div>
        </Card>
      </div>

      {isDoctor ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Clinician follow-up notes">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                className="md:col-span-2 border rounded-lg px-3 py-2 text-sm"
                placeholder="Add follow-up note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                type="date"
                value={nextReviewDate}
                onChange={(e) => setNextReviewDate(e.target.value)}
              />
            </div>
            <button
              onClick={saveFollowUp}
              className="px-3 py-2 rounded-lg bg-blue-900 text-white text-sm hover:bg-blue-800"
            >
              Save note
            </button>

            <div className="pt-3 border-t">
              {followups.length === 0 ? (
                <div className="text-sm text-slate-600">No follow-up notes yet.</div>
              ) : (
                <ul className="space-y-3">
                  {followups.slice(0, 10).map((n) => (
                    <li key={n._id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{n.clinicianName || "Clinician"}</div>
                          <div className="text-sm text-slate-700 mt-1">{n.comment}</div>
                          {n.nextReviewDate ? (
                            <div className="text-xs text-slate-500 mt-2">
                              Next review: {new Date(n.nextReviewDate).toLocaleDateString()}
                            </div>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>

        <Card title="Update treatment plan">
          <div className="text-xs text-slate-500 mb-3">
            Creates a new consultation entry (plan update) visible on the patient dashboard.
          </div>
          <div className="grid grid-cols-1 gap-2">
            <textarea className="border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Diet recommendations (one per line)" value={planDiet} onChange={(e) => setPlanDiet(e.target.value)} />
            <textarea className="border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Lifestyle / activity recommendations (one per line)" value={planActivity} onChange={(e) => setPlanActivity(e.target.value)} />
            <textarea className="border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Avoid / restrictions (one per line)" value={planAvoid} onChange={(e) => setPlanAvoid(e.target.value)} />
            <textarea className="border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Clinician notes" value={planNotes} onChange={(e) => setPlanNotes(e.target.value)} />
            <button onClick={submitUpdatedPlan} className="px-3 py-2 rounded-lg bg-blue-900 text-white text-sm hover:bg-blue-800">
              Publish updated plan
            </button>
          </div>
        </Card>
      </div>
      ) : null}

      {isDoctor ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Medication plan">
          <div className="text-sm text-slate-700">
            Active plan: {med?.plan ? <span className="font-semibold">Yes</span> : <span className="text-slate-500">No plan</span>}
          </div>
          {med?.plan ? (
            <div className="mt-3 space-y-2">
              {(med.plan.medications || []).map((m) => (
                <div key={m._id} className="flex items-start justify-between gap-3 border rounded-lg p-3">
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-sm text-slate-600">
                      {[m.dosage, m.schedule].filter(Boolean).join(" · ")}
                    </div>
                    {m.instructions ? <div className="text-xs text-slate-500 mt-1">{m.instructions}</div> : null}
                  </div>
                  <Badge tone="slate">Active</Badge>
                </div>
              ))}
              {med.plan.notes ? <div className="text-xs text-slate-500">Plan notes: {med.plan.notes}</div> : null}
            </div>
          ) : null}
        </Card>

        <Card title="Create / replace medication plan">
          <div className="space-y-3">
            {(medItems || []).map((it, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Medication" value={it.name} onChange={(e) => {
                  const copy = [...medItems];
                  copy[idx] = { ...copy[idx], name: e.target.value };
                  setMedItems(copy);
                }} />
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Dosage" value={it.dosage} onChange={(e) => {
                  const copy = [...medItems];
                  copy[idx] = { ...copy[idx], dosage: e.target.value };
                  setMedItems(copy);
                }} />
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Schedule" value={it.schedule} onChange={(e) => {
                  const copy = [...medItems];
                  copy[idx] = { ...copy[idx], schedule: e.target.value };
                  setMedItems(copy);
                }} />
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Instructions" value={it.instructions} onChange={(e) => {
                  const copy = [...medItems];
                  copy[idx] = { ...copy[idx], instructions: e.target.value };
                  setMedItems(copy);
                }} />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-2 rounded-lg border text-sm hover:bg-slate-50"
                onClick={() => setMedItems([...(medItems || []), { name: "", dosage: "", schedule: "", instructions: "" }])}
              >
                + Add medication
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-blue-900 text-white text-sm hover:bg-blue-800"
                onClick={saveMedicationPlan}
              >
                Save medication plan
              </button>
            </div>
            <textarea className="border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Plan notes (optional)" value={medNotes} onChange={(e) => setMedNotes(e.target.value)} />
          </div>
        </Card>
      </div>
      ) : null}
    </div>
  );
}
