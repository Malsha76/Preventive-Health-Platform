const express = require('express');
const multer = require('multer');
const UserModel = require('../models/User');
const router = express.Router();

const upload = multer();

router.post('/save-meal-plan', upload.none(), async (req, res) => {
    const { email, userId, mealPlan, nutritionSummary, userData } = req.body;

    try {
        const user = userId ? await UserModel.findById(userId) : await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.mealPlans.push({
            planData: mealPlan,
            nutritionSummary: nutritionSummary,
            userData: userData
        });

        await user.save();
        res.json({ message: 'Meal plan saved successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error saving meal plan', error: err.message });
    }
});

router.get('/meal-plans/:email', async (req, res) => {
    const { email } = req.params;

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.mealPlans);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching meal plans', error: err.message });
    }
});

// Preferred: fetch meal plans by userId
router.get('/meal-plans/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.mealPlans || []);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching meal plans', error: err.message });
    }
});

module.exports = router;