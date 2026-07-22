import React from "react";
import { Link } from "react-router-dom";
import doctorImage from "../Assets/Home-Visit-Doctors-for-Elderly.jpg";
import BrandLogo from "../Components/BrandLogo";
import "./Home.css";

/**
 * Patient homepage at "/" – clean hospital-themed hero.
 * Staff entry at /staff-access.
 */
export default function Home() {
  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="home-nav">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <BrandLogo
              to="/"
              size="sm"
              title="Preventive Health"
              textClassName="home-nav__brand-text"
              className="home-nav__brand"
            />

            <div className="flex items-center gap-4">
              <Link to="/login" className="home-nav__link">
                Patient Login
              </Link>

              <Link to="/signup" className="home-nav__cta">
                Patient registration
              </Link>

              <Link to="/staff-access" className="home-nav__link home-nav__link--muted">
                Staff Access
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero__content mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20 lg:items-center">
            <div>
              <p className="home-hero__badge">
                <span className="home-hero__badge-dot" />
                Post-consultation lifestyle support
              </p>

              <h1 className="home-hero__title">
                Follow your doctor&apos;s advice,{" "}
                <span className="home-hero__title-accent">every day</span>
              </h1>

              <p className="home-hero__subtitle">
                A hospital-aligned platform that helps you stick to nutrition
                prescriptions, physical activity plans, and medication
                schedules with progress tracking and clinician oversight.
              </p>

              <p className="home-hero__hospital">
                Ruhunu Hospital, Galle
              </p>

              <div className="home-hero__actions">
                <Link to="/signup" className="home-hero__btn-primary">
                  Register with hospital code
                </Link>

                <Link to="/login" className="home-hero__btn-secondary">
                  Sign in
                </Link>
              </div>
            </div>

            <div className="home-hero__image-wrap">
              <img
                src={doctorImage}
                alt="Doctor visiting elderly patient"
                className="home-hero__image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="home-features">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="home-features__title">How it works</h2>
            <p className="home-features__subtitle">
              Your care plan, simplified and tracked in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Doctor guidance</h3>
              <p className="mt-2 text-slate-600">
                Nutrition, activity, and medication recommendations saved per
                patient and visible on your dashboard.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">AI planning</h3>
              <p className="mt-2 text-slate-600">
                Meal and activity plans optimized to your constraints, goals,
                and doctor recommendations.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Adherence tracking</h3>
              <p className="mt-2 text-slate-600">
                Log daily progress. Your care team sees trends and can reach out
                when you need support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <BrandLogo
                to="/"
                size="sm"
                title="Preventive Health Platform"
                subtitle="Ruhunu Hospital, Galle · Student Final Year Project"
              />
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-700 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-700 transition-colors">Terms</a>
              <a href="#" className="hover:text-slate-700 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
