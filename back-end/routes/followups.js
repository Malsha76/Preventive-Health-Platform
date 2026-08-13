const express = require('express');
const router = express.Router();

const FollowUpNote = require('../models/FollowUpNote');
const User = require('../models/User');
const Alert = require('../models/Alert');

// List follow-up notes for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const rows = await FollowUpNote.find({ patientId: req.params.patientId })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch follow-up notes', error: err.message });
  }
});

// Create a follow-up note
router.post('/', async (req, res) => {
  try {
    const { patientId, clinicianId, clinicianName, comment, nextReviewDate, tags = [] } = req.body;
    if (!patientId || !clinicianId || !comment) {
      return res.status(400).json({ message: 'patientId, clinicianId and comment are required' });
    }

    const patient = await User.findById(patientId).select('_id');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const doc = await FollowUpNote.create({
      patientId,
      clinicianId,
      clinicianName,
      comment,
      nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : undefined,
      tags: Array.isArray(tags) ? tags : [],
    });

    const io = req.app.get('io');
    if (io) {
      io.to('hospital').emit('followup:new', doc);
      io.to(`patient:${patientId}`).emit('followup:new', doc);
    }

    res.json({ message: 'Follow-up saved', followUp: doc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save follow-up', error: err.message });
  }
});


    const io = req.app.get('io');
    if (io) io.to('hospital').emit('patient:updated', { patientId, needsFollowUp: false });

    res.json({ message: 'Follow-up flag cleared', patient: u });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear flag', error: err.message });
  }
});

module.exports = router;
