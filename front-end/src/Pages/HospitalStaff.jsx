import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api/client";

export default function HospitalStaff() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [created, setCreated] = useState(null); // {doctor,tempPassword}
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDays, setInviteDays] = useState(14);
  const [inviteResult, setInviteResult] = useState(null);

  const canCreate = useMemo(() => {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    return firstName.trim() && lastName.trim() && emailOk;
  }, [firstName, lastName, email]);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const res = await apiGet('/api/hospital/doctors');
      setList(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPatientInvite(e) {
    e.preventDefault();
    setInviteResult(null);
    setError("");
    setLoading(true);
    try {
      const body = { expiresInDays: inviteDays };
      const em = String(inviteEmail || "").trim().toLowerCase();
      if (em) body.email = em;
      const res = await apiPost("/api/hospital/patient-invites", body);
      setInviteResult(res.data);
    } catch (err) {
      const d = err?.response?.data;
      const msg = typeof d === "string" ? d : d?.message;
      const detail = d?.path ? ` (${d.method || "?"} ${d.path})` : "";
      setError(msg ? `${msg}${detail}` : "Failed to create patient invite");
    } finally {
      setLoading(false);
    }
  }

  async function createDoctor(e) {
    e.preventDefault();
    setCreated(null);
    setError("");

    if (!canCreate) {
      setError("Please enter first name, last name and a valid email.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost('/api/hospital/doctors', { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase() });
      setCreated(res.data);
      setFirstName("");
      setLastName("");
      setEmail("");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create doctor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Clinical Staff Accounts</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create doctor accounts with a temporary password. The doctor must change it on first login.
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          type="button"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">{error}</div>
      ) : null}

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Patient registration invite</h2>
        <p className="mt-1 text-sm text-slate-600">
          Generate a one time link for a patient to register without sharing the shared hospital code. Optionally lock the invite to one email.
        </p>
        <form onSubmit={createPatientInvite} className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-slate-500">Patient email (optional)</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="patient@example.com"
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div className="w-28">
            <label className="text-xs text-slate-500">Valid (days)</label>
            <input
              type="number"
              min={1}
              max={90}
              value={inviteDays}
              onChange={(e) => setInviteDays(Number(e.target.value) || 14)}
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Create invite link"}
          </button>
        </form>
        {inviteResult?.registerUrl ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <div className="font-semibold text-emerald-900">Share this link once</div>
            <div className="mt-2 break-all font-mono text-xs text-emerald-800">{inviteResult.registerUrl}</div>
            <div className="mt-1 text-xs text-emerald-700">
              Expires: {inviteResult.expiresAt ? new Date(inviteResult.expiresAt).toLocaleString() : "—"}
              {inviteResult.emailLocked ? " · Locked to email" : ""}
            </div>
          </div>
        ) : null}
      </div>

      {created?.tempPassword ? (
        <div className="rounded-2xl border bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Doctor account created</p>
          <p className="mt-1 text-sm text-emerald-800">
            Share this temporary password securely with the doctor. It is shown only once.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-white border p-3">
              <div className="text-xs text-slate-500">Email</div>
              <div className="font-semibold text-slate-900">{created.doctor?.email}</div>
            </div>
            <div className="rounded-xl bg-white border p-3">
              <div className="text-xs text-slate-500">Temporary password</div>
              <div className="font-semibold text-slate-900">{created.tempPassword}</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Create doctor account</h2>

        <form onSubmit={createDoctor} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 sm:col-span-2"
          />

          <div className="sm:col-span-4">
            <button
              disabled={loading || !canCreate}
              className="rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              type="submit"
            >
              {loading ? "Please wait..." : "Create doctor + temporary password"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border bg-white">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold text-slate-900">Existing doctors</h2>
        </div>

        <div className="divide-y">
          {list.length === 0 ? (
            <div className="p-5 text-sm text-slate-600">No doctors found.</div>
          ) : (
            list.map((d) => (
              <div key={d._id} className="p-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-slate-900">
                    {d.firstName} {d.lastName}
                  </div>
                  <div className="text-sm text-slate-600">{d.email}</div>
                </div>
                <div className="text-xs text-slate-500">
                  {d.mustChangePassword ? "Password change required" : "Active"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
