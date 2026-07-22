#!/usr/bin/env node
/**
 * Add or refresh a patient registration invite token in MongoDB.
 * Run: node seed/addPatientInvite.js
 *
 * Optional env:
 *   INVITE_TOKEN=your-token-here
 *   INVITE_EXPIRES_DAYS=90
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/preventive_health_platform';
const RegistrationInvite = require('../models/RegistrationInvite');

const TOKEN =
  process.env.INVITE_TOKEN || '5e8efc96ae8226e05881869006a6af6a3caea090925c2a34';
const HOSPITAL_ID = process.env.HOSPITAL_ID || 'ruhunu-hospital-galle';
const HOSPITAL_NAME = process.env.HOSPITAL_DISPLAY_NAME || 'Ruhunu Hospital Galle';
const EXPIRES_DAYS = Math.min(90, Math.max(1, Number(process.env.INVITE_EXPIRES_DAYS || 90)));

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const expiresAt = new Date(Date.now() + EXPIRES_DAYS * 86400000);

    const invite = await RegistrationInvite.findOneAndUpdate(
      { token: TOKEN },
      {
        token: TOKEN,
        hospitalId: HOSPITAL_ID,
        hospitalName: HOSPITAL_NAME,
        email: null,
        expiresAt,
        usedAt: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const registerUrl = `${frontend.replace(/\/$/, '')}/signup?invite=${invite.token}`;

    console.log('\nPatient invite ready:');
    console.log('  Token:', invite.token);
    console.log('  Hospital:', invite.hospitalName);
    console.log('  Expires:', invite.expiresAt.toISOString());
    console.log('  Register URL:', registerUrl);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main();
