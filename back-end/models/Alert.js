const mongoose = require('mongoose');

// Alerts generated when adherence drops or risk flags appear.
const alertSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    advisorId: { type: String },
    type: { type: String, default: 'adherence' },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    message: { type: String, required: true },
    meta: { type: Object },
    status: { type: String, enum: ['Open', 'Acknowledged', 'In Progress', 'Resolved'], default: 'Open' },
    resolved: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
    statusHistory: [
      {
        from: { type: String },
        to: { type: String, required: true },
        note: { type: String },
        changedBy: { type: String },
        changedByRole: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
