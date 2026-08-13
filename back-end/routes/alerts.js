const express = require('express');
const router = express.Router();

const Alert = require('../models/Alert');
const { requireAuth, requireRole } = require('../middleware/auth');

const STATUS_VALUES = ['Open', 'Acknowledged', 'In Progress', 'Resolved'];
const ALLOWED_TRANSITIONS = {
  Open: ['Acknowledged', 'In Progress', 'Resolved'],
  Acknowledged: ['Open', 'In Progress', 'Resolved'],
  'In Progress': ['Acknowledged', 'Resolved'],
  Resolved: ['In Progress'],
};

function normalizeStatus(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (raw === 'open') return 'Open';
  if (raw === 'acknowledged') return 'Acknowledged';
  if (raw === 'in progress' || raw === 'in_progress' || raw === 'inprogress') return 'In Progress';
  if (raw === 'resolved') return 'Resolved';
  return null;
}

function currentStatusOf(alert) {
  if (STATUS_VALUES.includes(alert?.status)) return alert.status;
  return alert?.resolved ? 'Resolved' : 'Open';
}

function isPatientOwner(req, alert) {
  return String(req.auth?.role || '').toLowerCase() === 'patient' && String(alert?.patientId || '') === String(req.auth?.userId || '');
}

// Get alerts for an advisor/doctor
router.get('/advisor/:advisorId', requireAuth, requireRole('doctor', 'hospital_admin'), async (req, res) => {
  try {
    const rows = await Alert.find({ advisorId: req.params.advisorId, resolved: false })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get alerts for a patient
router.get('/patient/:patientId', requireAuth, async (req, res) => {
  try {
    const role = String(req.auth?.role || '').toLowerCase();
    const isStaff = role === 'doctor' || role === 'hospital_admin';
    const isSelf = role === 'patient' && String(req.auth?.userId || '') === String(req.params.patientId || '');
    if (!isStaff && !isSelf) return res.status(403).json({ message: 'Forbidden' });

    const rows = await Alert.find({ patientId: req.params.patientId, resolved: false })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark alert resolved
router.patch('/:alertId/resolve', requireAuth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.alertId);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    const role = String(req.auth?.role || '').toLowerCase();
    const isStaff = role === 'doctor' || role === 'hospital_admin';
    if (!isStaff && !isPatientOwner(req, alert)) return res.status(403).json({ message: 'Forbidden' });

    const from = currentStatusOf(alert);
    alert.status = 'Resolved';
    alert.resolved = true;
    alert.resolvedAt = new Date();
    if (!alert.statusHistory) alert.statusHistory = [];
    alert.statusHistory.push({
      from,
      to: 'Resolved',
      note: 'Resolved via quick action',
      changedBy: String(req.auth?.userId || ''),
      changedByRole: String(req.auth?.role || ''),
      changedAt: new Date(),
    });

    const updated = await alert.save();
    res.json({ message: 'Alert resolved', alert: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update alert status with transition validation and audit history
router.patch('/:id/status', requireAuth, requireRole('doctor', 'hospital_admin'), async (req, res) => {
  try {
    const next = normalizeStatus(req.body?.status);
    const note = String(req.body?.note || '').trim();
    if (!next) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    const current = currentStatusOf(alert);
    if (current === next) return res.json(alert);

    const allowedNext = ALLOWED_TRANSITIONS[current] || [];
    if (!allowedNext.includes(next)) {
      return res.status(409).json({ message: `Invalid transition: ${current} -> ${next}` });
    }

    alert.status = next;
    alert.resolved = next === 'Resolved';
    if (next === 'Resolved') {
      alert.resolvedAt = new Date();
    } else if (current === 'Resolved') {
      alert.resolvedAt = null;
    }
    if (next === 'Acknowledged' && !alert.acknowledgedAt) {
      alert.acknowledgedAt = new Date();
    }

    if (!alert.statusHistory) alert.statusHistory = [];
    alert.statusHistory.push({
      from: current,
      to: next,
      note: note || undefined,
      changedBy: String(req.auth?.userId || ''),
      changedByRole: String(req.auth?.role || ''),
      changedAt: new Date(),
    });

    await alert.save();
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update alert status' });
  }
});

module.exports = router;
