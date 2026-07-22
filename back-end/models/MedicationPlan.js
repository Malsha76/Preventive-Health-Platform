const mongoose = require('mongoose');

const medicationItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String },
    schedule: { type: String }, // e.g., "Morning & Night", "After meals", etc.
    instructions: { type: String },
  },
  { _id: true }
);

const medicationPlanSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clinicianId: { type: String, required: true },
    clinicianName: { type: String },
    active: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    medications: [medicationItemSchema],
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicationPlan', medicationPlanSchema);
