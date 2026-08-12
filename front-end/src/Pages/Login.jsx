import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Store } from 'react-notifications-component';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const STRONG_PASSWORD = /^(?=.*[0-9])(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>/?`~|\\]).{8,}$/;

// Stores the FULL user object in localStorage after successful login.
// This fixes issues like CoachChat showing "Login first" even after login.

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [resetErrors, setResetErrors] = useState({
    email: '',
    resetToken: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [mode, setMode] = useState('login'); // login | reset_request | reset_confirm
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const notify = (type, title, message) => {
    Store.addNotification({
      title,
      message,
      type,
      insert: 'top',
      container: 'top-right',
      dismiss: { duration: 3000, onScreen: true }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const nextErrors = { email: '', password: '' };
    if (!emailOk) nextErrors.email = 'Enter a valid email address';
    if (!password || password.length < 4) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    try {
      const res = await axios.post(`${API}/login`, { email, password });

      // Expected from back-end/index.js:
      // { message, token, user: { _id, email, ... } }
      const user = res?.data?.user;
      const token = res?.data?.token;

      if (!user || !user._id || !token) {
        notify('danger', 'Error!', 'Login failed: missing token or user in response.');
        return;
      }

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      // Optional: keep your existing parent-state logic
      if (typeof onLogin === 'function') onLogin(user._id);

      notify('success', 'Success!', 'Login successful!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message || 'Login failed';
      notify('danger', 'Error!', `Login failed: ${msg}`);
    }
  };

  async function startReset(e) {
    e.preventDefault();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      setResetErrors((prev) => ({ ...prev, email: 'Enter a valid email address' }));
      return;
    }
    setResetErrors((prev) => ({ ...prev, email: '' }));
    try {
      const res = await axios.post(`${API}/api/auth/password/forgot`, { email: email.trim() });
      const token = res?.data?.resetToken;
      if (token) {
        setResetToken(token);
        setMode('reset_confirm');
        Store.addNotification({ title: 'Reset Email Sent', message: 'Use the token provided (mock) to set a new password.', type: 'success', insert: 'top', container: 'top-right', dismiss: { duration: 3000, onScreen: true } });
      } else {
        Store.addNotification({ title: 'Reset Email Sent', message: 'If the account exists, a reset link has been sent.', type: 'success', insert: 'top', container: 'top-right', dismiss: { duration: 3000, onScreen: true } });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to start reset';
      Store.addNotification({ title: 'Error', message: msg, type: 'danger', insert: 'top', container: 'top-right', dismiss: { duration: 3000, onScreen: true } });
    }
  }

  async function confirmReset(e) {
    e.preventDefault();
    const next = { email: '', resetToken: '', newPassword: '', confirmPassword: '' };
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) next.email = 'Enter a valid email address';
    if (!resetToken.trim()) next.resetToken = 'Reset token is required';
    if (!newPassword || newPassword.length < 8) {
      next.newPassword = 'Use at least 8 characters with a number and a special character';
    } else if (!STRONG_PASSWORD.test(newPassword)) {
      next.newPassword = 'Include at least one number and one special character';
    }
    if (!confirmPassword) next.confirmPassword = 'Confirm your new password';
    else if (newPassword !== confirmPassword) next.confirmPassword = 'Passwords do not match';

    setResetErrors(next);
    if (Object.values(next).some(Boolean)) return;

    try {
      await axios.post(`${API}/api/auth/password/reset`, { email: email.trim(), token: resetToken, newPassword });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      Store.addNotification({ title: 'Password Updated', message: 'Your password has been reset. Please sign in.', type: 'success', insert: 'top', container: 'top-right', dismiss: { duration: 3000, onScreen: true } });
      setMode('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      setResetErrors({ email: '', resetToken: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to reset password';
      Store.addNotification({ title: 'Error', message: msg, type: 'danger', insert: 'top', container: 'top-right', dismiss: { duration: 3000, onScreen: true } });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-white">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-teal-600 text-white shadow">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3v6m6-6v6M5 12h14M7 8h10M12 4v2" />
            </svg>
          </div>
          <div className="mt-3 text-xl font-semibold text-slate-900">Patient Portal</div>
          <div className="text-sm text-slate-500">Secure access to your preventive health dashboard</div>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl border shadow-md p-6">
          {mode === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" noValidate>
              <div>
                <label className="text-sm text-slate-700">Email</label>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => (prev.email ? { ...prev, email: '' } : prev));
                  }}
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="you@domain.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email ? <div className="text-xs text-red-600 mt-1">{errors.email}</div> : null}
              </div>
              <div>
                <label className="text-sm text-slate-700">Password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => (prev.password ? { ...prev, password: '' } : prev));
                  }}
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                />
                {errors.password ? <div className="text-xs text-red-600 mt-1">{errors.password}</div> : null}
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('reset_request')}
                  className="text-sm text-blue-900 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          ) : null}

          {mode === 'reset_request' ? (
            <form onSubmit={startReset} className="space-y-4" noValidate>
              <div className="text-sm text-slate-600">Enter your email to receive a reset token.</div>
              <div>
                <label className="text-sm text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setResetErrors((prev) => (prev.email ? { ...prev, email: '' } : prev));
                  }}
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="you@domain.com"
                  aria-invalid={!!resetErrors.email}
                />
                {resetErrors.email ? <div className="text-xs text-red-600 mt-1">{resetErrors.email}</div> : null}
              </div>
              <div className="flex items-center justify-between">
                <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500">
                  Send Reset Token
                </button>
                <button type="button" onClick={() => setMode('login')} className="text-sm text-blue-900 hover:underline">
                  Back to login
                </button>
              </div>
            </form>
          ) : null}

          {mode === 'reset_confirm' ? (
            <form onSubmit={confirmReset} className="space-y-4" noValidate>
              <div className="text-sm text-slate-600">Enter the reset token and your new password.</div>
              <div>
                <label className="text-sm text-slate-700">Reset Token</label>
                <input
                  value={resetToken}
                  onChange={(e) => {
                    setResetToken(e.target.value);
                    setResetErrors((prev) => (prev.resetToken ? { ...prev, resetToken: '' } : prev));
                  }}
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="Paste token here"
                  aria-invalid={!!resetErrors.resetToken}
                />
                {resetErrors.resetToken ? (
                  <div className="text-xs text-red-600 mt-1">{resetErrors.resetToken}</div>
                ) : null}
              </div>
              <div>
                <label className="text-sm text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setResetErrors((prev) => (prev.newPassword ? { ...prev, newPassword: '' } : prev));
                  }}
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="At least 8 characters"
                  aria-invalid={!!resetErrors.newPassword}
                />
                {resetErrors.newPassword ? (
                  <div className="text-xs text-red-600 mt-1">{resetErrors.newPassword}</div>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">At least 8 characters, 1 number, 1 special character.</p>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-700">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setResetErrors((prev) => (prev.confirmPassword ? { ...prev, confirmPassword: '' } : prev));
                  }}
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="Re-enter password"
                  aria-invalid={!!resetErrors.confirmPassword}
                />
                {resetErrors.confirmPassword ? (
                  <div className="text-xs text-red-600 mt-1">{resetErrors.confirmPassword}</div>
                ) : null}
              </div>
              <div className="flex items-center justify-between">
                <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500">
                  Update Password
                </button>
                <button type="button" onClick={() => setMode('login')} className="text-sm text-blue-900 hover:underline">
                  Back to login
                </button>
              </div>
            </form>
          ) : null}
        </div>

        <div className="mt-6 text-sm text-center text-slate-600">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="font-medium text-blue-900 hover:underline">Patient registration</a>
        </div>
      </div>
    </div>
  );
}
