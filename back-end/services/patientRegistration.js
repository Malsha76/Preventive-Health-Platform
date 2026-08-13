const UserModel = require('../models/User');
const RegistrationInvite = require('../models/RegistrationInvite');
const bcrypt = require('bcryptjs');

const DEFAULT_HOSPITAL_ID = process.env.HOSPITAL_ID || 'default-hospital';
const DEFAULT_HOSPITAL_NAME = process.env.HOSPITAL_DISPLAY_NAME || 'Demo Hospital';
const SHARED_CODE = process.env.HOSPITAL_REGISTRATION_CODE || '';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Resolve hospital scope for a new patient from shared code or one-time invite token.
 * @returns {{ hospitalId: string, hospitalName: string, inviteDoc?: object }}
 */
async function resolveHospitalFromRegistration({ hospitalCode, inviteToken, email }) {
  const cleanEmail = normalizeEmail(email);
  const token = String(inviteToken || '').trim();
  const code = String(hospitalCode || '').trim();

  if (token) {
    const invite = await RegistrationInvite.findOne({ token });
    if (!invite) {
      const err = new Error('Invalid or expired invite');
      err.status = 400;
      throw err;
    }
    if (invite.usedAt) {
      const err = new Error('This invite has already been used');
      err.status = 400;
      throw err;
    }
    if (invite.expiresAt < new Date()) {
      const err = new Error('This invite has expired');
      err.status = 400;
      throw err;
    }
    if (invite.email && normalizeEmail(invite.email) !== cleanEmail) {
      const err = new Error('This invite is linked to a different email address');
      err.status = 400;
      throw err;
    }
    return {
      hospitalId: invite.hospitalId,
      hospitalName: invite.hospitalName || DEFAULT_HOSPITAL_NAME,
      inviteDoc: invite,
    };
  }

  if (!SHARED_CODE) {
    const err = new Error('Hospital registration code is not configured. Use a personal invite link from your hospital.');
    err.status = 403;
    throw err;
  }
  if (!code || code !== SHARED_CODE) {
    const err = new Error('Invalid hospital registration code');
    err.status = 400;
    throw err;
  }

  return {
    hospitalId: DEFAULT_HOSPITAL_ID,
    hospitalName: DEFAULT_HOSPITAL_NAME,
    inviteDoc: null,
  };
}

async function createPatientUser({ firstName, lastName, email, password, hospitalCode, inviteToken }) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !password) {
    const err = new Error('email and password are required');
    err.status = 400;
    throw err;
  }
  if (password.length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.status = 400;
    throw err;
  }

  const t = String(inviteToken || '').trim();
  const c = String(hospitalCode || '').trim();
  if (!t && !c) {
    const err = new Error('Hospital registration code or invite token is required');
    err.status = 400;
    throw err;
  }

  const exists = await UserModel.findOne({ email: cleanEmail });
  if (exists) {
    const err = new Error('Email already exists');
    err.status = 400;
    throw err;
  }

  const { hospitalId, hospitalName, inviteDoc } = await resolveHospitalFromRegistration({
    hospitalCode,
    inviteToken,
    email: cleanEmail,
  });

  const hashed = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    firstName,
    lastName,
    email: cleanEmail,
    password: hashed,
    role: 'patient',
    hospitalId,
    hospitalName,
  });

  if (inviteDoc) {
    inviteDoc.usedAt = new Date();
    await inviteDoc.save();
  }

  return user;
}

module.exports = {
  createPatientUser,
  resolveHospitalFromRegistration,
  DEFAULT_HOSPITAL_ID,
  DEFAULT_HOSPITAL_NAME,
};
