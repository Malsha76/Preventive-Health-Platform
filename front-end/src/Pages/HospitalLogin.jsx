import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Store } from "react-notifications-component";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function HospitalLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = String(email).trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    const nextErrors = { email: "", password: "" };
    if (!cleanEmail) nextErrors.email = "Email is required";
    else if (!emailOk) nextErrors.email = "Enter a valid email address";
    if (!String(password).trim()) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API}/api/auth/hospital/login`, {
        email,
        password,
      });
      const data = res.data;
      if (!data?.token) {
        setError("Login failed: missing token in response");
        return;
      }
      localStorage.setItem("hospital", JSON.stringify(data.user));
      localStorage.setItem("hospitalToken", data.token);
      Store.addNotification({
        title: "Success",
        message: "Hospital admin login successful!",
        type: "success",
        insert: "top",
        container: "top-right",
        dismiss: { duration: 5000, onScreen: true },
      });
      onLogin?.(data.user);
      navigate("/hospital/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
      Store.addNotification({
        title: "Error",
        message: "Invalid email or password.",
        type: "danger",
        insert: "top",
        container: "top-right",
        dismiss: { duration: 5000, onScreen: true },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Hero / Illustration */}
        <div className="hidden lg:flex lg:col-span-6">
          <div className="relative w-full rounded-2xl overflow-hidden border shadow-sm bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-cyan-500/10 to-transparent" />
            <div className="absolute -top-10 -left-10 h-64 w-64 rounded-full bg-indigo-100 blur-2xl opacity-70" />
            <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-cyan-100 blur-2xl opacity-70" />
            <div className="relative h-full p-8 flex items-center">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-700 text-white flex items-center justify-center shadow-lg">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 21h18"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 10h6M9 14h6M9 18h6"
                    />
                  </svg>
                </div>
                <div className="mt-4 text-2xl font-semibold text-slate-900">
                  Hospital Administration
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Manage staff accounts, monitor population health alerts, and
                  export institutional reports securely.
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-left text-xs">
                  <div className="rounded-xl border bg-white p-3">
                    <div className="font-semibold text-slate-800">Staff</div>
                    <div className="text-slate-500 mt-1">
                      Create and manage clinical users
                    </div>
                  </div>
                  <div className="rounded-xl border bg-white p-3">
                    <div className="font-semibold text-slate-800">Alerts</div>
                    <div className="text-slate-500 mt-1">
                      Track adherence risk signals
                    </div>
                  </div>
                  <div className="rounded-xl border bg-white p-3">
                    <div className="font-semibold text-slate-800">Reports</div>
                    <div className="text-slate-500 mt-1">
                      Export institutional metrics
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-6">
          <div className="bg-white/95 backdrop-blur rounded-2xl border shadow-md p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold text-slate-900">
                  Hospital Console
                </div>
                <div className="text-sm text-slate-500">
                  Secure institutional access
                </div>
              </div>
            </div>

            {/* Login only */}

            {error ? (
              <div className="mt-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="admin@hospital.com"
                  required
                />
                {errors.email ? (
                  <div className="text-xs text-red-600 mt-1">
                    {errors.email}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="••••••••"
                  required
                />
                {errors.password ? (
                  <div className="text-xs text-red-600 mt-1">
                    {errors.password}
                  </div>
                ) : null}
              </div>

              <button
                disabled={loading}
                className="w-full bg-indigo-700 text-white rounded-lg px-4 py-2 hover:bg-indigo-600 disabled:opacity-60 shadow"
              >
                {loading ? "Please wait..." : "Login"}
              </button>
            </form>

            {/* <div className="mt-4 text-sm text-slate-600">
              Patient access? <Link to="/login" className="text-blue-900 underline">Go to Patient Login</Link>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
