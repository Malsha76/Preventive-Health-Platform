const express = require('express');
const router = express.Router();

const AdherenceLog = require('../models/AdherenceLog');
const Consultation = require('../models/Consultation');
const Alert = require('../models/Alert');
const User = require('../models/User');

function computeAdherenceScore(activities) {
  // Very simple scoring model (0-100)
  let score = 0;
  if (activities.mealPlanFollowed) score += 35;
  if (activities.workoutCompleted) score += 25;
  score += Math.min(Number(activities.walkMinutes || 0), 30) * (20 / 30); // up to 20 points
  score += Math.min(Number(activities.sleepHours || 0), 8) * (15 / 8); // up to 15 points
  score += Math.min(Number(activities.waterLiters || 0), 2) * (5 / 2); // up to 5 points

  if (activities.sugarHigh) score -= 10;
  if (activities.stressHigh) score -= 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Rule-based triage model (production-style MVP):
 * - Converts behavior + trend signals into a weighted risk score
 * - Maps score to low/medium/high severity
 * - Returns transparent rule reasons for audit/debug purposes
 *
 * NOTE: Still requires clinician validation before true clinical deployment.
 */
function evaluateSeverityModel({ adherenceScore, activities = {}, trend = {} }) {
  const reasons = [];
  let riskPoints = 0;

  // Core adherence risk
  if (adherenceScore < 50) {
    riskPoints += 35;
    reasons.push(`Very low adherence (${adherenceScore}%)`);
  } else if (adherenceScore < 60) {
    riskPoints += 22;
    reasons.push(`Low adherence (${adherenceScore}%)`);
  } else if (adherenceScore < 70) {
    riskPoints += 10;
    reasons.push(`Borderline adherence (${adherenceScore}%)`);
  }

  // Lifestyle and symptom flags
  if (activities.sugarHigh) {
    riskPoints += 28;
    reasons.push('High sugar intake reported');
  }
  if (Number(activities.sleepHours || 0) > 0 && Number(activities.sleepHours || 0) < 6) {
    riskPoints += 14;
    reasons.push('Low sleep hours (< 6)');
  }
  if (activities.stressHigh) {
    riskPoints += 12;
    reasons.push('High stress level reported');
  }
  if (activities.mealPlanFollowed === false) {
    riskPoints += 9;
    reasons.push('Meal plan not followed');
  }
  if (activities.workoutCompleted === false && Number(activities.walkMinutes || 0) < 10) {
    riskPoints += 9;
    reasons.push('Physical activity target missed');
  }
  if (Number(activities.waterLiters || 0) > 0 && Number(activities.waterLiters || 0) < 1.2) {
    riskPoints += 5;
    reasons.push('Low hydration reported');
  }

  // Trend escalation (last logs)
  if (trend.consecutiveLow50 >= 3) {
    riskPoints += 18;
    reasons.push(`Sustained low adherence (${trend.consecutiveLow50} consecutive days < 50%)`);
  }
  if (trend.consecutiveLow60 >= 4) {
    riskPoints += 10;
    reasons.push(`Ongoing poor adherence (${trend.consecutiveLow60} consecutive days < 60%)`);
  }
  if (trend.recentDrop >= 15) {
    riskPoints += 10;
    reasons.push(`Rapid decline vs recent baseline (-${trend.recentDrop} points)`);
  }

  const severity = riskPoints >= 60 ? 'high' : riskPoints >= 25 ? 'medium' : 'low';
  return { severity, riskPoints, reasons };
}

async function getTrendSignals(patientId, currentScore) {
  const last7 = await AdherenceLog.find({ patientId })
    .sort({ date: -1 })
    .limit(7)
    .select('adherenceScore date');

  let consecutiveLow50 = 0;
  let consecutiveLow60 = 0;
  for (const row of last7) {
    const s = Number(row.adherenceScore || 0);
    if (s < 50) consecutiveLow50 += 1;
    else break;
  }
  for (const row of last7) {
    const s = Number(row.adherenceScore || 0);
    if (s < 60) consecutiveLow60 += 1;
    else break;
  }

  // Compare with previous 6 logs (excluding current day record)
  const previous = last7.slice(0, 6);
  const baseline = previous.length
    ? Math.round(previous.reduce((a, b) => a + Number(b.adherenceScore || 0), 0) / previous.length)
    : currentScore;
  const recentDrop = Math.max(0, baseline - Number(currentScore || 0));

  return { consecutiveLow50, consecutiveLow60, recentDrop, baseline };
}

async function maybeCreateAlert({ patientId, activities, adherenceScore }) {
  // Determine advisor from latest consultation (if exists)
  const latest = await Consultation.findOne({ patientId }).sort({ createdAt: -1 });
  const advisorId = latest?.advisorId || undefined;

  const trend = await getTrendSignals(patientId, adherenceScore);
  const { severity, riskPoints, reasons } = evaluateSeverityModel({ adherenceScore, activities, trend });

  if (reasons.length === 0) return null;

  // Anti-spam dedupe: avoid creating near-duplicate unresolved alerts too frequently
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const duplicate = await Alert.findOne({
    patientId,
    resolved: { $ne: true },
    createdAt: { $gte: oneDayAgo },
    severity,
    message: reasons.join(' • '),
  }).select('_id');
  if (duplicate) return null;

  return Alert.create({
    patientId,
    advisorId,
    type: 'lifestyle',
    severity,
    message: reasons.join(' • '),
    meta: {
      adherenceScore,
      activities,
      triageVersion: 'v2-weighted',
      riskPoints,
      trend,
      generatedAt: new Date().toISOString(),
    },
  });
}

async function maybeCreateFollowUpStreakAlert(patientId) {
  // If adherenceScore < 50 for 5 consecutive logged days -> high severity follow-up
  const last5 = await AdherenceLog.find({ patientId }).sort({ date: -1 }).limit(5);
  if (last5.length < 5) return null;
  const allLow = last5.every((l) => Number(l.adherenceScore || 0) < 50);
  if (!allLow) return null;

  // Avoid spamming duplicates: if a follow-up alert exists in last 3 days, skip
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const exists = await Alert.findOne({
    patientId,
    type: 'followup',
    resolved: { $ne: true },
    createdAt: { $gte: threeDaysAgo },
  }).select('_id');
  if (exists) return null;

  // Determine advisor/doctor from latest consultation
  const latest = await Consultation.findOne({ patientId }).sort({ createdAt: -1 });
  const advisorId = latest?.advisorId || undefined;

  // Mark patient for follow-up
  await User.findByIdAndUpdate(patientId, { $set: { needsFollowUp: true, needsFollowUpAt: new Date() } });

  return Alert.create({
    patientId,
    advisorId,
    type: 'followup',
    severity: 'high',
    message: 'Adherence below 50% for 5 consecutive days. Patient requires follow-up review.',
    meta: { rule: 'LOW_ADHERENCE_STREAK_5D' },
  });
}

// Submit a daily adherence log (upsert by date)
router.post('/log', async (req, res) => {
  try {
    const { patientId, date, activities = {}, notes = '' } = req.body;
    if (!patientId) return res.status(400).json({ message: 'patientId is required' });

    const patient = await User.findById(patientId).select('_id');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const day = date ? new Date(date) : new Date();
    // Normalize to date-only (UTC midnight) to avoid duplicates
    const normalized = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));

    const adherenceScore = computeAdherenceScore(activities);

    const doc = await AdherenceLog.findOneAndUpdate(
      { patientId, date: normalized },
      { $set: { activities, adherenceScore, notes, patientId, date: normalized } },
      { upsert: true, new: true }
    );

    // Create an alert if needed
    const createdAlert = await maybeCreateAlert({ patientId, activities, adherenceScore });
    const streakAlert = await maybeCreateFollowUpStreakAlert(patientId);

    // Near real-time notifications
    const io = req.app.get('io');
    if (io) {
      io.to(`patient:${patientId}`).emit('adherence:updated', doc);
      io.to('hospital').emit('adherence:updated', doc);
      if (createdAlert?.advisorId) io.to(`coach:${createdAlert.advisorId}`).emit('alert:new', createdAlert);
      if (createdAlert) {
        io.to(`patient:${patientId}`).emit('alert:new', createdAlert);
        io.to('hospital').emit('alert:new', createdAlert);
      }
      if (streakAlert) {
        io.to(`patient:${patientId}`).emit('alert:new', streakAlert);
        io.to('hospital').emit('alert:new', streakAlert);
      }
    }

    res.json({ message: 'Adherence saved', adherence: doc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save adherence', error: err.message });
  }
});

// Get recent adherence logs for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const rows = await AdherenceLog.find({ patientId: req.params.patientId })
      .sort({ date: -1 })
      .limit(30);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get adherence summary for dashboards (auto-updating, data-driven)
// Returns 7-day + 30-day averages, recent trend series, and risk counters.
router.get('/summary/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const days = Math.max(1, Math.min(90, Number(req.query.days || 30)));

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const startUTC = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));

    const logs = await AdherenceLog.find({
      patientId,
      date: { $gte: startUTC },
    }).sort({ date: 1 });

    const last7Start = new Date();
    last7Start.setDate(end.getDate() - 7);
    const last7 = logs.filter((l) => new Date(l.date) >= last7Start);

    const avg = (arr) => {
      if (!arr.length) return 0;
      const sum = arr.reduce((a, b) => a + Number(b.adherenceScore || 0), 0);
      return Math.round(sum / arr.length);
    };

    const counters = {
      sugarHighDays: logs.filter((l) => l.activities?.sugarHigh).length,
      stressHighDays: logs.filter((l) => l.activities?.stressHigh).length,
      lowSleepDays: logs.filter((l) => Number(l.activities?.sleepHours || 0) > 0 && Number(l.activities?.sleepHours || 0) < 6).length,
      missedMealPlanDays: logs.filter((l) => l.activities?.mealPlanFollowed === false).length,
      missedActivityDays: logs.filter((l) => l.activities?.workoutCompleted === false && Number(l.activities?.walkMinutes || 0) < 10).length,
    };

    // Simple trend indicator based on last 7 vs previous 7
    const prev7Start = new Date();
    prev7Start.setDate(end.getDate() - 14);
    const prev7End = new Date();
    prev7End.setDate(end.getDate() - 7);
    const prev7 = logs.filter((l) => new Date(l.date) >= prev7Start && new Date(l.date) < prev7End);
    const last7Avg = avg(last7);
    const prev7Avg = avg(prev7);
    const delta = last7Avg - prev7Avg;
    const trend = delta >= 5 ? 'improving' : delta <= -5 ? 'declining' : 'stable';

    // Simple patient risk score (demo)
    let riskScore = 0;
    if (last7Avg < 60) riskScore += 2;
    if (last7Avg < 50) riskScore += 2;
    if (counters.sugarHighDays >= 3) riskScore += 2;
    if (counters.lowSleepDays >= 3) riskScore += 1;
    if (counters.stressHighDays >= 3) riskScore += 1;
    if (counters.missedMealPlanDays >= 3) riskScore += 1;
    if (counters.missedActivityDays >= 3) riskScore += 1;
    const riskLevel = riskScore >= 6 ? 'high' : riskScore >= 3 ? 'moderate' : 'low';

    res.json({
      patientId,
      rangeDays: days,
      averages: {
        last7: last7Avg,
        last30: avg(logs),
      },
      trend: { label: trend, delta },
      counters,
      risk: { score: riskScore, level: riskLevel },
      series: logs.map((l) => ({ date: l.date, adherenceScore: l.adherenceScore })),
      lastUpdated: logs.length ? logs[logs.length - 1].date : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch adherence summary', error: err.message });
  }
});

module.exports = router;
