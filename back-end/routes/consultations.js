const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Consultation = require('../models/Consultation');
const User = require('../models/User');

const { requireAuth, requireRole } = require('../middleware/auth');

// Create a new consultation recommendation set
router.post('/', requireAuth, requireRole('doctor', 'hospital_admin'), async (req, res) => {
  try {
    const {
      patientId,
      advisorId,
      advisorName,
      recommendations = {},
      constraints = {},
      notes = '',
    } = req.body;

    if (!patientId || !advisorId) {
      return res.status(400).json({ message: 'patientId and advisorId are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(String(patientId))) {
      return res.status(400).json({ message: 'Invalid patientId' });
    }

    const patient = await User.findById(patientId).select('_id');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const doc = await Consultation.create({
      patientId: String(patientId),
      advisorId: String(advisorId),
      advisorName,
      recommendations: {
        diet: recommendations.diet || [],
        activity: recommendations.activity || [],
        avoid: recommendations.avoid || [],
      },
      constraints,
      notes,
    });

    // Notify patient, advisor and hospital dashboards (near real-time)
    const io = req.app.get('io');
    if (io) {
      io.to(`patient:${patientId}`).emit('consultation:new', doc);
      io.to(`coach:${advisorId}`).emit('consultation:new', doc);
      io.to('hospital').emit('consultation:new', doc);
    }

    res.json({ message: 'Consultation saved', consultation: doc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save consultation', error: err.message });
  }
});

// Latest consultation for a patient
router.get('/patient/:patientId/latest', requireAuth, async (req, res) => {
  try {
    const role = String(req.auth?.role || '').toLowerCase();
    const authedUserId = String(req.auth?.userId || '');
    const patientId = String(req.params.patientId || '');

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: 'Invalid patientId' });
    }

    if ((role === 'patient' || role === 'user') && authedUserId !== patientId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!['patient', 'user', 'doctor', 'hospital_admin'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const doc = await Consultation.findOne({ patientId }).sort({ createdAt: -1 });
    if (!doc) return res.status(404).json({ message: 'No consultation found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List consultations for an advisor/doctor
router.get('/advisor/:advisorId', requireAuth, requireRole('doctor', 'hospital_admin'), async (req, res) => {
  try {
    const rows = await Consultation.find({ advisorId: req.params.advisorId }).sort({ createdAt: -1 }).limit(100);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
