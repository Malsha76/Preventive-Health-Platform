// const mongoose = require('mongoose');

// const appointmentSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     coachId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Coach',
//         required: true
//     },
//     userName: String,
//     coachName: String,
//     date: {
//         type: Date,
//         required: true
//     },
//     duration: {
//         type: Number,
//         default: 60
//     },
//     type: {
//         type: String,
//         enum: ['nutrition', 'fitness', 'general'],
//         required: true
//     },
//     status: {
//         type: String,
//         enum: ['pending', 'confirmed', 'completed', 'cancelled'],
//         default: 'pending'
//     },
//     amount: Number,
//     paymentStatus: {
//         type: String,
//         enum: ['pending', 'paid', 'refunded'],
//         default: 'pending'
//     },
//     meetingLink: String,
//     notes: String,
//     userRating: Number,
//     userReview: String,
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// module.exports = mongoose.model('Appointment', appointmentSchema);



const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
    userName: String,
    userEmail: String,
    coachName: String,
    coachEmail: String,
    title: String,
    description: String,
    date: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // in minutes
        default: 60
    },
    type: {
        type: String,
        enum: ['nutrition', 'fitness', 'wellness', 'rehabilitation', 'general'],
        default: 'general'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled', 'missed'],
        default: 'pending'
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed'],
        default: 'pending'
    },
    paymentMethod: String,
    paymentId: String,
    videoCallEnabled: {
        type: Boolean,
        default: true
    },
    videoCallLink: String,
    videoCallId: String,
    videoCallPassword: String,
    meetingNotes: String,
    preparationNotes: String,
    userRating: Number,
    userReview: String,
    coachNotes: String,
    followUpRequired: {
        type: Boolean,
        default: false
    },
    nextSessionRecommended: Date,
    documents: [{
        name: String,
        url: String,
        uploadedBy: String, // 'user' or 'coach'
        uploadedAt: Date
    }],
    remindersSent: [{
        type: String, // '24h', '1h', '15min'
        sentAt: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Appointment', appointmentSchema);