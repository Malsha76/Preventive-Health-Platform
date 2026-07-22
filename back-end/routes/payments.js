const express = require('express');
const stripeLib = require('stripe');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');

const router = express.Router();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_ENABLED = Boolean(STRIPE_SECRET_KEY);
const stripe = STRIPE_ENABLED ? stripeLib(STRIPE_SECRET_KEY) : null;

// Stripe Checkout (LKR). If STRIPE_SECRET_KEY is not set, uses DEMO mode.
router.post('/stripe/create-checkout-session', async (req, res) => {
  try {
    const { appointmentId, userId, coachId, amountLkr } = req.body;
    const amountMinor = Math.round(Number(amountLkr) * 100);

    const payment = await Payment.create({
      userId,
      coachId,
      appointmentId,
      amount: Number(amountLkr),
      currency: 'LKR',
      paymentMethod: 'card',
      paymentStatus: 'pending',
      paymentGateway: STRIPE_ENABLED ? 'stripe' : 'demo'
    });

    if (!STRIPE_ENABLED) {
      payment.paymentStatus = 'completed';
      payment.transactionId = `demo_${Date.now()}`;
      await payment.save();

      await Appointment.findByIdAndUpdate(appointmentId, {
        paymentStatus: 'paid',
        status: 'confirmed',
        currency: 'LKR',
        paymentId: String(payment._id)
      });

      return res.json({ mode: 'demo', paymentId: payment._id });
    }

    const baseUrl = process.env.CLIENT_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment-cancel`,
      line_items: [
        {
          price_data: {
            currency: 'lkr',
            product_data: { name: 'Coach Appointment' },
            unit_amount: amountMinor
          },
          quantity: 1
        }
      ],
      metadata: {
        paymentId: String(payment._id),
        appointmentId: String(appointmentId)
      }
    });

    payment.transactionId = session.id;
    await payment.save();

    res.json({ mode: 'stripe', url: session.url, sessionId: session.id, paymentId: payment._id });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/stripe/confirm', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!STRIPE_ENABLED) {
      return res.json({ ok: true, mode: 'demo' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentId = session.metadata?.paymentId;
    const appointmentId = session.metadata?.appointmentId;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (session.payment_status === 'paid') {
      payment.paymentStatus = 'completed';
      payment.updatedAt = new Date();
      await payment.save();

      await Appointment.findByIdAndUpdate(appointmentId, {
        paymentStatus: 'paid',
        status: 'confirmed',
        currency: 'LKR',
        paymentId: String(payment._id)
      });

      return res.json({ ok: true, payment });
    }

    payment.paymentStatus = 'failed';
    await payment.save();
    res.status(400).json({ ok: false, payment, stripeStatus: session.payment_status });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
