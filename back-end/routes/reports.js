const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

const User = require('../models/User');
const Consultation = require('../models/Consultation');
const AdherenceLog = require('../models/AdherenceLog');
const Alert = require('../models/Alert');
const FollowUpNote = require('../models/FollowUpNote');

// PDF Patient Health Report
// NOTE: Demo endpoint – secure with auth/roles in real deployments.
router.get('/patient/:patientId/pdf', async (req, res) => {
  try {
    const { patientId } = req.params;

    const [patient, latestConsult, logs, alerts, followups] = await Promise.all([
      User.findById(patientId).select('firstName lastName email createdAt'),
      Consultation.findOne({ patientId }).sort({ createdAt: -1 }),
      AdherenceLog.find({ patientId }).sort({ date: -1 }).limit(30),
      Alert.find({ patientId }).sort({ createdAt: -1 }).limit(20),
      FollowUpNote.find({ patientId }).sort({ createdAt: -1 }).limit(10),
    ]);

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const doc = new PDFDocument({ margin: 48 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Patient_Health_Report_${patientId}.pdf"`);
    doc.pipe(res);

    const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.email;

    // Header
    doc.fontSize(18).text('Patient Health Report');
    doc.moveDown(0.25);
    doc.fontSize(10).fillColor('#555').text('Post-consultation lifestyle monitoring summary').fillColor('#000');
    doc.moveDown(1);

    // Patient
    doc.fontSize(12).text('Patient', { underline: true });
    doc.fontSize(10);
    doc.text(`Name: ${patientName}`);
    doc.text(`Email: ${patient.email || '-'}`);
    doc.text(`Patient ID: ${patientId}`);
    doc.text(`Report generated: ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    // Latest consultation
    doc.fontSize(12).text('Latest Treatment Plan', { underline: true });
    doc.fontSize(10);
    if (!latestConsult) {
      doc.fillColor('#555').text('No consultation recommendations found.').fillColor('#000');
    } else {
      doc.text(`Date: ${new Date(latestConsult.createdAt).toLocaleString()}`);
      doc.text(`Clinician/Advisor: ${latestConsult.advisorName || '-'}`);

      const recs = latestConsult.recommendations || {};
      const list = (arr) => (Array.isArray(arr) && arr.length ? arr : ['—']);

      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Diet:');
      doc.font('Helvetica').text(list(recs.diet).map((x) => `• ${x}`).join('\n'));

      doc.moveDown(0.25);
      doc.font('Helvetica-Bold').text('Activity:');
      doc.font('Helvetica').text(list(recs.activity).map((x) => `• ${x}`).join('\n'));

      doc.moveDown(0.25);
      doc.font('Helvetica-Bold').text('Avoid:');
      doc.font('Helvetica').text(list(recs.avoid).map((x) => `• ${x}`).join('\n'));

      if (latestConsult.notes) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Notes:');
        doc.font('Helvetica').text(String(latestConsult.notes));
      }
      doc.font('Helvetica');
    }

    doc.moveDown(1);

    // Adherence
    doc.fontSize(12).text('Adherence (Last 30 Days)', { underline: true });
    doc.fontSize(10);
    if (!logs || logs.length === 0) {
      doc.fillColor('#555').text('No adherence logs found.').fillColor('#000');
    } else {
      const avg = Math.round(logs.reduce((s, x) => s + (x.adherenceScore || 0), 0) / logs.length);
      doc.text(`Average adherence score (up to 30 logs): ${avg}%`);
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Recent entries (last 14 days):');
      doc.font('Helvetica');
      logs
        .slice()
        .reverse()
        .slice(-14)
        .forEach((l) => {
          const d = l.date ? new Date(l.date).toLocaleDateString() : '-';
          const s = typeof l.adherenceScore === 'number' ? `${l.adherenceScore}%` : '-';
          const note = l.notes ? String(l.notes).slice(0, 60) : '';
          doc.text(`• ${d}  |  ${s}  ${note ? `| ${note}` : ''}`);
        });
    }

    doc.moveDown(1);

    // Alerts
    doc.fontSize(12).text('Recent Alerts', { underline: true });
    doc.fontSize(10);
    if (!alerts || alerts.length === 0) {
      doc.fillColor('#555').text('No alerts found.').fillColor('#000');
    } else {
      alerts.slice(0, 10).forEach((a) => {
        const when = a.createdAt ? new Date(a.createdAt).toLocaleString() : '-';
        const sev = (a.severity || 'medium').toUpperCase();
        const status = a.resolved ? 'Resolved' : 'Open';
        doc.text(`• [${sev}] ${when} (${status})`);
        doc.fillColor('#333').text(`  ${a.message || '-'}`).fillColor('#000');
      });
    }

    doc.moveDown(1);

    // Follow-ups
    doc.fontSize(12).text('Clinician Follow-up Notes', { underline: true });
    doc.fontSize(10);
    if (!followups || followups.length === 0) {
      doc.fillColor('#555').text('No follow-up notes found.').fillColor('#000');
    } else {
      followups.slice(0, 10).forEach((n) => {
        const when = n.createdAt ? new Date(n.createdAt).toLocaleString() : '-';
        doc.text(`• ${n.clinicianName || 'Clinician'} — ${when}`);
        doc.fillColor('#333').text(`  ${n.comment || '-'}`).fillColor('#000');
        if (n.nextReviewDate) {
          doc.fillColor('#555').text(`  Next review: ${new Date(n.nextReviewDate).toLocaleDateString()}`).fillColor('#000');
        }
      });
    }

    doc.moveDown(1);
    doc.fontSize(9).fillColor('#666').text(
      "Disclaimer: This report supports post-consultation lifestyle management. It does not diagnose conditions and does not replace medical advice. Always follow your clinician's instructions."
    );

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate report', error: err.message });
  }
});

module.exports = router;
