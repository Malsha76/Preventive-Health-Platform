import React from "react";
import { Link } from "react-router-dom";

export default function StaffAccess() {
  const roles = [
    {
      title: "Clinical Staff",
      subtitle: "Create recommendations and monitor assigned patients",
      cta: "Doctor Login",
      href: "/doctor/login",
      icon: (
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7a4 4 0 108 0 4 4 0 00-8 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 21v-1a6 6 0 0112 0v1" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6" />
          </svg>
        </span>
      ),
    },
    {
      title: "Hospital Console",
      subtitle: "Institutional monitoring, alerts, reports, and staff management",
      cta: "Hospital Admin Login",
      href: "/hospital/login",
      icon: (
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V9h6v12" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 13.5h3" />
          </svg>
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Staff & Admin Portal</h1>
          <p className="mt-2 text-slate-600">Secure access for clinical staff and hospital administrators</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((r) => (
            <div key={r.title} className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {r.icon}
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900">{r.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{r.subtitle}</p>
                  <Link
                    to={r.href}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    {r.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900">
            ← Back to patient portal
          </Link>
        </div>
      </div>
    </div>
  );
}
