const mongoose = require('mongoose');

// Daily lifestyle tracking submitted by the patient.
const adherenceLogSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    activities: {
      mealPlanFollowed: { type: Boolean, default: false },
      workoutCompleted: { type: Boolean, default: false },
      walkMinutes: { type: Number, default: 0 },
      sleepHours: { type: Number, default: 0 },
      waterLiters: { type: Number, default: 0 },
      sugarHigh: { type: Boolean, default: false },
      stressHigh: { type: Boolean, default: false },
    },
    adherenceScore: { type: Number, default: 0 }, // 0-100
    notes: { type: String },
  },
  { timestamps: true }
);

adherenceLogSchema.index({ patientId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AdherenceLog', adherenceLogSchema);
