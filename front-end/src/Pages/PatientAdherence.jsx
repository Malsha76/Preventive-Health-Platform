import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Store } from 'react-notifications-component';

export default function PatientAdherence({ loggedInUser }) {
  const [form, setForm] = useState({
    mealPlanFollowed: false,
    workoutCompleted: false,
    walkMinutes: 0,
    sleepHours: 0,
    waterLiters: 0,
    sugarHigh: false,
    stressHigh: false,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState({
    walkMinutes: '',
    sleepHours: '',
    waterLiters: '',
  });

  const apiBase = useMemo(() => 'http://localhost:3001', []);

  const notify = (type, title, message) => {
    Store.addNotification({
      title,
      message,
      type,
      insert: 'top',
      container: 'top-right',
      dismiss: { duration: 3000, onScreen: true },
    });
  };

  const fetchLogs = async () => {
    if (!loggedInUser) return;
    try {
      const res = await axios.get(`${apiBase}/api/adherence/patient/${loggedInUser}`);
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser]);

  const validate = () => {
    const next = { walkMinutes: '', sleepHours: '', waterLiters: '' };
    const walk = Number(form.walkMinutes);
    const sleep = Number(form.sleepHours);
    const water = Number(form.waterLiters);

    if (Number.isNaN(walk) || walk < 0 || walk > 600) {
      next.walkMinutes = 'Enter walk minutes between 0 and 600';
    }
    if (Number.isNaN(sleep) || sleep < 0 || sleep > 24) {
      next.sleepHours = 'Enter sleep hours between 0 and 24';
    }
    if (Number.isNaN(water) || water < 0 || water > 15) {
      next.waterLiters = 'Enter water intake between 0 and 15 liters';
    }

    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await axios.post(`${apiBase}/api/adherence/log`, {
        patientId: loggedInUser,
        activities: {
          mealPlanFollowed: !!form.mealPlanFollowed,
          workoutCompleted: !!form.workoutCompleted,
          walkMinutes: Number(form.walkMinutes || 0),
          sleepHours: Number(form.sleepHours || 0),
          waterLiters: Number(form.waterLiters || 0),
          sugarHigh: !!form.sugarHigh,
          stressHigh: !!form.stressHigh,
        },
        notes: form.notes,
      });
      notify('success', 'Saved', 'Today’s lifestyle log saved.');
      setForm((f) => ({ ...f, notes: '' }));
      await fetchLogs();
    } catch (err) {
      notify('danger', 'Error', err?.response?.data?.message || 'Failed to save log');
    } finally {
      setLoading(false);
    }
  };

  if (!loggedInUser) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Daily Lifestyle Tracking</h1>
        <p className="mt-2 text-gray-600">Please login to track your daily lifestyle.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800">Daily Lifestyle Tracking</h1>
      <p className="text-gray-600 mt-1">
        Log your daily adherence after consultation. The system can alert your health advisor if risks appear.
      </p>

      <form onSubmit={submit} className="mt-6 bg-white rounded-lg shadow p-6 space-y-4" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.mealPlanFollowed} onChange={(e) => setForm({ ...form, mealPlanFollowed: e.target.checked })} />
            Followed nutrition plan today
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.workoutCompleted} onChange={(e) => setForm({ ...form, workoutCompleted: e.target.checked })} />
            Completed planned activity/workout
          </label>

          <div>
            <label className="block text-sm font-medium">Walk minutes</label>
            <input
              className={`mt-1 w-full border rounded px-3 py-2 ${errors.walkMinutes ? 'border-red-400' : ''}`}
              type="number"
              min="0"
              max="600"
              value={form.walkMinutes}
              onChange={(e) => {
                setForm({ ...form, walkMinutes: e.target.value });
                setErrors((prev) => (prev.walkMinutes ? { ...prev, walkMinutes: '' } : prev));
              }}
              aria-invalid={!!errors.walkMinutes}
            />
            {errors.walkMinutes ? <div className="text-xs text-red-600 mt-1">{errors.walkMinutes}</div> : null}
          </div>
          <div>
            <label className="block text-sm font-medium">Sleep hours</label>
            <input
              className={`mt-1 w-full border rounded px-3 py-2 ${errors.sleepHours ? 'border-red-400' : ''}`}
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={form.sleepHours}
              onChange={(e) => {
                setForm({ ...form, sleepHours: e.target.value });
                setErrors((prev) => (prev.sleepHours ? { ...prev, sleepHours: '' } : prev));
              }}
              aria-invalid={!!errors.sleepHours}
            />
            {errors.sleepHours ? <div className="text-xs text-red-600 mt-1">{errors.sleepHours}</div> : null}
          </div>

          <div>
            <label className="block text-sm font-medium">Water liters</label>
            <input
              className={`mt-1 w-full border rounded px-3 py-2 ${errors.waterLiters ? 'border-red-400' : ''}`}
              type="number"
              min="0"
              max="15"
              step="0.1"
              value={form.waterLiters}
              onChange={(e) => {
                setForm({ ...form, waterLiters: e.target.value });
                setErrors((prev) => (prev.waterLiters ? { ...prev, waterLiters: '' } : prev));
              }}
              aria-invalid={!!errors.waterLiters}
            />
            {errors.waterLiters ? <div className="text-xs text-red-600 mt-1">{errors.waterLiters}</div> : null}
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.sugarHigh} onChange={(e) => setForm({ ...form, sugarHigh: e.target.checked })} />
              High sugar intake today
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.stressHigh} onChange={(e) => setForm({ ...form, stressHigh: e.target.checked })} />
              High stress today
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Notes (optional)</label>
          <textarea className="mt-1 w-full border rounded px-3 py-2" rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <button disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Saving...' : 'Save Today’s Log'}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Recent logs</h2>
        <div className="mt-3 space-y-3">
          {logs.length === 0 && <p className="text-gray-600">No logs yet.</p>}
          {logs.map((l) => (
            <div key={l._id} className="bg-white rounded shadow p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{new Date(l.date).toDateString()}</div>
                <div className="text-sm">Adherence: <span className="font-semibold">{l.adherenceScore}%</span></div>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                {l.activities?.mealPlanFollowed ? '✅ Nutrition' : '❌ Nutrition'} · {l.activities?.workoutCompleted ? '✅ Activity' : '❌ Activity'} · Walk {l.activities?.walkMinutes || 0}m · Sleep {l.activities?.sleepHours || 0}h
                {l.activities?.sugarHigh ? ' · ⚠️ Sugar high' : ''}
                {l.activities?.stressHigh ? ' · ⚠️ Stress high' : ''}
              </div>
              {l.notes ? <div className="mt-2 text-sm text-gray-600">Note: {l.notes}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
