import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isJwtValid } from "../utils/auth";

function decodeRole(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return String(payload?.role || "").toLowerCase();
  } catch {
    return "";
  }
}

export default function HospitalProtectedRoute({ children }) {
  const token = localStorage.getItem("hospitalToken") || "";
  const authed = isJwtValid(token);
  if (!authed) {
    localStorage.removeItem("hospital");
    localStorage.removeItem("hospitalToken");
    return <Navigate to="/hospital/login" replace />;
  }
  const role = decodeRole(token);
  if (role !== "hospital_admin") {
    localStorage.removeItem("hospital");
    localStorage.removeItem("hospitalToken");
    return <Navigate to="/hospital/login" replace />;
  }
  if (children) return children;
  return <Outlet />;
}
