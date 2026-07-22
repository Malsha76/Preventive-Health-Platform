import React, { useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiBarChart2, FiFileText, FiLogOut, FiUsers } from "react-icons/fi";
import BrandLogo from "../BrandLogo";

function getDoctorDisplay() {
  try {
    const u = JSON.parse(localStorage.getItem("doctor") || "null");
    if (!u) return { name: "Doctor", sub: "" };
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.email || "Doctor";
    return { name, sub: u.hospitalName || u.email || "" };
  } catch {
    return { name: "Doctor", sub: "" };
  }
}

export default function DoctorLayout({ onLogout }) {
  const { name, sub } = useMemo(getDoctorDisplay, []);
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm " +
    (isActive ? "bg-blue-900 text-white" : "text-slate-700 hover:bg-slate-100");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-4">
        <BrandLogo
          to="/doctor/dashboard"
          size="md"
          title="Doctor Portal"
          subtitle="Patient oversight & follow-ups"
        />

        <div className="flex items-center gap-4">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-slate-500">{sub}</div>
          </div>
          <button
            onClick={() => {
              try {
                if (typeof onLogout === "function") onLogout();
              } finally {
                navigate("/doctor/login");
              }
            }}
            className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-500 flex items-center gap-2"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-12 gap-5 p-5">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="bg-white border rounded-xl p-3">
            <div className="text-xs font-semibold text-slate-500 px-1 pb-2">NAVIGATION</div>
            <nav className="space-y-1">
              <NavLink to="/doctor/dashboard" className={linkClass}>
                <FiBarChart2 /> Dashboard
              </NavLink>
              <NavLink to="/doctor/alerts" className={linkClass}>
                <FiAlertTriangle /> Alerts
              </NavLink>
              <NavLink to="/doctor/patients" className={linkClass}>
                <FiUsers /> Patients
              </NavLink>
              <NavLink to="/doctor/reports" className={linkClass}>
                <FiFileText /> Reports
              </NavLink>
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
