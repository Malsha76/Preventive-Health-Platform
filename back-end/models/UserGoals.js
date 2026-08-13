// const mongoose = require('mongoose');

// const userGoalsSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//         unique: true
//     },
//     // Weight goals
//     targetWeight: Number,
//     startWeight: Number,
//     goalType: {
//         type: String,
//         enum: ['lose_weight', 'gain_weight', 'maintain', 'build_muscle', 'improve_fitness'],
//         default: 'maintain'
//     },
//     // Nutrition goals
//     dailyCalorieGoal: {
//         type: Number,
//         default: 2000
//     },
//     proteinGoal: Number,
//     carbsGoal: Number,
//     fatsGoal: Number,
//     // Fitness goals
//     weeklyWorkoutGoal: {
//         type: Number,
//         default: 3
//     },
//     dailyStepsGoal: {
//         type: Number,
//         default: 10000
//     },
//     // Lifestyle goals
//     dailyWaterGoal: {
//         type: Number,
//         default: 2.5
//     },
//     dailySleepGoal: {
//         type: Number,
//         default: 8
//     },
//     // Timeline
//     startDate: {
//         type: Date,
//         default: Date.now
//     },
//     targetDate: Date,
//     // Progress tracking
//     currentStreak: {
//         type: Number,
//         default: 0
//     },
//     longestStreak: {
//         type: Number,
//         default: 0
//     }
// }, {
//     timestamps: true
// });

// module.exports = mongoose.model('UserGoals', userGoalsSchema);


const mongoose = require('mongoose');

const userGoalsSchema = new mongoose.Schema({
    userId: {
        type: String, // Changed from ObjectId to String
        required: true,
        unique: true
    },
    targetWeight: Number,
    startWeight: Number,
    goalType: {
        type: String,
        enum: ['lose_weight', 'gain_weight', 'maintain', 'build_muscle', 'improve_fitness'],
        default: 'maintain'
    },
    dailyCalorieGoal: {
        type: Number,
        default: 2000
    },
    proteinGoal: Number,
    carbsGoal: Number,
    fatsGoal: Number,
    weeklyWorkoutGoal: {
        type: Number,
        default: 3
    },
    dailyStepsGoal: {
        type: Number,
        default: 10000
    },
    dailyWaterGoal: {
        type: Number,
        default: 2.5
    },
    dailySleepGoal: {
        type: Number,
        default: 8
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    targetDate: Date,
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserGoals', userGoalsSchema);