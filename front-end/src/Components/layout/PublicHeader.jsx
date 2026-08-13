import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import BrandLogo from "../BrandLogo";

export default function PublicHeader({ variant }) {
  const location = useLocation();
  const mode = variant || (location.pathname.startsWith('/doctor') ? 'doctor' : undefined);
  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrandLogo
            to="/"
            size="sm"
            title="Preventive Health Platform"
            subtitle={mode === "doctor" ? "Doctor Portal" : ""}
          />
        </div>
        {mode === 'doctor' ? (
          <div className="text-sm text-slate-500">
            {/* Hide patient links in doctor pages */}
          </div>
        ) : (
          <nav className="flex items-center gap-4 text-sm">
            <NavLink to="/" className={({ isActive }) => (isActive ? "text-blue-900 font-semibold" : "text-slate-600 hover:text-slate-900")}>
              Home
            </NavLink>
            <NavLink to="/login" className={({ isActive }) => (isActive ? "text-blue-900 font-semibold" : "text-slate-600 hover:text-slate-900")}>
              Patient Login
            </NavLink>
            <NavLink to="/signup" className="px-3 py-1.5 rounded-lg bg-blue-900 text-white hover:bg-blue-800 font-medium">
              Patient registration
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}
