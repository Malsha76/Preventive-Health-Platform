import React, { useEffect, useMemo, useState } from 'react';
import { Store } from 'react-notifications-component';

/**
 * Hospital-style Activity Prescription page (replaces gym/fitness "workout" UX).
 *
 * Purpose:
 * - Show the latest doctor consultation recommendations for the patient
 * - Generate a safe, medically-aligned physical activity prescription
 * - Keep language clinical (prescription, tolerance, safety), not fitness (workout, weight loss)
 */

import { apiFetch } from '../api/client';

function normalizeList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [String(v)];
}

function buildPrescription({ tolerance, minutes, consult }) {
  const activity = normalizeList(consult?.recommendations?.activity);
  const avoid = normalizeList(consult?.recommendations?.avoid);
  const diet = normalizeList(consult?.recommendations?.diet);

  // Default safe base plan
  const plan = {
    primary: 'Walking',
    durationMin: minutes,
    frequency: 'Daily',
    intensity: tolerance === 'low' ? 'Light' : tolerance === 'high' ? 'Moderate' : 'Light to Moderate',
    structure: [
      'Warm-up: 3–5 minutes (slow walking / gentle mobility)',
      'Main activity: steady pace',
      'Cool-down: 3–5 minutes (slow pace + stretching)',
    ],
    safety: [
      'Stop if you feel dizziness, chest pain, unusual shortness of breath, or severe fatigue.',
      'Stay hydrated and avoid activity during extreme heat.',
      'For diabetes: carry a fast-acting carbohydrate (e.g., glucose tablets) if advised.',
    ],
    constraintsApplied: [],
  };

  // If doctor explicitly advised daily walking, keep it as primary
  if (activity.some((a) => String(a).toLowerCase().includes('walking'))) {
    plan.constraintsApplied.push('Doctor recommendation: daily walking');
  }

  // Intensity adjustments
  if (activity.some((a) => String(a).toLowerCase().includes('light'))) {
    plan.intensity = 'Light';
    plan.constraintsApplied.push('Doctor recommendation: light intensity');
  }
  if (activity.some((a) => String(a).toLowerCase().includes('moderate')) && tolerance !== 'low') {
    plan.intensity = 'Moderate';
    plan.constraintsApplied.push('Doctor recommendation: moderate intensity');
  }

  // Avoid rules
  if (avoid.some((a) => String(a).toLowerCase().includes('high impact'))) {
    plan.safety.unshift('Avoid high-impact exercises (jumping/running) unless cleared by a doctor.');
    plan.constraintsApplied.push('Avoid: high-impact exercises');
  }
  if (avoid.some((a) => String(a).toLowerCase().includes('late-night'))) {
    plan.safety.unshift('Avoid late-night intense activity; prefer daytime or early evening.');
    plan.constraintsApplied.push('Avoid: late-night activity');
  }

  // If consultation includes low sugar diet, add a diabetes-friendly activity note
  if (diet.some((d) => String(d).toLowerCase().includes('low sugar'))) {
    plan.safety.push('If you are diabetic: check blood glucose as advised before/after activity.');
    plan.constraintsApplied.push('Diet guidance suggests diabetes-focused risk profile');
  }

  return plan;
}

