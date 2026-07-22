import React, { useState, useEffect } from 'react';
import { Store } from 'react-notifications-component';
const CoachConnectivity = ({ loggedInUser }) => {
    const [coaches, setCoaches] = useState([]);
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [activeTab, setActiveTab] = useState('browse');
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingForm, setBookingForm] = useState({
        date: '',
        time: '',
        duration: 60,
        type: 'general',
        notes: ''
    });
    const [ratingForm, setRatingForm] = useState({
        rating: 5,
        comment: ''
    });
    const [showRatingModal, setShowRatingModal] = useState(false);
    // Sample coaches data
    const sampleHealthAdvisors = [
        {
            _id: 'coach1',
            name: "Dr. Sarah Johnson",
            email: "sarah@fitness.com",
            specialization: ["Weight Loss", "Nutrition", "Diabetes Management"],
            certification: ["ACE Certified", "Nutrition Specialist"],
            experience: 12,
            bio: "PhD in Nutrition with 12+ years experience helping clients achieve sustainable weight loss and better health.",
            hourlyRate: 120,
            rating: 4.9,
            totalRatings: 156,
            isOnline: true,
            languages: ["English", "Spanish"],
            education: [
                { degree: "PhD Nutrition", institution: "Stanford University", year: 2010 }
            ],
            videoCallAvailable: true,
            responseTime: 2,
            totalSessions: 245,
            profileImage: null
        },
        {
            _id: 'coach2',
            name: "Mike Rodriguez",
            email: "mike@fitness.com",
            specialization: ["Strength Training", "Bodybuilding", "Sports Conditioning"],
            certification: ["NASM Certified", "Strength Coach"],
            experience: 15,
            bio: "Former competitive bodybuilder with 15+ years experience. Specializes in strength training and muscle building programs.",
            hourlyRate: 100,
            rating: 4.8,
            totalRatings: 89,
            isOnline: false,
            languages: ["English"],
            education: [
                { degree: "Sports Science", institution: "University of Texas", year: 2008 }
            ],
            videoCallAvailable: true,
            responseTime: 4,
            totalSessions: 312,
            profileImage: null
        },
        {
            _id: 'coach3',
            name: "Emily Chen",
            email: "emily@wellness.com",
            specialization: ["Pilates", "Posture Correction", "Rehabilitation"],
            certification: ["Pilates Method Alliance", "Physical Therapy Assistant"],
            experience: 8,
            bio: "Pilates and rehabilitation specialist focusing on posture correction and injury prevention.",
            hourlyRate: 85,
            rating: 4.7,
            totalRatings: 67,
            isOnline: true,
            languages: ["English", "Mandarin"],
            education: [
                { degree: "Physical Therapy", institution: "UCLA", year: 2015 }
            ],
            videoCallAvailable: true,
            responseTime: 1,
            totalSessions: 178,
            profileImage: null
        },
        {
            _id: 'coach4',
            name: "James Wilson",
            email: "james@performance.com",
            specialization: ["Athletic Performance", "Speed Training", "Agility"],
            certification: ["CSCS Certified", "Sports Performance"],
            experience: 10,
            bio: "Sports performance coach working with athletes to improve speed, agility, and overall athletic performance.",
            hourlyRate: 110,
            rating: 4.9,
            totalRatings: 102,
            isOnline: true,
            languages: ["English", "French"],
            education: [
                { degree: "Kinesiology", institution: "University of Michigan", year: 2012 }
            ],
            videoCallAvailable: true,
            responseTime: 3,
            totalSessions: 221,
            profileImage: null
        }
    ];
    // Sample appointments data
    const sampleAppointments = [
        {
            _id: 'app1',
            coachName: "Dr. Sarah Johnson",
            coachId: 'coach1',
            date: new Date(Date.now() + 86400000),
            duration: 60,
            type: "nutrition",
            amount: 120,
            status: "confirmed",
            paymentStatus: "paid",
            videoCallEnabled: true,
            videoCallId: "session_123",
            preparationNotes: "Please have your food diary ready for review."
        },
        {
            _id: 'app2',
            coachName: "Mike Rodriguez",
            coachId: 'coach2',
            date: new Date(Date.now() + 172800000),
            duration: 90,
            type: "strength",
            amount: 150,
            status: "pending",
            paymentStatus: "pending",
            videoCallEnabled: true,
            videoCallId: "session_456"
        },
        {
            _id: 'app3',
            coachName: "Emily Chen",
            coachId: 'coach3',
            date: new Date(Date.now() - 86400000),
            duration: 60,
            type: "rehabilitation",
            amount: 85,
            status: "completed",
            paymentStatus: "paid",
            videoCallEnabled: true,
            videoCallId: "session_789",
            userRating: 5,
            userReview: "Excellent session! Emily was very knowledgeable."
        }
    ];
    useEffect(() => {
        setCoaches(sampleHealthAdvisors);
        if (loggedInUser) {
            setAppointments(sampleAppointments);
        }
    }, [loggedInUser]);
    const handleBookSession = async (coach) => {
        try {
            const amount = coach.hourlyRate * (bookingForm.duration / 60);
            
            // Simulate payment processing
            Store.addNotification({
                title: "Processing Payment",
                message: "Please wait while we process your payment...",
                type: "info",
                insert: "top",
                container: "top-right",
                dismiss: { duration: 2000 }
            });
            // Simulate API delay
            setTimeout(() => {
                const newAppointment = {
                    _id: `app_${Date.now()}`,
                    coachName: coach.name,
                    coachId: coach._id,
                    date: new Date(`${bookingForm.date}T${bookingForm.time}`),
                    duration: bookingForm.duration,
                    type: bookingForm.type,
                    amount: amount,
                    status: "confirmed",
                    paymentStatus: "paid",
                    videoCallEnabled: true,
                    videoCallId: `vid_${Date.now()}`,
                    preparationNotes: bookingForm.notes
                };
                setAppointments(prev => [newAppointment, ...prev]);
                setShowBookingModal(false);
                setBookingForm({
                    date: '',
                    time: '',
                    duration: 60,
                    type: 'general',
                    notes: ''
                });
                Store.addNotification({
                    title: "Success!",
                    message: `Session booked with ${coach.name} for $${amount}`,
                    type: "success",
                    insert: "top",
                    container: "top-right",
                    dismiss: { duration: 3000 }
                });
            }, 2000);
        } catch (error) {
            console.error('Error booking session:', error);
            Store.addNotification({
                title: "Error",
                message: "Failed to book session. Please try again.",
                type: "danger",
                insert: "top",
                container: "top-right",
                dismiss: { duration: 3000 }
            });
        }
    };
    const submitRating = async () => {
        if (!selectedCoach) return;
        try {
            // Update coach rating locally
            const updatedCoach = {
                ...selectedCoach,
                rating: ((selectedCoach.rating * selectedCoach.totalRatings) + ratingForm.rating) / (selectedCoach.totalRatings + 1),
                totalRatings: selectedCoach.totalRatings + 1,
                reviews: [
                    ...(selectedCoach.reviews || []),
                    {
                        userName: 'You',
                        rating: ratingForm.rating,
                        comment: ratingForm.comment,
                        date: new Date()
                    }
                ]
            };
            setSelectedCoach(updatedCoach);
            setCoaches(prev => 
                prev.map(c => c._id === selectedCoach._id ? updatedCoach : c)
            );
            setShowRatingModal(false);
            setRatingForm({ rating: 5, comment: '' });
            Store.addNotification({
                title: "Thank You!",
                message: "Your rating has been submitted",
                type: "success",
                insert: "top",
                container: "top-right",
                dismiss: { duration: 3000 }
            });
        } catch (error) {
            console.error('Error submitting rating:', error);
        }
    };
    const processPayment = async (appointmentId, amount) => {
        try {
            Store.addNotification({
                title: "Processing Payment",
                message: `Processing payment of $${amount}...`,
                type: "info",
                insert: "top",
                container: "top-right",
                dismiss: { duration: 2000 }
            });
            // Simulate API delay
            setTimeout(() => {
                setAppointments(prev => 
                    prev.map(apt => 
                        apt._id === appointmentId 
                            ? { ...apt, paymentStatus: 'paid', status: 'confirmed' }
                            : apt
                    )
                );
                Store.addNotification({
                    title: "Payment Successful!",
                    message: `Payment of $${amount} processed successfully`,
                    type: "success",
                    insert: "top",
                    container: "top-right",
                    dismiss: { duration: 3000 }
                });
            }, 2000);
        } catch (error) {
            console.error('Error processing payment:', error);
        }
    };
    const cancelAppointment = async (appointmentId) => {
        try {
            setAppointments(prev => 
                prev.map(apt => 
                    apt._id === appointmentId 
                        ? { ...apt, status: 'cancelled' }
                        : apt
                )
            );
            Store.addNotification({
                title: "Appointment Cancelled",
                message: "Your appointment has been cancelled.",
                type: "warning",
                insert: "top",
                container: "top-right",
                dismiss: { duration: 3000 }
            });
        } catch (error) {
            console.error('Error cancelling appointment:', error);
        }
    };
    if (!loggedInUser) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                    <h2 className="text-2xl font-bold text-yellow-800 mb-4">Authentication Required</h2>
                    <p className="text-yellow-700 mb-4">Please log in to connect with coaches.</p>
                    <a href="/login" className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700">
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Advisor Connect</h1>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Available Health Advisors</p>
                    <p className="text-2xl font-bold">{coaches.filter(c => c.isOnline).length}</p>
                    <p className="text-xs text-gray-500">Online now</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Your Sessions</p>
                    <p className="text-2xl font-bold">{appointments.length}</p>
                    <p className="text-xs text-gray-500">Total booked</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Pending Payments</p>
                    <p className="text-2xl font-bold">
                        ${appointments.filter(a => a.paymentStatus === 'pending').reduce((sum, a) => sum + a.amount, 0)}
                    </p>
                    <p className="text-xs text-gray-500">Amount due</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600">Upcoming Sessions</p>
                    <p className="text-2xl font-bold">
                        {appointments.filter(a => a.status === 'confirmed').length}
                    </p>
                    <p className="text-xs text-gray-500">Confirmed</p>
                </div>
            </div>
            {/* Tabs Navigation */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="border-b">
                    <nav className="flex overflow-x-auto">
                        {[
                            { id: 'browse', label: 'Browse Health Advisors' },
                            { id: 'appointments', label: 'My Appointments' },
                                                        { id: 'payments', label: 'Payments' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                {activeTab === 'browse' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Find Your Health Advisor</h2>
                            <div className="flex space-x-2">
                                <select className="border rounded-md px-3 py-2 text-sm">
                                    <option>All Specializations</option>
                                    <option>Weight Loss</option>
                                    <option>Strength Training</option>
                                    <option>Rehabilitation</option>
                                </select>
                                <select className="border rounded-md px-3 py-2 text-sm">
                                    <option>Sort by: Rating</option>
                                    <option>Sort by: Experience</option>
                                    <option>Sort by: Price</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {coaches.map(coach => (
                                <div key={coach._id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start space-x-4 mb-4">
                                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                            {coach.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-bold">{coach.name}</h3>
                                                    <p className="text-gray-600 text-sm">{coach.specialization.join(', ')}</p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded ${
                                                    coach.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {coach.isOnline ? 'Online' : 'Offline'}
                                                </span>
                                            </div>
                                            <div className="flex items-center mt-1">
                                                <span className="text-yellow-500">★ {coach.rating.toFixed(1)}</span>
                                                <span className="text-gray-500 text-sm ml-1">({coach.totalRatings} reviews)</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{coach.bio}</p>
                                    
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Experience:</span>
                                            <span className="font-medium">{coach.experience} years</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Rate:</span>
                                            <span className="font-medium">${coach.hourlyRate}/hour</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Response Time:</span>
                                            <span className="font-medium">{coach.responseTime}h avg</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedCoach(coach);
                                                setActiveTab('appointments');
                                            }}
                                            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm"
                                        >
                                            View Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedCoach(coach);
                                                setShowBookingModal(true);
                                            }}
                                            className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm"
                                        >
                                            Book Session
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'appointments' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">My Appointments</h2>
                            <button
                                onClick={() => setShowBookingModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                            >
                                + Book New Session
                            </button>
                        </div>
                        {appointments.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600 mb-4">No appointments scheduled yet.</p>
                                <button
                                    onClick={() => setShowBookingModal(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                >
                                    Book Your First Session
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {appointments.map(appointment => (
                                    <div key={appointment._id} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                                            <div className="mb-4 md:mb-0">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {appointment.coachName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold">{appointment.coachName}</h4>
                                                        <p className="text-gray-600 text-sm">
                                                            {new Date(appointment.date).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                        {appointment.type}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded ${
                                                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {appointment.status}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded ${
                                                        appointment.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {appointment.paymentStatus}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                <div className="text-right mb-2 md:mb-0">
                                                    <p className="font-bold text-lg">${appointment.amount}</p>
                                                    <p className="text-gray-600 text-sm">{appointment.duration} min</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {appointment.paymentStatus !== 'paid' && (
                                                        <button
                                                            onClick={() => processPayment(appointment._id, appointment.amount)}
                                                            className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                                                        >
                                                            Pay ${appointment.amount}
                                                        </button>
                                                    )}
                                                    
                                                    {appointment.status === 'completed' && !appointment.userRating && (
                                                        <button
                                                            onClick={() => {
                                                                const coach = coaches.find(c => c._id === appointment.coachId);
                                                                if (coach) {
                                                                    setSelectedCoach(coach);
                                                                    setShowRatingModal(true);
                                                                }
                                                            }}
                                                            className="bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700"
                                                        >
                                                            Rate Session
                                                        </button>
                                                    )}
                                                    
                                                    {appointment.status === 'pending' && (
                                                        <button
                                                            onClick={() => cancelAppointment(appointment._id)}
                                                            className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'payments' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment History</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health Advisor</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {appointments.map(appointment => (
                                        <tr key={appointment._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                                                        {appointment.coachName.charAt(0)}
                                                    </div>
                                                    <span>{appointment.coachName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {new Date(appointment.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                ${appointment.amount}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    appointment.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {appointment.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex space-x-2">
                                                    {appointment.paymentStatus !== 'paid' && (
                                                        <button
                                                            onClick={() => processPayment(appointment._id, appointment.amount)}
                                                            className="text-sm text-blue-600 hover:text-blue-800"
                                                        >
                                                            Pay Now
                                                        </button>
                                                    )}
                                                    <button className="text-sm text-gray-600 hover:text-gray-800">
                                                        View Invoice
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-blue-600">Total Paid</p>
                                    <p className="text-2xl font-bold">
                                        ${appointments.filter(a => a.paymentStatus === 'paid').reduce((sum, a) => sum + a.amount, 0)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-yellow-600">Pending Payment</p>
                                    <p className="text-2xl font-bold">
                                        ${appointments.filter(a => a.paymentStatus === 'pending').reduce((sum, a) => sum + a.amount, 0)}
                                    </p>
                                </div>
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                                    Download All Receipts
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Booking Modal */}
            {showBookingModal && selectedCoach && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Book Session with {selectedCoach.name}</h3>
                            <button
                                onClick={() => setShowBookingModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleBookSession(selectedCoach);
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={bookingForm.date}
                                        onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={bookingForm.time}
                                        onChange={(e) => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                    <select
                                        value={bookingForm.duration}
                                        onChange={(e) => setBookingForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={30}>30 minutes</option>
                                        <option value={60}>60 minutes</option>
                                        <option value={90}>90 minutes</option>
                                        <option value={120}>120 minutes</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                                    <select
                                        value={bookingForm.type}
                                        onChange={(e) => setBookingForm(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="general">General Consultation</option>
                                        <option value="nutrition">Nutrition Counseling</option>
                                        <option value="fitness">Fitness Training</option>
                                        <option value="wellness">Wellness Coaching</option>
                                        <option value="rehabilitation">Rehabilitation</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                    <textarea
                                        value={bookingForm.notes}
                                        onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Any specific goals or concerns you'd like to discuss..."
                                    />
                                </div>
                                
                                <div className="bg-blue-50 p-4 rounded-md">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-blue-600">Coach's Rate:</span>
                                        <span className="font-medium">${selectedCoach.hourlyRate}/hour</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-600">Total:</span>
                                        <span className="text-xl font-bold">
                                            ${selectedCoach.hourlyRate * (bookingForm.duration / 60)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowBookingModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                                >
                                    Book & Pay Now
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Rating Modal */}
            {showRatingModal && selectedCoach && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Rate {selectedCoach.name}</h3>
                            <button
                                onClick={() => setShowRatingModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            submitRating();
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                    <div className="flex space-x-2 justify-center">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRatingForm(prev => ({ ...prev, rating: star }))}
                                                className="text-3xl focus:outline-none"
                                            >
                                                {star <= ratingForm.rating ? '★' : '☆'}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-center text-sm text-gray-600 mt-2">
                                        {ratingForm.rating === 5 ? 'Excellent!' :
                                         ratingForm.rating === 4 ? 'Good' :
                                         ratingForm.rating === 3 ? 'Average' :
                                         ratingForm.rating === 2 ? 'Poor' : 'Very Poor'}
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                                    <textarea
                                        value={ratingForm.comment}
                                        onChange={(e) => setRatingForm(prev => ({ ...prev, comment: e.target.value }))}
                                        rows="4"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Share your experience with this coach..."
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="flex space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowRatingModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700"
                                >
                                    Submit Rating
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default CoachConnectivity;
