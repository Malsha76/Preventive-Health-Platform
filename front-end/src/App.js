import "./App.css";
import "./theme.css";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { ReactNotifications } from "react-notifications-component";
import "react-notifications-component/dist/theme.css";
import { useEffect, useState } from "react";

import Home from "./Pages/Home";
import StaffAccess from "./Pages/StaffAccess";
import Signup from "./Pages/Signup";
import Login from "./Pages/Login";

import MealPlanner from "./Pages/MealPlan";
import SavedMealPlans from "./Pages/SavedMealPlans";
import PatientAdherence from "./Pages/PatientAdherence";
import DashboardHome from "./Pages/Dashboard";
import PatientAlerts from "./Pages/PatientAlerts";

import WorkoutGenerator from "./Components/WorkoutGenerator";
import ProgressDashboard from "./Components/ProgressDashboard";

import PublicHeader from "./Components/layout/PublicHeader";
import PublicFooter from "./Components/layout/PublicFooter";
import DashboardLayout from "./Components/layout/DashboardLayout";
import HospitalLogin from "./Pages/HospitalLogin";
import HospitalDashboard from "./Pages/HospitalDashboard";
import HospitalAlerts from "./Pages/HospitalAlerts";
import HospitalPatients from "./Pages/HospitalPatients";
import HospitalPatientProfile from "./Pages/HospitalPatientProfile";
import HospitalReports from "./Pages/HospitalReports";
import HospitalStaff from "./Pages/HospitalStaff";
import HospitalLayout from "./Components/layout/HospitalLayout";
import DoctorLogin from "./Pages/DoctorLogin";
import DoctorChangePassword from "./Pages/DoctorChangePassword";
import DoctorDashboard from "./Pages/DoctorDashboard";
import DoctorLayout from "./Components/layout/DoctorLayout";
import DoctorProtectedRoute from "./Components/DoctorProtectedRoute";
import HospitalProtectedRoute from "./Components/HospitalProtectedRoute";

import {
  isJwtValid,
  getStoredUser,
  clearDoctorSession,
  clearHospitalSession,
  clearPatientSession,
} from "./utils/auth";

