const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    weight: {
        type: Number,
        min: 0
    },
    bmi: Number,
    caloriesConsumed: {
        type: Number,
        min: 0
    },
    
    waterIntake: {
        type: Number,
        min: 0
    },
    sleepHours: {
        type: Number,
        min: 0,
        max: 24
    },
    mood: {
        type: String,
        enum: ['excellent', 'good', 'average', 'poor', 'terrible']
    },
    notes: String,
    protein: Number,
    carbs: Number,
    fats: Number,
    steps: Number,
    heartRate: Number,
    bloodPressure: String,
    energyLevel: {
        type: String,
        enum: ['very_low', 'low', 'medium', 'high', 'very_high']
    },
    stressLevel: {
        type: Number,
        min: 1,
        max: 10
    }
}, {
    timestamps: true
});

// Index for efficient querying
progressSchema.index({ userId: 1, date: -1 });
progressSchema.index({ userId: 1, weight: 1 });
progressSchema.index({ userId: 1, workoutsCompleted: 1 });

module.exports = mongoose.model('Progress', progressSchema);