const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, default: '' },
    role: { type: String, enum: ['user', 'coach', 'admin'], default: 'user' },
    joinTime: { type: Date, default: Date.now },
    leaveTime: { type: Date },
    duration: { type: Number } // seconds
  },
  { _id: false }
);

const VideoSessionSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true },

    sessionId: { type: String, required: true, unique: true, index: true },

    // Mock fields to support existing routes. (No external video provider integration here.)
    meetingId: { type: String },
    meetingPassword: { type: String },
    joinUrl: { type: String },
    startUrl: { type: String },

    startTime: { type: Date, required: true },
    endTime: { type: Date },

    // duration in minutes for scheduled sessions; routes may overwrite with seconds on end
    duration: { type: Number, default: 60 },

    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled'
    },

    participants: { type: [ParticipantSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('VideoSession', VideoSessionSchema);
