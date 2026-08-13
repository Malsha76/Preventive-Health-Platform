const mongoose = require('mongoose');

// Clinician follow-up notes recorded after reviewing patient adherence & risks.
const followUpNoteSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clinicianId: { type: String, required: true },
    clinicianName: { type: String },
    comment: { type: String, required: true },
    nextReviewDate: { type: Date },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('FollowUpNote', followUpNoteSchema);
