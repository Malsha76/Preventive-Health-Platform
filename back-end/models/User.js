const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    role: { type: String, enum: ['patient','doctor','hospital_admin'], default: 'patient' },
    /** Institution scope (single-tenant hospital); set on patient registration and staff where applicable */
    hospitalId: { type: String, default: null, index: true },
    hospitalName: { type: String },
    password: String,
    mustChangePassword: { type: Boolean, default: false },
    tempPasswordIssuedAt: { type: Date, default: null },
    resetToken: { type: String, default: null },
    resetTokenExp: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    // Flag set by automated monitoring rules (e.g., low adherence streak)
    needsFollowUp: { type: Boolean, default: false },
    needsFollowUpAt: { type: Date },
    mealPlans: [{
        createdAt: { type: Date, default: Date.now },
        planData: Object,
        nutritionSummary: Object,
        userData: Object
    }]
});

module.exports = mongoose.model('User', userSchema);