function getPatientIdFromStorage() {
  const token = localStorage.getItem("token");
  const user = getStoredUser("user");
  if (!isJwtValid(token) || !user) return null;
  return user._id || user.userId || null;
}

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  // Restore patient session from localStorage so refresh keeps loggedInUser
  const [loggedInUser, setLoggedInUser] = useState(() => getPatientIdFromStorage());
    const [hospitalUser, setHospitalUser] = useState(null);
    const [doctorUser, setDoctorUser] = useState(null);

  const handleLogin = (userId) => setLoggedInUser(userId);
  const handleHospitalLogin = (data) => setHospitalUser(data);
  const handleDoctorLogin = (data) => setDoctorUser(data);

  const handleLogout = () => {
    setLoggedInUser(null);
    clearPatientSession();
  };
  const handleHospitalLogout = () => {
    setHospitalUser(null);
    clearHospitalSession();
  };
  const handleDoctorLogout = () => {
    setDoctorUser(null);
    clearDoctorSession();
  };

  // --- Secure auth checks ---
  // Only treat a session as authenticated if a VALID JWT exists.
  const patientToken = localStorage.getItem("token");
  const doctorToken = localStorage.getItem("doctorToken");
  const hospitalToken = localStorage.getItem("hospitalToken");

  const isUserAuthed = isJwtValid(patientToken) && !!getStoredUser("user");
  const isDoctorAuthed = isJwtValid(doctorToken) && !!getStoredUser("doctor");
  const doctorProfile = doctorUser || getStoredUser("doctor");
  const doctorMustChangePassword = !!doctorProfile?.mustChangePassword;
  const isHospitalAuthed = isJwtValid(hospitalToken) && !!getStoredUser("hospital");

  // Clean stale sessions (prevents "auto login" without valid token)
  if (doctorToken && !isJwtValid(doctorToken)) clearDoctorSession();
  if (hospitalToken && !isJwtValid(hospitalToken)) clearHospitalSession();
  if (patientToken && !isJwtValid(patientToken)) clearPatientSession();

  // Restore patient id after refresh (layout reads localStorage; child pages need this prop)
  useEffect(() => {
    const id = getPatientIdFromStorage();
    setLoggedInUser((prev) => (prev === id ? prev : id));
  }, [location.pathname, isUserAuthed]);
  return (
    <div className="min-h-screen flex flex-col">
      <ReactNotifications />
        {/* Public header for login/signup/staff - Home has its own navbar */}
        {!isUserAuthed && !isHospitalAuthed && !isDoctorAuthed && !isHomePage && <PublicHeader variant={location.pathname.startsWith('/doctor') ? 'doctor' : undefined} />}

        <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/staff-access" element={<StaffAccess />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />

          {/* Doctor Routes */}
          <Route
            path="/doctor/login"
            element={!isDoctorAuthed ? <DoctorLogin onLogin={handleDoctorLogin} /> : (doctorMustChangePassword ? <Navigate to="/doctor/change-password" /> : <Navigate to="/doctor/dashboard" />)}
          />
          <Route path="/doctor/change-password" element={isDoctorAuthed && doctorMustChangePassword ? <DoctorChangePassword /> : (isDoctorAuthed ? <Navigate to="/doctor/dashboard" /> : <Navigate to="/doctor/login" />)} />
          <Route element={<DoctorProtectedRoute><DoctorLayout onLogout={handleDoctorLogout} /></DoctorProtectedRoute>}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            {/* Reuse hospital pages under doctor namespace (same data, different UI + nav) */}
            <Route path="/doctor/alerts" element={<HospitalAlerts />} />
            <Route path="/doctor/patients" element={<HospitalPatients />} />
            <Route path="/doctor/patients/:patientId" element={<HospitalPatientProfile />} />
            <Route path="/doctor/reports" element={<HospitalReports />} />
          </Route>

          {/* Hospital Routes */}
          <Route
            path="/hospital/login"
            element={!isHospitalAuthed ? <HospitalLogin onLogin={handleHospitalLogin} /> : <Navigate to="/hospital/dashboard" />}
          />
          <Route element={<HospitalProtectedRoute><HospitalLayout onLogout={handleHospitalLogout} /></HospitalProtectedRoute>}>
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/hospital/alerts" element={<HospitalAlerts />} />
            <Route path="/hospital/patients" element={<HospitalPatients />} />
            <Route path="/hospital/patients/:patientId" element={<HospitalPatientProfile />} />
            <Route path="/hospital/reports" element={<HospitalReports />} />
            <Route path="/hospital/staff" element={<HospitalStaff />} />
          </Route>

          {/* User App (Dashboard Layout) */}
          <Route
            element={
              isUserAuthed ? <DashboardLayout onLogout={handleLogout} /> : <Navigate to="/login" />
            }
          >
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/alerts" element={<PatientAlerts />} />
            <Route path="/meals" element={<MealPlanner loggedInUser={loggedInUser} />} />
            <Route path="/history" element={<SavedMealPlans loggedInUser={loggedInUser} />} />
            <Route path="/workouts" element={<WorkoutGenerator loggedInUser={loggedInUser} />} />
            <Route path="/progress" element={<ProgressDashboard loggedInUser={loggedInUser} />} />
            <Route path="/adherence" element={<PatientAdherence loggedInUser={loggedInUser} />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to={isHospitalAuthed ? "/hospital/dashboard" : isDoctorAuthed ? (doctorMustChangePassword ? "/doctor/change-password" : "/doctor/dashboard") : isUserAuthed ? "/dashboard" : "/"} />} />
        </Routes>
        </main>

        {/* Public footer when not authenticated (Home has its own footer) */}
        {!isUserAuthed && !isHospitalAuthed && !isDoctorAuthed && !isHomePage && <PublicFooter />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
