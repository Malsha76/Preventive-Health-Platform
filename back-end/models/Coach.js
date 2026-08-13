// const mongoose = require('mongoose');

// const coachSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     password: {
//         type: String,
//         required: true
//     },
//     specialization: [String],
//     certification: String,
//     experience: Number,
//     bio: String,
//     hourlyRate: Number,
//     rating: {
//         type: Number,
//         default: 0
//     },
//     totalRatings: {
//         type: Number,
//         default: 0
//     },
//     reviews: [{
//         userId: mongoose.Schema.Types.ObjectId,
//         userName: String,
//         rating: Number,
//         comment: String,
//         createdAt: {
//             type: Date,
//             default: Date.now
//         }
//     }],
//     availability: [{
//         day: String,
//         slots: [String]
//     }],
//     isOnline: {
//         type: Boolean,
//         default: false
//     },
//     lastSeen: Date
// });

// module.exports = mongoose.model('Coach', coachSchema);





const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: String,
    profileImage: String,
    specialization: [String],
    certification: [String],
    experience: Number,
    bio: String,
    hourlyRate: Number,
    rating: {
        type: Number,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    reviews: [{
        userId: mongoose.Schema.Types.ObjectId,
        userName: String,
        userImage: String,
        rating: Number,
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    availability: [{
        day: String, // Monday, Tuesday, etc.
        slots: [{
            start: String, // "09:00"
            end: String,   // "10:00"
            available: Boolean
        }]
    }],
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: Date,
    videoCallAvailable: {
        type: Boolean,
        default: true
    },
    videoCallPlatform: {
        type: String,
        enum: ['zoom', 'google_meet', 'custom', 'none'],
        default: 'custom'
    },
    videoCallLink: String,
    languages: [String],
    education: [{
        degree: String,
        institution: String,
        year: Number
    }],
    achievements: [{
        title: String,
        description: String,
        year: Number
    }],
    socialLinks: {
        linkedin: String,
        instagram: String,
        youtube: String,
        twitter: String
    },
    verified: {
        type: Boolean,
        default: false
    },
    featured: {
        type: Boolean,
        default: false
    },
    responseTime: {
        type: Number, // in hours
        default: 24
    },
    totalSessions: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Coach', coachSchema);