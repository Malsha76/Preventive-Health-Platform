import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";
const STRONG_PASSWORD = /^(?=.*[0-9])(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>/?`~|\\]).{8,}$/;

export default function DoctorChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const navigate = useNavigate();

  const clearField = (field) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  };

  async function submit(e) {
    e.preventDefault();
    setError("");
    setOk(false);

    const next = { currentPassword: "", newPassword: "", confirm: "" };
    if (!currentPassword) next.currentPassword = "Current password is required";
    if (!newPassword || newPassword.length < 8) {
      next.newPassword = "New password must be at least 8 characters";
    } else if (!STRONG_PASSWORD.test(newPassword)) {
      next.newPassword = "Include at least 1 number and 1 special character";
    }
    if (!confirm) next.confirm = "Confirm your new password";
    else if (newPassword !== confirm) next.confirm = "Passwords do not match";

    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const token = localStorage.getItem("doctorToken");
    if (!token) {
      setError("Session expired. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/api/auth/doctor/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // If backend issues a fresh token, store it.
      if (res?.data?.token) {
        localStorage.setItem('doctorToken', res.data.token);
      }

      // Update local user flag
      const raw = localStorage.getItem("doctor");
      if (raw) {
        const u = JSON.parse(raw);
        u.mustChangePassword = false;
        // If backend returned updated user, merge it.
        if (res?.data?.user) Object.assign(u, res.data.user);
        localStorage.setItem("doctor", JSON.stringify(u));
      }

      setOk(true);
      setTimeout(() => navigate("/doctor/dashboard"), 500);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <div className="text-xl font-semibold text-blue-900">First Login Setup</div>
          <div className="text-sm text-slate-500">You are using a temporary password. Please set a new password to continue.</div>
        </div>

        {error ? (
          <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">{error}</div>
        ) : null}
        {ok ? (
          <div className="mb-4 text-sm bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3">
            Password updated. Redirecting…
          </div>
        ) : null}

        <form onSubmit={submit} className="space-y-3" noValidate>
          <div>
            <label className="text-sm text-slate-600">Current (temporary) password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                clearField("currentPassword");
              }}
              className={`mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                errors.currentPassword ? "border-red-400" : ""
              }`}
              autoComplete="current-password"
              aria-invalid={!!errors.currentPassword}
            />
            {errors.currentPassword ? (
              <div className="text-xs text-red-600 mt-1">{errors.currentPassword}</div>
            ) : null}
          </div>

          <div>
            <label className="text-sm text-slate-600">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                clearField("newPassword");
              }}
              className={`mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                errors.newPassword ? "border-red-400" : ""
              }`}
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
            />
            {errors.newPassword ? (
              <div className="text-xs text-red-600 mt-1">{errors.newPassword}</div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">At least 8 characters, 1 number, 1 special character.</p>
            )}
          </div>

          <div>
            <label className="text-sm text-slate-600">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                clearField("confirm");
              }}
              className={`mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                errors.confirm ? "border-red-400" : ""
              }`}
              autoComplete="new-password"
              aria-invalid={!!errors.confirm}
            />
            {errors.confirm ? <div className="text-xs text-red-600 mt-1">{errors.confirm}</div> : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white rounded-lg px-3 py-2 hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
