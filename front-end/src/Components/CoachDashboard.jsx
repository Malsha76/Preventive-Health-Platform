import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getSocket, joinRoom } from '../services/socket';

const CoachDashboard = ({ coachData }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [appointments, setAppointments] = useState([]);
    const [patientEmail, setPatientEmail] = useState('');
    const [patient, setPatient] = useState(null);
    const [consultNotes, setConsultNotes] = useState('');
    const [recs, setRecs] = useState({
        diet: { lowSugar: false, lowSalt: false, balanced: true },
        activity: { walking: true, light: false, moderate: false },
        avoid: { highImpact: false, lateNight: false },
    });
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [availability, setAvailability] = useState([
        { day: 'Monday', slots: ['09:00', '14:00', '16:00'] },
        { day: 'Tuesday', slots: ['10:00', '15:00'] },
    ]);

    const apiBase = useMemo(() => 'http://localhost:3001', []);

    useEffect(() => {
        // Load sample data
        setAppointments([
            { _id: '1', userName: 'John Doe', date: new Date(), type: 'nutrition', status: 'confirmed', amount: 120 },
            { _id: '2', userName: 'Jane Smith', date: new Date(Date.now() + 86400000), type: 'fitness', status: 'pending', amount: 100 },
        ]);
    }, []);

    const fetchAlerts = async () => {
        if (!coachData?.coachId) return;
        try {
            const res = await axios.get(`${apiBase}/api/alerts/advisor/${coachData.coachId}`);
            setAlerts(Array.isArray(res.data) ? res.data : []);
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        fetchAlerts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coachData?.coachId]);

    // Near real-time updates for alerts/consultations
    useEffect(() => {
        if (!coachData?.coachId) return;
        joinRoom({ role: 'coach', id: coachData.coachId });
        const s = getSocket();

        const onAlert = (alert) => {
            setAlerts(prev => {
                const exists = prev.some(a => a._id === alert?._id);
                return exists ? prev : [alert, ...prev];
            });
        };

        s.on('alert:new', onAlert);
        return () => {
            s.off('alert:new', onAlert);
        };
    }, [coachData?.coachId]);

    const lookupPatient = async () => {
        if (!patientEmail) return;
        setLoading(true);
        try {
            const res = await axios.get(`${apiBase}/user/by-email/${encodeURIComponent(patientEmail)}`);
            setPatient(res.data);
        } catch (e) {
            setPatient(null);
            alert(e?.response?.data?.message || 'Patient not found');
        } finally {
            setLoading(false);
        }
    };

    const submitConsultation = async () => {
        if (!patient?._id) {
            alert('Please lookup a patient first.');
            return;
        }
        setLoading(true);
        try {
            const recommendations = {
                diet: [
                    recs.diet.lowSugar ? 'Reduce sugar intake' : null,
                    recs.diet.lowSalt ? 'Reduce salt intake' : null,
                    recs.diet.balanced ? 'Balanced meals with vegetables and lean protein' : null,
                ].filter(Boolean),
                activity: [
                    recs.activity.walking ? 'Daily walking' : null,
                    recs.activity.light ? 'Light-intensity activity' : null,
                    recs.activity.moderate ? 'Moderate-intensity activity' : null,
                ].filter(Boolean),
                avoid: [
                    recs.avoid.highImpact ? 'Avoid high-impact exercises' : null,
                    recs.avoid.lateNight ? 'Avoid late-night meals' : null,
                ].filter(Boolean),
            };

            await axios.post(`${apiBase}/api/consultations`, {
                patientId: patient._id,
                advisorId: coachData.coachId,
                advisorName: coachData.name,
                recommendations,
                notes: consultNotes,
            });
            alert('Consultation recommendations saved.');
            setConsultNotes('');
        } catch (e) {
            alert(e?.response?.data?.message || 'Failed to save consultation');
        } finally {
            setLoading(false);
        }
    };

    const resolveAlert = async (id) => {
        try {
            await axios.patch(`${apiBase}/api/alerts/${id}/resolve`);
            await fetchAlerts();
        } catch {
            // ignore
        }
    };

    if (!coachData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Please log in as a coach</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Health Advisor Dashboard - Welcome, {coachData.name}!
            </h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {['overview', 'consultations', 'alerts', 'appointments', 'availability', 'earnings'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-md ${
                            activeTab === tab 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-md p-6">
                {activeTab === 'overview' && (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Overview</h2>
                        <p className="text-gray-700">
                            This dashboard supports the post-consultation workflow:
                            <span className="font-medium"> recommendations → adherence tracking → alerts</span>.
                        </p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="border rounded p-4">
                                <div className="text-sm text-gray-600">Open alerts</div>
                                <div className="text-2xl font-bold">{alerts.length}</div>
                            </div>
                            <div className="border rounded p-4">
                                <div className="text-sm text-gray-600">Patients (demo)</div>
                                <div className="text-2xl font-bold">—</div>
                            </div>
                            <div className="border rounded p-4">
                                <div className="text-sm text-gray-600">Today</div>
                                <div className="text-2xl font-bold">{new Date().toDateString()}</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'consultations' && (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Create Consultation Recommendations</h2>
                        <p className="text-gray-600 mb-4">
                            Enter the patient email to attach recommendations to their profile.
                        </p>

                        <div className="flex gap-2 mb-4">
                            <input
                                className="border rounded px-3 py-2 w-full"
                                placeholder="Patient email (e.g., patient@gmail.com)"
                                value={patientEmail}
                                onChange={(e) => setPatientEmail(e.target.value)}
                            />
                            <button
                                onClick={lookupPatient}
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
                            >
                                {loading ? '...' : 'Find'}
                            </button>
                        </div>

                        {patient ? (
                            <div className="border rounded p-4 mb-4">
                                <div className="font-medium">Patient:</div>
                                <div className="text-sm text-gray-700">
                                    {patient.firstName} {patient.lastName} · {patient.email}
                                </div>
                            </div>
                        ) : null}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="border rounded p-4">
                                <div className="font-semibold mb-2">Diet</div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={recs.diet.lowSugar} onChange={(e) => setRecs({ ...recs, diet: { ...recs.diet, lowSugar: e.target.checked } })} />
                                    Low sugar
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={recs.diet.lowSalt} onChange={(e) => setRecs({ ...recs, diet: { ...recs.diet, lowSalt: e.target.checked } })} />
                                    Low salt
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={recs.diet.balanced} onChange={(e) => setRecs({ ...recs, diet: { ...recs.diet, balanced: e.target.checked } })} />
                                    Balanced meals
                                </label>
                            </div>
                            <div className="border rounded p-4">
                                <div className="font-semibold mb-2">Activity</div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={recs.activity.walking} onChange={(e) => setRecs({ ...recs, activity: { ...recs.activity, walking: e.target.checked } })} />
                                    Daily walking
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={recs.activity.light} onChange={(e) => setRecs({ ...recs, activity: { ...recs.activity, light: e.target.checked } })} />
                                    Light intensity
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={recs.activity.moderate} onChange={(e) => setRecs({ ...recs, activity: { ...recs.activity, moderate: e.target.checked } })} />
                                    Moderate intensity
                                </label>
                            </div>
                            <div className="border rounded p-4">
                                <div className="font-semibold mb-2">Avoid</div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={recs.avoid.highImpact} onChange={(e) => setRecs({ ...recs, avoid: { ...recs.avoid, highImpact: e.target.checked } })} />
                                    High impact exercises
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={recs.avoid.lateNight} onChange={(e) => setRecs({ ...recs, avoid: { ...recs.avoid, lateNight: e.target.checked } })} />
                                    Late-night meals
                                </label>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium">Notes (optional)</label>
                            <textarea className="mt-1 w-full border rounded px-3 py-2" rows="3" value={consultNotes} onChange={(e) => setConsultNotes(e.target.value)} />
                        </div>

                        <button
                            onClick={submitConsultation}
                            disabled={loading}
                            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {loading ? 'Saving...' : 'Save Recommendations'}
                        </button>
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Patient Alerts</h2>
                            <button onClick={fetchAlerts} className="text-sm px-3 py-1 border rounded hover:bg-gray-50">Refresh</button>
                        </div>
                        {alerts.length === 0 ? (
                            <p className="text-gray-600">No active alerts.</p>
                        ) : (
                            <div className="space-y-3">
                                {alerts.map((a) => (
                                    <div key={a._id} className="border rounded p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="font-medium">Severity: {a.severity}</div>
                                            <button onClick={() => resolveAlert(a._id)} className="text-sm bg-green-600 text-white px-3 py-1 rounded">Resolve</button>
                                        </div>
                                        <div className="mt-2 text-gray-700">{a.message}</div>
                                        <div className="mt-1 text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'appointments' && (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Appointments</h2>
                        <div className="space-y-4">
                            {appointments.map(apt => (
                                <div key={apt._id} className="border p-4 rounded">
                                    <p><strong>{apt.userName}</strong> - {apt.type}</p>
                                    <p>Status: {apt.status}</p>
                                    <p>Amount: ${apt.amount}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {activeTab === 'availability' && (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Availability</h2>
                        <p>Manage your available time slots here...</p>
                    </div>
                )}
                
                {activeTab === 'earnings' && (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Earnings</h2>
                        <p>View your earnings and payments here...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoachDashboard;