import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isJwtValid, getStoredUser } from "../utils/auth";

function decodeRole(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return String(payload?.role || "").toLowerCase();
  } catch {
    return "";
  }
}

export default function DoctorProtectedRoute({ children }) {
  const token = localStorage.getItem("doctorToken") || "";
  const authed = isJwtValid(token);
  // If a hospital admin tries to access a doctor route, redirect them to hospital dashboard
  if (!authed) {
    const hToken = localStorage.getItem("hospitalToken") || "";
    if (isJwtValid(hToken) && decodeRole(hToken) === "hospital_admin") {
      return <Navigate to="/hospital/dashboard" replace />;
    }
  }
  if (!authed) {
    localStorage.removeItem("doctor");
    localStorage.removeItem("doctorToken");
    return <Navigate to="/doctor/login" replace />;
  }
  const role = decodeRole(token);
  if (role !== "doctor") {
    localStorage.removeItem("doctor");
    localStorage.removeItem("doctorToken");
    const hToken = localStorage.getItem("hospitalToken") || "";
    if (isJwtValid(hToken) && decodeRole(hToken) === "hospital_admin") {
      return <Navigate to="/hospital/dashboard" replace />;
    }
    return <Navigate to="/doctor/login" replace />;
  }
  const doctor = getStoredUser("doctor");
  if (doctor?.mustChangePassword) {
    return <Navigate to="/doctor/change-password" replace />;
  }
  if (children) return children;
  return <Outlet />;
}
