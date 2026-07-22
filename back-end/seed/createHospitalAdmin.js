#!/usr/bin/env node
/**
 * Seed script to create the first hospital_admin.
 * Run: node seed/createHospitalAdmin.js
 *
 * Set env vars or edit below:
 *   HOSPITAL_ADMIN_EMAIL  (default: admin@hospital.local)
 *   HOSPITAL_ADMIN_PASSWORD  (default: ChangeMe123!)
 *   HOSPITAL_NAME  (default: Demo Hospital)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/preventive_health_platform';
const User = require('../models/User');

const EMAIL = process.env.HOSPITAL_ADMIN_EMAIL || 'admin@hospital.local';
const PASSWORD = process.env.HOSPITAL_ADMIN_PASSWORD || 'ChangeMe123!';
const HOSPITAL_NAME = process.env.HOSPITAL_NAME || process.env.HOSPITAL_DISPLAY_NAME || 'Demo Hospital';
const HOSPITAL_ID = process.env.HOSPITAL_ID || HOSPITAL_NAME.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 48) || 'demo-hospital';

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: EMAIL });
    if (existing) {
      console.log(`User ${EMAIL} already exists. Role: ${existing.role}`);
      process.exit(0);
      return;
    }

    const hashed = await bcrypt.hash(PASSWORD, 10);
    const admin = await User.create({
      firstName: 'Hospital',
      lastName: 'Admin',
      email: EMAIL,
      password: hashed,
      role: 'hospital_admin',
      hospitalId: HOSPITAL_ID,
      hospitalName: HOSPITAL_NAME,
    });

    console.log('Hospital admin created successfully:');
    console.log('  Email:', admin.email);
    console.log('  Hospital:', admin.hospitalName);
    console.log('  Hospital ID:', admin.hospitalId);
    console.log('  ID:', admin._id);
    console.log('\nIMPORTANT: Change the password after first login!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
