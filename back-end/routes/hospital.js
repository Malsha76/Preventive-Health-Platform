const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Consultation = require('../models/Consultation');
const AdherenceLog = require('../models/AdherenceLog');
const Alert = require('../models/Alert');
const RegistrationInvite = require('../models/RegistrationInvite');

const { requireAuth, requireRole } = require('../middleware/auth');
const { resolveStaffHospitalId, buildPatientMatch, getScopedPatientObjectIds } = require('../utils/hospitalScope');


// =========================
// Staff management (Option A)
// Hospital admin creates doctors with a temporary password.
// Doctor must change password on first login.
// =========================
router.get('/doctors', requireAuth, requireRole('hospital_admin'), async (req, res) => {
  try {
    const hid = await resolveStaffHospitalId(req.auth?.userId);
    const q = hid
      ? {
          role: 'doctor',
          $or: [{ hospitalId: hid }, { hospitalId: null }, { hospitalId: '' }, { hospitalId: { $exists: false } }],
        }
      : { role: 'doctor' };
    const doctors = await User.find(q).select('-password').sort({ createdAt: -1 });
    res.json(doctors);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load doctors' });
  }
});

function generateTempPassword(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

router.post('/doctors', requireAuth, requireRole('hospital_admin'), async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!firstName || !lastName || !cleanEmail) {
      return res.status(400).json({ message: 'firstName, lastName and email are required' });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!emailOk) return res.status(400).json({ message: 'Enter a valid email address' });

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(409).json({ message: 'Email is already registered' });

    const tempPassword = generateTempPassword(10);
    const hashed = await bcrypt.hash(tempPassword, 10);

    const admin = await User.findById(req.auth.userId).select('hospitalId hospitalName');
    const hid = admin?.hospitalId || process.env.HOSPITAL_ID || null;

    const doctor = await User.create({
      firstName,
      lastName,
      email: cleanEmail,
      password: hashed,
      role: 'doctor',
      hospitalId: hid || undefined,
      hospitalName: admin?.hospitalName || undefined,
      mustChangePassword: true,
      tempPasswordIssuedAt: new Date(),
    });

    // IMPORTANT: Return temp password only once (show on UI and ask admin to share securely).
    res.status(201).json({
      doctor: { _id: doctor._id, firstName: doctor.firstName, lastName: doctor.lastName, email: doctor.email, role: doctor.role, mustChangePassword: doctor.mustChangePassword },
      tempPassword,
    });
  } catch (e) {
    console.error('Create doctor error:', e);
    res.status(500).json({ message: e?.message || 'Failed to create doctor' });
  }
});

/** One-time patient registration links (scoped to this hospital). */
router.post('/patient-invites', requireAuth, requireRole('hospital_admin'), async (req, res) => {
  try {
    const hospitalId = await resolveStaffHospitalId(req.auth.userId);
    const admin = await User.findById(req.auth.userId).select('hospitalId hospitalName');
    if (!hospitalId) {
      return res.status(400).json({
        message:
          'Hospital ID could not be determined. Set HOSPITAL_ID in back-end .env or ensure your admin account has a hospital name, then restart the server.',
      });
    }
    const emailRaw = String(req.body?.email || '').trim().toLowerCase();
    const email = emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : null;
    const days = Math.min(90, Math.max(1, Number(req.body?.expiresInDays || 14)));
    const token = crypto.randomBytes(24).toString('hex');
    const invite = await RegistrationInvite.create({
      token,
      hospitalId,
      hospitalName: admin?.hospitalName || process.env.HOSPITAL_DISPLAY_NAME || '',
      email,
      expiresAt: new Date(Date.now() + days * 86400000),
      createdBy: admin._id,
    });
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.status(201).json({
      inviteToken: invite.token,
      expiresAt: invite.expiresAt,
      emailLocked: !!email,
      registerUrl: `${frontend.replace(/\/$/, '')}/signup?invite=${invite.token}`,
    });
  } catch (e) {
    res.status(500).json({ message: e?.message || 'Failed to create invite' });
  }
});

/**
 * Hospital / institution-level metrics for demo purposes.
 * NOTE: In production you would secure this with role-based auth.
 */
