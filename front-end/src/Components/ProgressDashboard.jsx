import React, { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { getSocket, joinRoom } from '../services/socket';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_URL = 'http://localhost:3001/api';

function formatShortDate(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function Badge({ tone = 'neutral', children }) {
  const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium';
  const map = {
    neutral: 'bg-slate-100 text-slate-800 border border-slate-200',
    good: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    warn: 'bg-amber-100 text-amber-900 border border-amber-200',
    bad: 'bg-rose-100 text-rose-900 border border-rose-200',
  };
  return <span className={`${base} ${map[tone] || map.neutral}`}>{children}</span>;
}

export default function ProgressDashboard({ loggedInUser }) {
  const [summary, setSummary] = useState(null);
  const [alertsCount, setAlertsCount] = useState(0);
  const [alertStatusBreakdown, setAlertStatusBreakdown] = useState({
    open: 0,
    acknowledged: 0,
    inProgress: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trendTone = useMemo(() => {
    const t = summary?.trend?.label;
    if (t === 'improving') return 'good';
    if (t === 'declining') return 'bad';
    return 'neutral';
  }, [summary]);

  async function loadAll() {
    if (!loggedInUser) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');

      const [summaryRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/adherence/summary/${loggedInUser}?days=30`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${API_URL}/alerts/patient/${loggedInUser}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
      ]);

      if (!summaryRes.ok) {
        const t = await summaryRes.text();
        throw new Error(t || 'Failed to load progress summary');
      }

      const s = await summaryRes.json();
      setSummary(s);

      if (alertsRes.ok) {
        const a = await alertsRes.json();
        const rows = Array.isArray(a) ? a : [];
        setAlertsCount(rows.length);
        const breakdown = rows.reduce(
          (acc, item) => {
            const status = String(item?.status || (item?.resolved ? 'Resolved' : 'Open')).toLowerCase();
            if (status === 'acknowledged') acc.acknowledged += 1;
            else if (status === 'in progress') acc.inProgress += 1;
            else if (status !== 'resolved') acc.open += 1;
            return acc;
          },
          { open: 0, acknowledged: 0, inProgress: 0 }
        );
        setAlertStatusBreakdown(breakdown);
      } else {
        setAlertsCount(0);
        setAlertStatusBreakdown({ open: 0, acknowledged: 0, inProgress: 0 });
      }
    } catch (e) {
      setError(e?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  }

  // Initial load + reload on user change
  useEffect(() => {
    if (!loggedInUser) return;
    loadAll();
  }, [loggedInUser]);

  // Near real-time auto-update
  useEffect(() => {
    if (!loggedInUser) return;
    joinRoom({ role: 'patient', id: loggedInUser });
    const s = getSocket();

    const onAdherenceUpdated = () => loadAll();
    const onAlertNew = () => loadAll();

    s.on('adherence:updated', onAdherenceUpdated);
    s.on('alert:new', onAlertNew);

    return () => {
      s.off('adherence:updated', onAdherenceUpdated);
      s.off('alert:new', onAlertNew);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser]);

  const chartData = useMemo(() => {
    const series = summary?.series || [];
    const labels = series.map((p) => formatShortDate(p.date));
    const values = series.map((p) => Number(p.adherenceScore || 0));

    return {
      labels,
      datasets: [
        {
          label: 'Adherence score (0-100)',
          data: values,
          borderColor: '#0f766e',
          backgroundColor: 'rgba(15, 118, 110, 0.16)',
          pointBackgroundColor: '#0f766e',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 4,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }, [summary]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#f9fafb',
          bodyColor: '#f9fafb',
          borderColor: '#374151',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: { color: '#374151' },
          grid: { color: '#e5e7eb' },
        },
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20, color: '#374151' },
          grid: { color: '#e5e7eb' },
        },
      },
    }),
    []
  );

  if (!loggedInUser) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-semibold">Progress & Monitoring</h2>
          <p className="text-gray-600 mt-2">Please log in to view your progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress & Monitoring</h2>
          <p className="text-slate-700 mt-1">
            This dashboard updates automatically from your daily adherence logs.
          </p>
        </div>

        <button
          onClick={loadAll}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-600 font-semibold">Adherence (7 days)</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{summary?.averages?.last7 ?? 0}%</div>
          <div className="mt-2">
            <Badge tone={trendTone}>Trend: {summary?.trend?.label || 'stable'}</Badge>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-600 font-semibold">Adherence (30 days)</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{summary?.averages?.last30 ?? 0}%</div>
          <div className="mt-2 text-sm text-slate-700">
            Δ {summary?.trend?.delta ?? 0} vs previous week
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-600 font-semibold">Open alerts</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{alertsCount}</div>
          <div className="mt-2">
            <Badge tone={alertsCount > 0 ? 'warn' : 'good'}>{alertsCount > 0 ? 'Needs attention' : 'No active alerts'}</Badge>
          </div>
          <div className="mt-2 text-xs text-slate-700">
            Open: {alertStatusBreakdown.open} | Acknowledged: {alertStatusBreakdown.acknowledged} | In Progress: {alertStatusBreakdown.inProgress}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-600 font-semibold">Sugar risk days (30d)</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{summary?.counters?.sugarHighDays ?? 0}</div>
          <div className="mt-2 text-sm text-slate-700">Based on self-reported logs</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Adherence trend</h3>
              <p className="text-sm text-slate-700">Auto-generated from daily logs</p>
            </div>
            <div className="text-xs text-slate-600">
              Last update: {summary?.lastUpdated ? formatShortDate(summary.lastUpdated) : '—'}
            </div>
          </div>
          <div className="mt-4">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Risk signals (30 days)</h3>
          <p className="text-sm text-slate-700">Used to trigger doctor/hospital alerts</p>

          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span>Low sleep (&lt; 6h)</span>
              <span className="font-semibold">{summary?.counters?.lowSleepDays ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>High stress</span>
              <span className="font-semibold">{summary?.counters?.stressHighDays ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Missed meal plan</span>
              <span className="font-semibold">{summary?.counters?.missedMealPlanDays ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Missed activity</span>
              <span className="font-semibold">{summary?.counters?.missedActivityDays ?? 0}</span>
            </li>
          </ul>

          <div className="mt-5 text-xs text-gray-500">
            </div>
        </div>
      </div>
    </div>
  );
}
