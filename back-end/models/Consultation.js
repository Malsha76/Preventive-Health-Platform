const mongoose = require('mongoose');

// Represents a post-consultation set of lifestyle recommendations entered by a health advisor/doctor.
const consultationSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    advisorId: { type: String, required: true }, // coachId or doctorId (string for compatibility with demo coach login)
    advisorName: { type: String },
    recommendations: {
      diet: [{ type: String }],
      activity: [{ type: String }],
      avoid: [{ type: String }],
    },
    constraints: {
      maxCalories: { type: Number },
      maxSugar: { type: Number },
      maxSodium: { type: Number },
      activityIntensity: { type: String }, // light/moderate/vigorous
    },
   
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consultation', consultationSchema);
