

const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fitnessLevel: {
        type: ,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    availableTime: {
        type: Number,
        required: true
    },
    workoutType: {
        type: String,
        enum: ['full-body', 'upper-body', 'lower-body', 'core', 'cardio'],
        required: true
    },
    exercises: [{
        name: String,
        sets: Number,
        reps: String,
        rest: Number,
        description: String,
        demonstration: String
    }],
    caloriesBurned: Number,
    duration: Number,
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: Date,
    feedback: String,
    // --- Healthcare support additions ---
    // Optional structured output (e.g., doctor-approved constraints, per-day plan)
    plan: { type: Object, default: {} },
    // User goal context
    goal: { type: String, default: "" },
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Workout', workoutSchema);