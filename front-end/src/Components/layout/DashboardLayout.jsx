import React, { useMemo } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "../BrandLogo";

function getUserDisplay() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (!u) return { name: "User", sub: "" };
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.email || "User";
    return { name, sub: u.email || "" };
  } catch {
    return { name: "User", sub: "" };
  }
}

export default function DashboardLayout({ onLogout }) {
  const { name, sub } = useMemo(getUserDisplay, []);
  const location = useLocation();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = React.useState(() => {
    const v = Number(localStorage.getItem("patientAlertsCount") || "0");
    return Number.isFinite(v) ? v : 0;
  });

  React.useEffect(() => {
    const onStorage = () => {
      const v = Number(localStorage.getItem("patientAlertsCount") || "0");
      setAlertCount(Number.isFinite(v) ? v : 0);
    };
    window.addEventListener("storage", onStorage);
    // also refresh on route change
    onStorage();
    return () => window.removeEventListener("storage", onStorage);
  }, [location.pathname]);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-4">
        <BrandLogo
          to="/dashboard"
          size="md"
          title="Preventive Health Platform"
          subtitle="Post-consultation lifestyle decision support"
        />

        <div className="flex items-center gap-2">
          <div className="hidden md:flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 bg-slate-50">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600">System Online</span>
          </div>

          <button
            className="relative h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white hover:bg-slate-50 flex items-center gap-2"
            title="View your alerts"
            type="button"
            onClick={() => navigate("/alerts")}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-900">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z"/>
              </svg>
            </span>
            Alerts
            {alertCount > 0 ? (
              <span className="ml-1 inline-flex items-center justify-center text-xs rounded-full bg-red-600 text-white min-w-[22px] h-[22px] px-1.5">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            ) : null}
          </button>

          <div className="text-right ml-2 mr-1 leading-tight">
            <div className="text-sm font-semibold">{name}</div>
            <div className="text-xs text-slate-500">{sub}</div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("patientAlertsCount");
              if (typeof onLogout === "function") onLogout();
              navigate("/login");
            }}
            className="h-9 px-3 rounded-lg bg-red-600 text-white text-sm hover:bg-red-500"
            type="button"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white min-h-[calc(100vh-56px)]">
          <div className="px-4 py-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">Navigation</div>
            <nav className="space-y-1">
              <SideLink to="/dashboard" label="Dashboard" />
              <SideLink to="/meals" label="Nutrition Prescription" />
              <SideLink to="/workouts" label="Activity Prescription" />
              <SideLink to="/adherence" label="Adherence & Logs" />
              <SideLink to="/progress" label="Progress" />
              {/* Removed Exercise Library per requirements */}
<SideLink to="/history" label="History / Reports" />
            </nav>
          </div>

          <div className="px-4 py-4 border-t">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Quick Status</div>
            <div className="space-y-2 text-sm">
              <StatusRow label="Health Score" value="72 (Moderate)" />
              <StatusRow label="7d Adherence" value="65%" />
              <StatusRow label="Active Advice" value="3 rules" />
            </div>
          </div>

          <div className="px-4 py-4 border-t text-xs text-slate-500">
            <div>Current: <span className="font-medium">{location.pathname}</span></div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SideLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "block rounded-md px-3 py-2 text-sm " +
        (isActive ? "bg-blue-50 text-blue-900 font-semibold border border-blue-100" : "text-slate-700 hover:bg-slate-50")
      }
      end={to === "/dashboard"}
    >
      {label}
    </NavLink>
  );
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 border px-3 py-2">
      <div className="text-slate-600">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}
