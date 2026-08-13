const mongoose = require('mongoose');

const registrationInviteSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true },
    hospitalName: { type: String, default: '' },
    email: { type: String, default: null, lowercase: true, trim: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RegistrationInvite', registrationInviteSchema);