export default function WorkoutGenerator({ loggedInUser }) {
  const [loading, setLoading] = useState(false);
  const [consultation, setConsultation] = useState(null);
  const [consultationStatus, setConsultationStatus] = useState('idle'); // idle | loading | ready | none | error
  const [error, setError] = useState('');
  const [tolerance, setTolerance] = useState('medium'); // low | medium | high
  const [minutes, setMinutes] = useState(20);
  const [prescription, setPrescription] = useState(null);

  // Support App state + localStorage (page refresh) + object/_id shapes
  const patientId = (() => {
    const pick = (v) => {
      if (!v) return null;
      if (typeof v === 'string') return v;
      if (typeof v === 'object') return v._id || v.userId || null;
      return String(v);
    };
    const fromProp = pick(loggedInUser);
    if (fromProp) return String(fromProp);
    try {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      const fromStorage = pick(stored);
      return fromStorage ? String(fromStorage) : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!patientId) return;

    const run = async () => {
      setConsultationStatus('loading');
      setError('');
      try {
        const res = await apiFetch(`/api/consultations/patient/${patientId}/latest`);
        if (res.status === 404) {
          setConsultation(null);
          setConsultationStatus('none');
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load consultation (${res.status})`);
        }
        const data = await res.json();
        setConsultation(data);
        setConsultationStatus('ready');
      } catch (e) {
        setConsultationStatus('error');
        setError(e?.message || 'Failed to load consultation');
      }
    };

    run();
  }, [patientId]);

  const doctorSummary = useMemo(() => {
    const rec = consultation?.recommendations || {};
    return {
      diet: normalizeList(rec.diet),
      activity: normalizeList(rec.activity),
      avoid: normalizeList(rec.avoid),
      notes: consultation?.notes || '',
    };
  }, [consultation]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!patientId) {
      Store.addNotification({
        title: 'Login required',
        message: 'Please log in as a patient to view your prescription.',
        type: 'warning',
        insert: 'top',
        container: 'top-right',
        dismiss: { duration: 2500 },
      });
      return;
    }

    setLoading(true);
    try {
      const plan = buildPrescription({
        tolerance,
        minutes: Number(minutes || 20),
        consult: consultation,
      });
      setPrescription(plan);
      Store.addNotification({
        title: 'Activity prescription generated',
        message: 'Created using consultation guidance and safety constraints.',
        type: 'success',
        insert: 'top',
        container: 'top-right',
        dismiss: { duration: 2500 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!patientId) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-yellow-800 mb-4">Patient access required</h2>
          <p className="text-yellow-700 mb-4">Please log in as a patient to view your activity prescription.</p>
          <a href="/login" className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Physical Activity Prescription</h1>
            <p className="text-gray-600 mt-1">Clinically aligned activity guidance based on your latest consultation.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              System Online
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Recommendations */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Doctor Recommendations</h2>

          {consultationStatus === 'loading' && <p className="text-gray-600">Loading latest consultation…</p>}

          {consultationStatus === 'none' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium">No consultation found yet.</p>
              <p className="text-blue-700 text-sm mt-1">
                Ask your doctor/health advisor to add recommendations. Once saved, this page will reflect them.
              </p>
            </div>
          )}

          {consultationStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Could not load consultation.</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {consultationStatus === 'ready' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Diet guidance</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {doctorSummary.diet.length ? (
                    doctorSummary.diet.map((d, i) => (
                      <span key={`diet-${i}`} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No diet tags</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Activity guidance</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {doctorSummary.activity.length ? (
                    doctorSummary.activity.map((a, i) => (
                      <span
                        key={`act-${i}`}
                        className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-sm border border-green-200"
                      >
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No activity tags</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Avoid / restrictions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {doctorSummary.avoid.length ? (
                    doctorSummary.avoid.map((a, i) => (
                      <span
                        key={`avoid-${i}`}
                        className="px-2 py-1 rounded-full bg-amber-50 text-amber-800 text-sm border border-amber-200"
                      >
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No restrictions</span>
                  )}
                </div>
              </div>

              {doctorSummary.notes ? (
                <div>
                  <p className="text-sm font-medium text-gray-700">Clinical notes</p>
                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {doctorSummary.notes}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Prescription Generator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Generate your activity prescription</h2>
            <p className="text-gray-600 text-sm mb-5">
              The system uses your consultation guidance and safety constraints to create a practical daily plan.
            </p>

            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label htmlFor="activity-tolerance" className="block text-sm font-medium text-gray-700">
                    Activity tolerance
                  </label>
                  <select
                    id="activity-tolerance"
                    value={tolerance}
                    onChange={(e) => setTolerance(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                  >
                    <option value="low">Low (recovery / elderly)</option>
                    <option value="medium">Medium (general)</option>
                    <option value="high">High (active, cleared)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="activity-minutes" className="block text-sm font-medium text-gray-700">
                    Time available (minutes)
                  </label>
                  <input
                    id="activity-minutes"
                    type="number"
                    min={10}
                    max={60}
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                  />
                  <p className="text-xs text-gray-500">Suggested default: 20 minutes (10–60)</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto sm:min-w-[220px] px-6 py-3 rounded-xl bg-green-600 text-white font-semibold shadow-sm hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Generating…' : 'Generate prescription'}
              </button>
            </form>
          </div>

          {prescription && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your plan</h2>
                  <p className="text-gray-600 mt-1 text-sm">A safe, hospital-aligned physical activity prescription.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                  {prescription.frequency} • {prescription.durationMin} min • {prescription.intensity}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Primary activity</h3>
                  <p className="text-gray-800">{prescription.primary}</p>

                  <h3 className="font-semibold text-gray-900 mt-5 mb-2">Session structure</h3>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    {prescription.structure.map((s, i) => (
                      <li key={`struct-${i}`}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Safety guidance</h3>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    {prescription.safety.map((s, i) => (
                      <li key={`safe-${i}`}>{s}</li>
                    ))}
                  </ul>

                  <h3 className="font-semibold text-gray-900 mt-5 mb-2">How this plan was derived</h3>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Time constraint: {prescription.durationMin} minutes</li>
                    <li>Tolerance level: {tolerance}</li>
                    {(prescription.constraintsApplied.length
                      ? prescription.constraintsApplied
                      : ['No additional constraints were detected.']
                    ).map((c, i) => (
                      <li key={`c-${i}`}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-900 font-semibold">Medical disclaimer</p>
                <p className="text-amber-800 text-sm mt-1">
                  This module supports post-consultation lifestyle management. It does not diagnose conditions and does not replace
                  medical advice. Always follow your clinician’s instructions.
                </p>
              </div> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
