import React, { useEffect, useState } from "react";
import axios from "axios";
import { Store } from "react-notifications-component";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

/** Invite tokens are long hex strings from hospital admin links. */
function looksLikeInviteToken(value) {
  const v = String(value || "").trim();
  return /^[a-f0-9]{40,64}$/i.test(v);
}

const emptyErrors = {
  hospitalCode: "",
  inviteToken: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  terms: "",
};

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hospitalCode, setHospitalCode] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState(emptyErrors);
  const navigate = useNavigate();

  useEffect(() => {
    const inv = searchParams.get("invite");
    if (inv) setInviteToken(inv.trim());
  }, [searchParams]);

  const clearError = (field) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  };

  const validate = () => {
    const next = { ...emptyErrors };
    const trimmedCode = hospitalCode.trim();
    const trimmedInvite = inviteToken.trim();
    const resolvedInvite =
      trimmedInvite || (looksLikeInviteToken(trimmedCode) ? trimmedCode : "");

    if (!resolvedInvite && !trimmedCode) {
      if (inviteToken || searchParams.get("invite")) {
        next.inviteToken = "Invite token is required";
      } else {
        next.hospitalCode = "Enter a hospital registration code or invite token";
      }
    } else if (trimmedInvite && !looksLikeInviteToken(trimmedInvite) && !trimmedCode) {
      next.inviteToken = "Invite token looks invalid (expect a long hex code from your care team)";
    }

    if (!firstName.trim()) next.firstName = "First name is required";
    else if (firstName.trim().length < 2) next.firstName = "Enter at least 2 characters";

    if (!lastName.trim()) next.lastName = "Last name is required";
    else if (lastName.trim().length < 2) next.lastName = "Enter at least 2 characters";

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!email.trim()) next.email = "Email is required";
    else if (!emailOk) next.email = "Enter a valid email address";

    if (!password) next.password = "Password is required";
    else if (password.length < 6) next.password = "Password must be at least 6 characters";

    if (!termsAccepted) next.terms = "You must agree to the terms of use";

    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const trimmedCode = hospitalCode.trim();
    const trimmedInvite = inviteToken.trim();
    const resolvedInvite =
      trimmedInvite || (looksLikeInviteToken(trimmedCode) ? trimmedCode : "");

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      hospitalCode: resolvedInvite ? undefined : trimmedCode,
      inviteToken: resolvedInvite || undefined,
    };

    axios
      .post(`${API}/signup`, payload, {
        headers: { "Content-Type": "application/json" },
      })
      .then(() => {
        Store.addNotification({
          title: "Success!",
          message: "Registration successful. Please sign in.",
          type: "success",
          insert: "top",
          container: "top-right",
          dismiss: { duration: 3000, onScreen: true },
        });
        navigate("/login");
      })
      .catch((error) => {
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Registration failed";
        Store.addNotification({
          title: "Error!",
          message: String(msg),
          type: "danger",
          insert: "top",
          container: "top-right",
          dismiss: { duration: 4000, onScreen: true },
        });
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-extrabold text-center text-gray-900">Patient registration</h2>
        <p className="text-sm text-center text-gray-600">
          For enrolled patients only. Use the <strong>hospital registration code</strong> or a{" "}
          <strong>one-time invite</strong> from your care team.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          {inviteToken ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              Invite link detected. Complete your details below{searchParams.get("invite") ? "." : ""}
            </div>
          ) : null}

          {!inviteToken ? (
            <div>
              <label htmlFor="hospital-code" className="block text-xs font-medium text-gray-700 mb-1">
                Hospital registration code
              </label>
              <input
                id="hospital-code"
                type="text"
                autoComplete="off"
                value={hospitalCode}
                onChange={(e) => {
                  setHospitalCode(e.target.value);
                  clearError("hospitalCode");
                }}
                aria-invalid={!!errors.hospitalCode}
                className={`block w-full px-3 py-2 border rounded-md text-sm ${
                  errors.hospitalCode ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="e.g. RUHUNU2026 — or paste invite link token here"
              />
              {errors.hospitalCode ? (
                <div className="text-xs text-red-600 mt-1">{errors.hospitalCode}</div>
              ) : null}
            </div>
          ) : (
            <div>
              <label htmlFor="invite-token" className="block text-xs font-medium text-gray-700 mb-1">
                Invite token
              </label>
              <input
                id="invite-token"
                type="text"
                value={inviteToken}
                onChange={(e) => {
                  setInviteToken(e.target.value);
                  clearError("inviteToken");
                }}
                aria-invalid={!!errors.inviteToken}
                className={`block w-full px-3 py-2 border rounded-md text-sm font-mono text-xs ${
                  errors.inviteToken ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="Paste token if not using link"
              />
              {errors.inviteToken ? (
                <div className="text-xs text-red-600 mt-1">{errors.inviteToken}</div>
              ) : null}
            </div>
          )}

          <div className="space-y-2">
            <div>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  clearError("firstName");
                }}
                aria-invalid={!!errors.firstName}
                className={`block w-full px-3 py-2 border rounded-md text-sm ${
                  errors.firstName ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="First name"
              />
              {errors.firstName ? (
                <div className="text-xs text-red-600 mt-1">{errors.firstName}</div>
              ) : null}
            </div>
            <div>
              <input
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  clearError("lastName");
                }}
                type="text"
                autoComplete="family-name"
                aria-invalid={!!errors.lastName}
                className={`block w-full px-3 py-2 border rounded-md text-sm ${
                  errors.lastName ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="Last name"
              />
              {errors.lastName ? (
                <div className="text-xs text-red-600 mt-1">{errors.lastName}</div>
              ) : null}
            </div>
            <div>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                className={`block w-full px-3 py-2 border rounded-md text-sm ${
                  errors.email ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="Email address"
              />
              {errors.email ? <div className="text-xs text-red-600 mt-1">{errors.email}</div> : null}
            </div>
            <div>
              <input
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError("password");
                }}
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                className={`block w-full px-3 py-2 border rounded-md text-sm ${
                  errors.password ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="Password (min 6 characters)"
              />
              {errors.password ? (
                <div className="text-xs text-red-600 mt-1">{errors.password}</div>
              ) : null}
            </div>
          </div>

          <div>
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  clearError("terms");
                }}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="block ml-2 text-sm text-gray-900">
                I agree to the terms of use
              </label>
            </div>
            {errors.terms ? <div className="text-xs text-red-600 mt-1">{errors.terms}</div> : null}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Register
          </button>
        </form>
        <div className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
