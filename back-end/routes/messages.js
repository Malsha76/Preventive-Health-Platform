const express = require('express');
const Message = require('../models/Message');

const router = express.Router();

// POST /api/coaches/messages/send
// Accepts BOTH payload styles:
// A) { senderId, receiverId, senderType, receiverType, message }
// B) { senderId, receiverId, senderRole, content }
router.post('/send', async (req, res) => {
  try {
    const body = req.body || {};

    const senderId = body.senderId;
    const receiverId = body.receiverId;

    const senderType = body.senderType || body.senderRole; // 'user' | 'coach'
    const receiverType = body.receiverType || (senderType === 'user' ? 'coach' : 'user');

    const message = body.message || body.content;

    if (!senderId || !receiverId || !senderType || !receiverType || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const doc = await Message.create({
      senderId,
      receiverId,
      senderType,
      receiverType,
      message,
      timestamp: new Date(),
    });

    // If socket.io is available, emit a lightweight event
    const io = req.app.get('io');
    if (io) {
      io.emit('coach-message:new', {
        _id: doc._id,
        senderId,
        receiverId,
        senderType,
        receiverType,
        message,
        timestamp: doc.timestamp,
      });
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/coaches/messages/conversation?userId=...&coachId=...
router.get('/conversation', async (req, res) => {
  try {
    const { userId, coachId } = req.query;
    if (!userId || !coachId) return res.status(400).json({ message: 'userId and coachId required' });

    const msgs = await Message.find({
      $or: [
        { senderId: userId, receiverId: coachId },
        { senderId: coachId, receiverId: userId },
      ],
    }).sort({ timestamp: 1 });

    // Map to a UI-friendly shape also (keeping original fields)
    const out = msgs.map((m) => ({
      ...m.toObject(),
      content: m.message,
      senderRole: m.senderType,
      receiverRole: m.receiverType,
    }));

    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/coaches/messages/inbox/:coachId
// Returns latest message per user chatting with a coach
router.get('/inbox/:coachId', async (req, res) => {
  try {
    const { coachId } = req.params;

    const all = await Message.find({
      $or: [
        { senderId: coachId, senderType: 'coach' },
        { receiverId: coachId, receiverType: 'coach' },
      ],
    }).sort({ timestamp: -1 });

    // pick latest per conversation (coach<->user)
    const seen = new Set();
    const inbox = [];

    for (const m of all) {
      const userSideId = m.senderType === 'user' ? m.senderId : m.receiverId;
      if (seen.has(userSideId)) continue;
      seen.add(userSideId);

      inbox.push({
        userId: userSideId,
        lastMessage: m.message,
        timestamp: m.timestamp,
      });
    }

    res.json(inbox);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
