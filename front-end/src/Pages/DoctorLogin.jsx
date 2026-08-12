import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Store } from "react-notifications-component";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

/**
 * Doctor / Clinical staff login (Option A).
 * - Accounts are created by Hospital Admin (no public signup).
 * - If doctor is issued a temporary password, they must change it on first login.
 */
export default function DoctorLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    const nextErrors = { email: "", password: "" };
    if (!emailOk) nextErrors.email = "Enter a valid email address";
    if (!password || password.length < 4) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/doctor/login`, { email: cleanEmail, password });
      const data = res.data;

      if (!data?.token) {
        setError("Login failed: missing token in response");
        return;
      }

      localStorage.setItem("doctor", JSON.stringify(data.user));
      localStorage.setItem("doctorToken", data.token);

      onLogin?.(data.user);

      Store.addNotification({
        insert: "top",
        container: "top-right",
        dismiss: { duration: 3000 },
        content: () => (
          <ToastContent
            variant="success"
            title="Success!"
            message="Doctor login successful!"
          />
        ),
      });

      if (data.user?.mustChangePassword) {
        navigate("/doctor/change-password");
      } else {
        navigate("/doctor/dashboard");
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 401 || /incorrect|invalid/i.test(msg || "")) {
        Store.addNotification({
          insert: "top",
          container: "top-right",
          dismiss: { duration: 3000 },
          content: () => (
            <ToastContent
              variant="error"
              title="Error!"
              message="Incorrect email or password."
            />
          ),
        });
      }
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function ToastContent({ variant, title, message }) {
    const [w, setW] = useState("100%");
    useEffect(() => {
      const t1 = setTimeout(() => setW("0%"), 20);
      return () => clearTimeout(t1);
    }, []);
    const box =
      variant === "error"
        ? "bg-red-600"
        : "bg-green-600";
    const track =
      variant === "error"
        ? "bg-red-700/50"
        : "bg-green-700/50";
    return (
      <div className={`w-80 ${box} text-white rounded-lg shadow-lg overflow-hidden`}>
        <div className="p-4">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs mt-1 opacity-90">{message}</div>
        </div>
        <div className={`h-1 ${track}`}>
          <div className="h-1 bg-white/90" style={{ width: w, transition: "width 3s linear" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <div className="mb-2 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-900 text-white shadow">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7a4 4 0 108 0 4 4 0 00-8 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 21v-1a6 6 0 0112 0v1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6" />
            </svg>
          </div>
          <div className="text-xl font-semibold text-blue-900">Doctor Portal</div>
          <div className="text-sm text-slate-500">Clinical staff access</div>
        </div>

        {error ? (
          <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">{error}</div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={
                "mt-1 w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 " +
                (errors.email ? "border-red-300 focus:ring-red-200" : "border focus:ring-blue-200")
              }
              placeholder="doctor@hospital.com"
              autoComplete="email"
              required
            />
            {errors.email ? <div className="text-xs text-red-600 mt-1">{errors.email}</div> : null}
          </div>

          <div>
            <label className="text-sm text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={
                "mt-1 w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 " +
                (errors.password ? "border-red-300 focus:ring-red-200" : "border focus:ring-blue-200")
              }
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            {errors.password ? <div className="text-xs text-red-600 mt-1">{errors.password}</div> : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white rounded-lg px-3 py-2 hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Login"}
          </button>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Accounts are created by your hospital administrator. If you received a temporary password, you will be asked
              to change it after login.
            </p>
            <span className="text-xs text-blue-900">Contact hospital admin for access</span>
          </div>
        </form>
      </div>
    </div>
  );
}
