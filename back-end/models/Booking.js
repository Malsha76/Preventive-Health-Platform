const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coachId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coach',
        required: true
    },
    sessionDate: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        default: 60
    },
    sessionType: {
        type: String,
        enum: ['nutrition', 'fitness', 'general'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'paid'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: String,
    meetingLink: String,
    userNotes: String,
    coachNotes: String,
    userRating: Number,
    userReview: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', bookingSchema);