const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createPatientUser } = require('../services/patientRegistration');
const router = express.Router();

const upload = multer();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const crypto = require('crypto');

function issueToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role || 'patient', email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function verifyPassword(user, password) {
  if (!user?.password) return false;

  // If password looks hashed ($2a/$2b/$2y), compare with bcrypt
  const looksHashed = typeof user.password === 'string' && user.password.startsWith('$2');
  if (looksHashed) {
    return bcrypt.compare(password, user.password);
  }

  // Legacy plaintext support (upgrade to hash on next login)
  if (user.password === password) {
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    await user.save();
    return true;
  }
  return false;
}

// ---------- PATIENT ----------
router.post('/signup', upload.none(), async (req, res) => {
  try {
    const { firstName, lastName, email, password, hospitalCode, inviteToken } = req.body || {};
    const user = await createPatientUser({
      firstName,
      lastName,
      email,
      password,
      hospitalCode,
      inviteToken,
    });
    res.json({
      message: 'Signup successful',
      user: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        hospitalId: user.hospitalId,
      },
      token: issueToken(user),
    });
  } catch (err) {
    const status = err.status || 400;
    res.status(status).json({ message: err.message || 'Signup failed' });
  }
});

// ---------- PATIENT PASSWORD RESET ----------
router.post('/password/forgot', upload.none(), async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'email is required' });
    const user = await UserModel.findOne({ email, role: { $in: ['patient', undefined, null] } });
    if (!user) {
      return res.json({ message: 'If that account exists, a reset link has been sent' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    const exp = new Date(Date.now() + 15 * 60 * 1000);
    user.resetToken = token;
    user.resetTokenExp = exp;
    await user.save();
    // Student project: return token directly instead of sending email
    return res.json({ message: 'Reset token generated', resetToken: token, expiresAt: exp.toISOString() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start reset', error: err.message });
  }
});

router.post('/password/reset', upload.none(), async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const token = String(req.body?.token || '').trim();
    const newPassword = String(req.body?.newPassword || '');
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'email, token and newPassword are required' });
    }
    if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });
    const strong = /^(?=.*[0-9])(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>/?`~|\\]).{8,}$/.test(newPassword);
    if (!strong) return res.status(400).json({ message: 'New password must include at least 1 number and 1 special character' });

    const user = await UserModel.findOne({ email, role: { $in: ['patient', undefined, null] } });
    if (!user || !user.resetToken || !user.resetTokenExp) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    if (user.resetToken !== token || user.resetTokenExp < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExp = null;
    user.passwordChangedAt = new Date();
    await user.save();
    return res.json({ message: 'Password has been reset. Please login with your new password.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
});

router.post('/login', upload.none(), async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    const ok = await verifyPassword(user, password);
    if (!ok) return res.status(400).json({ message: 'Invalid email or password' });

    res.json({
      message: 'Login successful',
      user: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || 'patient',
      },
      token: issueToken(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});

// ---------- DOCTOR / ADVISOR (stored as User with role=doctor) ----------
router.post('/doctor/signup', (req, res) => res.status(403).json({ message: 'Doctor accounts are created by Hospital Admin.' }));


router.post('/doctor/login', upload.none(), async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return res.status(400).json({ message: 'Enter a valid email address' });
    if (!password || password.length < 4) return res.status(400).json({ message: 'Password is required' });

    const user = await UserModel.findOne({ email, role: 'doctor' });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await verifyPassword(user, password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = issueToken(user);
    res.json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        mustChangePassword: !!user.mustChangePassword,
      },
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/doctor/change-password', requireAuth, requireRole('doctor'), upload.none(), async (req, res) => {
  try {
    // NOTE: requireAuth stores JWT payload on req.auth
    const userId = req.auth?.userId;
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!currentPassword) return res.status(400).json({ message: 'Current password is required' });
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });
  const strong = /^(?=.*[0-9])(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>/?`~|\\]).{8,}$/.test(newPassword);
  if (!strong) return res.status(400).json({ message: 'New password must include at least 1 number and 1 special character' });

    const user = await UserModel.findById(userId);
    if (!user || user.role !== 'doctor') return res.status(401).json({ message: 'Unauthorized' });

    const ok = await verifyPassword(user, currentPassword);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    user.tempPasswordIssuedAt = null;
    await user.save();

    // Issue a fresh token so the UI can continue without getting blocked.
    const token = issueToken(user);
    res.json({ message: 'Password updated', token, user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      mustChangePassword: false,
    }});
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- HOSPITAL ADMIN (stored as User with role=hospital_admin) ----------
router.post('/hospital/signup', upload.none(), async (req, res) => {
  try {
    const { firstName, lastName, hospitalName } = req.body;
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password || !hospitalName) return res.status(400).json({ message: 'hospitalName, email and password are required' });
    const fName = firstName || 'Admin';
    const lName = lastName || 'User';

    const exists = await UserModel.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    const hospitalId =
      process.env.HOSPITAL_ID ||
      String(hospitalName || 'hospital')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 48) ||
      'demo-hospital';

    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      firstName: fName,
      lastName: lName,
      email,
      password: hashed,
      role: 'hospital_admin',
      hospitalId,
      hospitalName,
    });

    res.json({
      message: 'Hospital admin signup successful',
      user: { userId: user._id, email: user.email, firstName: fName, lastName: lName, role: user.role, hospitalName, hospitalId: user.hospitalId },
      token: issueToken(user),
    });
  } catch (err) {
    res.status(400).json({ message: 'Signup failed', error: err.message });
  }
});

router.post('/hospital/login', upload.none(), async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  try {
    const user = await UserModel.findOne({ email, role: 'hospital_admin' });
    const ok = await verifyPassword(user, password);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      message: 'Hospital admin login successful',
      user: { _id: user._id, userId: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, hospitalName: user.hospitalName, hospitalId: user.hospitalId },
      token: issueToken(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});

module.exports = router;
