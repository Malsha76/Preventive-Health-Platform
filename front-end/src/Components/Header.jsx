import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const Header = ({ loggedInUser, coachUser, onLogout, onCoachLogout }) => {
    const location = useLocation();

    // Try to show a friendly user label (name/email) even if parent state stores only userId
    let displayUserLabel = 'User';
    try {
        const stored = localStorage.getItem('user');
        const u = stored ? JSON.parse(stored) : null;
        if (u) {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
            displayUserLabel = fullName || u.email || 'User';
        } else if (typeof loggedInUser === 'string' && loggedInUser) {
            // fallback: show last 6 chars of id
            displayUserLabel = `User (${loggedInUser.slice(-6)})`;
        }
    } catch (e) {
        if (typeof loggedInUser === 'string' && loggedInUser) {
            displayUserLabel = `User (${loggedInUser.slice(-6)})`;
        }
    }

    const userNavigation = [
        { name: 'Home', href: '/', current: location.pathname === '/' },
        { name: 'Nutrition Optimization Module', href: '/meals', current: location.pathname === '/meals' },
        { name: 'Physical Activity Planner', href: '/workouts', current: location.pathname === '/workouts' },
        { name: 'Adherence Tracking', href: '/adherence', current: location.pathname === '/adherence' },
        { name: 'Exercises', href: '/exercises', current: location.pathname === '/exercises' },
        { name: 'Progress', href: '/progress', current: location.pathname === '/progress' },
        { name: 'History', href: '/history', current: location.pathname === '/history' },
    ];

    const coachNavigation = [
        { name: 'Health Advisor Dashboard', href: '/coach/dashboard', current: location.pathname === '/coach/dashboard' },
    ];

    const navigation = coachUser ? coachNavigation : (loggedInUser ? userNavigation : []);

    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <BrandLogo
                            to="/"
                            size="md"
                            title={coachUser ? 'Health Advisor Portal' : 'Preventive Health Platform'}
                        />
                    </div>

                    {/* Navigation */}
                    {(loggedInUser || coachUser) && (
                        <nav className="hidden md:flex space-x-4">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                                        item.current
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    )}

                    {/* User info and auth buttons */}
                    <div className="flex items-center space-x-4">
                        {coachUser ? (
                            <>
                                <span className="text-sm text-gray-700">
                                    Advisor: {coachUser.name}
                                </span>
                                <button
                                    onClick={onCoachLogout}
                                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
                                >
                                    Logout Advisor
                                </button>
                            </>
                        ) : loggedInUser ? (
                            <>
                                <span className="text-sm text-gray-700">
                                    Welcome, {displayUserLabel}
                                </span>
                                <button
                                    onClick={() => {
                                        // Clear stored user session as well
                                        try {
                                            localStorage.removeItem('user');
                                            localStorage.removeItem('token');
                                        } catch (e) {}
                                        onLogout();
                                    }}
                                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm"
                                >
                                    User Login
                                </Link>
                                <Link
                                    to="/coach/login"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                                >
                                    Health Advisor Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