router.get('/metrics', requireAuth, requireRole('hospital_admin'), async (req, res) => {
  try {
    const hid = await resolveStaffHospitalId(req.auth?.userId);
    const patientMatch = buildPatientMatch(hid);
    const patientIds = await getScopedPatientObjectIds(hid);
    const pidQ = { patientId: { $in: patientIds } };

    const [patientCount, consultationCount, logCount, openAlerts] = await Promise.all([
      User.countDocuments(patientMatch),
      Consultation.countDocuments(pidQ),
      AdherenceLog.countDocuments(pidQ),
      Alert.countDocuments({ ...pidQ, resolved: { $ne: true } }),
    ]);

    // Average adherence (last 7 days) across all patients (simple aggregation)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const adherenceAgg = patientIds.length
      ? await AdherenceLog.aggregate([
          { $match: { date: { $gte: sevenDaysAgo }, patientId: { $in: patientIds } } },
          { $group: { _id: '$patientId', avgScore: { $avg: '$adherenceScore' } } },
          { $group: { _id: null, avg: { $avg: '$avgScore' } } },
        ])
      : [];
    const avgAdherence7d = adherenceAgg?.[0]?.avg ? Math.round(adherenceAgg[0].avg) : 0;

    // Dropout risk: patients with 3+ consecutive days adherence < 50 in last 7 days (approx)
    const lowLogs = patientIds.length
      ? await AdherenceLog.aggregate([
          { $match: { date: { $gte: sevenDaysAgo }, adherenceScore: { $lt: 50 }, patientId: { $in: patientIds } } },
          { $group: { _id: '$patientId', lowCount: { $sum: 1 } } },
          { $match: { lowCount: { $gte: 3 } } },
          { $count: 'count' },
        ])
      : [{ count: 0 }];
    const dropoutRiskCount = lowLogs?.[0]?.count || 0;

    res.json({
      patientCount,
      consultationCount,
      logCount,
      openAlerts,
      avgAdherence7d,
      dropoutRiskCount,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute metrics', error: err.message });
  }
});

router.get('/alerts/recent', requireAuth, requireRole('hospital_admin', 'doctor'), async (req, res) => {
  try {
    const hid = await resolveStaffHospitalId(req.auth?.userId);
    const patientIds = await getScopedPatientObjectIds(hid);
    const alertQuery = patientIds.length ? { patientId: { $in: patientIds } } : {};
    const alerts = await Alert.find(alertQuery)
      .populate('patientId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(50);

    const formatted = alerts.map(a => ({
      _id: a._id,
      createdAt: a.createdAt,
      severity: a.severity,
      message: a.message,
      status: a.status || (a.resolved ? 'Resolved' : 'Open'),
      resolved: !!a.resolved,
      patientId: a.patientId?._id || a.patientId,
      patient: a.patientId
        ? {
            _id: a.patientId._id,
            firstName: a.patientId.firstName,
            lastName: a.patientId.lastName,
            email: a.patientId.email,
            name: `${a.patientId.firstName || ''} ${a.patientId.lastName || ''}`.trim() || a.patientId.email,
          }
        : null,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch alerts', error: err.message });
  }
});


// Data-driven patient list with quick indicators
router.get('/patients', requireAuth, requireRole('hospital_admin', 'doctor'), async (req, res) => {
  try {
    const hid = await resolveStaffHospitalId(req.auth?.userId);
    const patientMatch = buildPatientMatch(hid);
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const patients = await User.find(patientMatch)
      .select('_id firstName lastName email createdAt needsFollowUp needsFollowUpAt')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Enrich with last adherence log date + open alert count
    const patientIds = patients.map(p => p._id);
    const [lastLogs, alertCounts, latestConsults] = await Promise.all([
      AdherenceLog.aggregate([
        { $match: { patientId: { $in: patientIds } } },
        { $sort: { date: -1 } },
        { $group: { _id: '$patientId', lastLogDate: { $first: '$date' }, lastScore: { $first: '$adherenceScore' } } },
      ]),
      Alert.aggregate([
        { $match: { patientId: { $in: patientIds }, resolved: { $ne: true } } },
        { $group: { _id: '$patientId', openAlerts: { $sum: 1 } } },
      ]),
      Consultation.aggregate([
        { $match: { patientId: { $in: patientIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$patientId', lastConsultationAt: { $first: '$createdAt' } } },
      ])
    ]);

    const logMap = new Map(lastLogs.map(x => [String(x._id), x]));
    const alertMap = new Map(alertCounts.map(x => [String(x._id), x]));
    const consultMap = new Map(latestConsults.map(x => [String(x._id), x]));

    res.json(
      patients.map(p => {
        const log = logMap.get(String(p._id));
        const ac = alertMap.get(String(p._id));
        const cc = consultMap.get(String(p._id));
        return {
          _id: p._id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          createdAt: p.createdAt,
          needsFollowUp: !!p.needsFollowUp,
          needsFollowUpAt: p.needsFollowUpAt || null,
          lastLogDate: log?.lastLogDate || null,
          lastAdherenceScore: typeof log?.lastScore === 'number' ? log.lastScore : null,
          openAlerts: ac?.openAlerts || 0,
          lastConsultationAt: cc?.lastConsultationAt || null,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch patients', error: err.message });
  }
});

// Trend: adherence average per day for last N days (default 14)
router.get('/trends/adherence', requireAuth, requireRole('hospital_admin', 'doctor'), async (req, res) => {
  try {
    const hid = await resolveStaffHospitalId(req.auth?.userId);
    const patientIds = await getScopedPatientObjectIds(hid);
    const days = Math.min(Number(req.query.days || 14), 90);
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const match = patientIds.length ? { date: { $gte: start }, patientId: { $in: patientIds } } : { date: { $gte: start }, patientId: { $in: [] } };
    const trend = await AdherenceLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          avgScore: { $avg: '$adherenceScore' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(trend.map(r => ({ date: r._id, avgScore: Math.round(r.avgScore), count: r.count })));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch adherence trend', error: err.message });
  }
});

module.exports = router;
