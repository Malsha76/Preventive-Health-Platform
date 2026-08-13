const express = require('express');
const router = express.Router();

const MedicationPlan = require('../models/MedicationPlan');
const MedicationLog = require('../models/MedicationLog');
const User = require('../models/User');

function normalizeToUtcMidnight(d) {
  const day = d ? new Date(d) : new Date();
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
}

// Create / replace an active medication plan for a patient
router.post('/plan', async (req, res) => {
  try {
    const {
      patientId,
      clinicianId,
      clinicianName,
      medications = [],
      startDate,
      endDate,
      notes = '',
    } = req.body;

    if (!patientId || !clinicianId) {
      return res.status(400).json({ message: 'patientId and clinicianId are required' });
    }

    const patient = await User.findById(patientId).select('_id');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Deactivate previous plans
    await MedicationPlan.updateMany({ patientId, active: true }, { $set: { active: false } });

    const plan = await MedicationPlan.create({
      patientId,
      clinicianId,
      clinicianName,
      active: true,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      notes,
      medications: Array.isArray(medications)
        ? medications
            .filter((m) => m && m.name)
            .map((m) => ({
              name: String(m.name).trim(),
              dosage: m.dosage ? String(m.dosage) : '',
              schedule: m.schedule ? String(m.schedule) : '',
              instructions: m.instructions ? String(m.instructions) : '',
            }))
        : [],
    });

    const io = req.app.get('io');
    if (io) {
      io.to('hospital').emit('medication:plan:new', plan);
      io.to(`patient:${patientId}`).emit('medication:plan:new', plan);
    }

    res.json({ message: 'Medication plan saved', plan });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save medication plan', error: err.message });
  }
});

// Get active medication plan for patient + today's intake log
router.get('/patient/:patientId/active', async (req, res) => {
  try {
    const { patientId } = req.params;
    const plan = await MedicationPlan.findOne({ patientId, active: true }).sort({ createdAt: -1 });
    if (!plan) return res.json({ plan: null, today: { takenMedicationIds: [] } });

    const today = normalizeToUtcMidnight(new Date());
    const log = await MedicationLog.findOne({ patientId, date: today });

    res.json({ plan, today: log || { patientId, date: today, takenMedicationIds: [] } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch active medication plan', error: err.message });
  }
});

// Save today's intake (upsert)
router.post('/log', async (req, res) => {
  try {
    const { patientId, date, takenMedicationIds = [], notes = '' } = req.body;
    if (!patientId) return res.status(400).json({ message: 'patientId is required' });

    const patient = await User.findById(patientId).select('_id');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const normalized = normalizeToUtcMidnight(date);

    const doc = await MedicationLog.findOneAndUpdate(
      { patientId, date: normalized },
      { $set: { patientId, date: normalized, takenMedicationIds: Array.isArray(takenMedicationIds) ? takenMedicationIds : [], notes } },
      { upsert: true, new: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`patient:${patientId}`).emit('medication:log:updated', doc);
      io.to('hospital').emit('medication:log:updated', doc);
    }

    res.json({ message: 'Medication log saved', log: doc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save medication log', error: err.message });
  }
});

module.exports = router;
