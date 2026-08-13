import React from "react";
import { Link } from "react-router-dom";

export default function PublicFooter() {
  return (
    <footer className="w-full border-t bg-slate-50 mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div>© {new Date().getFullYear()} Preventive Health Platform. AI-Based Post-Consultation Lifestyle Optimization.</div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-slate-900">Home</Link>
            <Link to="/login" className="hover:text-slate-900">Patient Login</Link>
            <Link to="/staff" className="hover:text-slate-900">Staff Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
