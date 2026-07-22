import React, { useState } from 'react';

const CoachLogin = ({ onLogin }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
        const next = { email: '', password: '' };
        if (!formData.email.trim()) next.email = 'Email is required';
        else if (!emailOk) next.email = 'Enter a valid email address';
        if (!formData.password) next.password = 'Password is required';
        setErrors(next);
        if (next.email || next.password) return;

        setLoading(true);

        // Simulate login
        setTimeout(() => {
            onLogin({
                coachId: 'coach1',
                name: 'Demo Coach',
                email: formData.email
            });
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
                <div>
                    <h2 className="text-3xl font-bold text-center">Health Advisor Login</h2>
                    <p className="mt-2 text-center text-gray-600">Access your coach dashboard</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                setErrors((prev) => (prev.email ? { ...prev, email: '' } : prev));
                            }}
                            aria-invalid={!!errors.email}
                            className={`mt-1 w-full px-3 py-2 border rounded-md ${
                                errors.email ? 'border-red-400' : ''
                            }`}
                            placeholder="coach@example.com"
                        />
                        {errors.email ? <div className="text-xs text-red-600 mt-1">{errors.email}</div> : null}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => {
                                setFormData({ ...formData, password: e.target.value });
                                setErrors((prev) => (prev.password ? { ...prev, password: '' } : prev));
                            }}
                            aria-invalid={!!errors.password}
                            className={`mt-1 w-full px-3 py-2 border rounded-md ${
                                errors.password ? 'border-red-400' : ''
                            }`}
                            placeholder="••••••••"
                        />
                        {errors.password ? (
                            <div className="text-xs text-red-600 mt-1">{errors.password}</div>
                        ) : null}
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login as Health Advisor'}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600">
                    Demo: Use any email/password
                </p>
            </div>
        </div>
    );
};

export default CoachLogin;
