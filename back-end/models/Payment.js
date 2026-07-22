const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coachId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coach'
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    transactionId: String,
    paymentGateway: String,
    billingDetails: {
        name: String,
        email: String,
        phone: String,
        address: {
            line1: String,
            city: String,
            state: String,
            postal_code: String,
            country: String
        }
    },
    refundDetails: {
        amount: Number,
        reason: String,
        processedAt: Date
    },
    invoiceUrl: String,
    receiptUrl: String,
    metadata: Object,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', paymentSchema);