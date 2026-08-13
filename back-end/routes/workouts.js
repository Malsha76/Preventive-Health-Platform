const express = require('express');
const multer = require('multer');
const Workout = require('../models/Workout');
const router = express.Router();

const upload = multer();

const exerciseDatabase = {
    beginner: {
        'full-body': [
            { name: "Bodyweight Squats", sets: 3, reps: "10-12", rest: 60, description: "Stand with feet shoulder-width apart, lower into squat position" },
            { name: "Push-ups (Knee)", sets: 3, reps: "8-10", rest: 60, description: "Modified push-ups on knees" },
            { name: "Plank", sets: 3, reps: "20-30 seconds", rest: 45, description: "Hold plank position engaging core" }
        ]
    }
};

router.post('/generate', upload.none(), async (req, res) => {
    try {
        const { userId, fitnessLevel, availableTime, workoutType } = req.body;

        let selectedExercises = exerciseDatabase[fitnessLevel]?.[workoutType] || exerciseDatabase[fitnessLevel]?.['full-body'];
        
        if (!selectedExercises) {
            selectedExercises = exerciseDatabase['beginner']['full-body'];
        }

        const adjustedExercises = selectedExercises;
        const caloriesBurned = 200;

        const workout = new Workout({
            userId,
            fitnessLevel,
            availableTime,
            workoutType,
            exercises: adjustedExercises,
            caloriesBurned,
            duration: availableTime
        });

        await workout.save();
        res.json(workout);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/user/:userId', async (req, res) => {
    try {
        const workouts = await Workout.find({ userId: req.params.userId }).sort({ generatedAt: -1 });
        res.json(workouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;