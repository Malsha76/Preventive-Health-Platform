const mongoose = require('mongoose');

// Daily patient self-reported medication intake (simple demo log).
const medicationLogSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // normalized to UTC midnight
    takenMedicationIds: [{ type: String }], // subdocument _id strings from MedicationPlan.medications
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicationLog', medicationLogSchema);
