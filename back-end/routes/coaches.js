const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Coach = require('../models/Coach');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
// const VideoSession = require('../models/VideoSession'); // removed (video sessions not used)
const Payment = require('../models/Payment');
const Message = require('../models/Message');
const router = express.Router();

// List patients (for hospital console & advisor search)
router.get('/patients', async (req, res) => {
  try {
    const patients = await User.find({ role: { $in: ['patient', undefined] } })
      .select('_id firstName lastName email role')
      ;
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch patients', error: err.message });
  }
});


const upload = multer({ storage: multer.memoryStorage() });

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ==================== COACH AUTHENTICATION ====================

// Coach registration
router.post('/register', upload.single('profileImage'), async (req, res) => {
    try {
        const {
            name, email, password, phone, specialization,
            certification, experience, bio, hourlyRate,
            languages, education, achievements, availability
        } = req.body;

        // Check if coach already exists
        const existingCoach = await Coach.findOne({ email });
        if (existingCoach) {
            return res.status(400).json({ message: 'Coach already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Parse JSON fields
        const parsedEducation = education ? JSON.parse(education) : [];
        const parsedAchievements = achievements ? JSON.parse(achievements) : [];
        const parsedAvailability = availability ? JSON.parse(availability) : [];

        const coach = new Coach({
            name,
            email,
            password: hashedPassword,
            phone,
            specialization: specialization.split(','),
            certification: certification.split(','),
            experience: parseInt(experience),
            bio,
            hourlyRate: parseInt(hourlyRate),
            languages: languages.split(','),
            education: parsedEducation,
            achievements: parsedAchievements,
            availability: parsedAvailability
        });

        // Handle profile image
        if (req.file) {
            coach.profileImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        await coach.save();

        // Generate JWT token
        const token = jwt.sign(
            { coachId: coach._id, email: coach.email, role: 'coach' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Coach registered successfully',
            coach: {
                coachId: coach._id,
                name: coach.name,
                email: coach.email,
                specialization: coach.specialization
            },
            token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Coach login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const coach = await Coach.findOne({ email });
        if (!coach) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, coach.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update online status
        coach.isOnline = true;
        coach.lastSeen = new Date();
        await coach.save();

        // Generate JWT token
        const token = jwt.sign(
            { coachId: coach._id, email: coach.email, role: 'coach' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            coach: {
                coachId: coach._id,
                name: coach.name,
                email: coach.email,
                profileImage: coach.profileImage,
                specialization: coach.specialization,
                isOnline: coach.isOnline,
                rating: coach.rating
            },
            token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Coach logout
router.post('/logout', async (req, res) => {
    try {
        const { coachId } = req.body;
        await Coach.findByIdAndUpdate(coachId, {
            isOnline: false,
            lastSeen: new Date()
        });
        res.json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get coach profile
router.get('/profile/:coachId', async (req, res) => {
    try {
        const coach = await Coach.findById(req.params.coachId)
            .select('-password');
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }
        res.json(coach);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update coach profile
router.put('/profile/:coachId', upload.single('profileImage'), async (req, res) => {
    try {
        const updates = req.body;
        
        if (req.file) {
            updates.profileImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        const coach = await Coach.findByIdAndUpdate(
            req.params.coachId,
            { ...updates, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).select('-password');

        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        res.json(coach);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== VIDEO CALL FUNCTIONALITY ====================
// (Removed) Video session endpoints were removed as this project does not use video sessions.

// ==================== PAYMENT PROCESSING ====================

// Create payment intent (for Stripe integration)
router.post('/payments/create-intent', async (req, res) => {
    try {
        const { amount, currency, appointmentId, userId, coachId } = req.body;

        // In production, integrate with Stripe/PayPal
        // This is a mock implementation
        
        const paymentIntent = {
            id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            client_secret: `secret_${Math.random().toString(36).substr(2, 16)}`,
            amount: amount * 100, // Convert to cents
            currency: currency || 'USD',
            status: 'requires_payment_method'
        };

        // Create payment record
        const payment = new Payment({
            userId,
            coachId,
            appointmentId,
            amount,
            currency: currency || 'USD',
            paymentMethod: 'credit_card',
            paymentStatus: 'pending',
            transactionId: paymentIntent.id,
            paymentGateway: 'stripe'
        });

        await payment.save();

        res.json({
            paymentIntent,
            paymentId: payment._id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Confirm payment
router.post('/payments/confirm', async (req, res) => {
    try {
        const { paymentId, transactionId, paymentMethod } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Mock payment confirmation
        payment.paymentStatus = 'completed';
        payment.transactionId = transactionId;
        payment.paymentMethod = paymentMethod;
        payment.updatedAt = new Date();

        await payment.save();

        // Update appointment payment status
        await Appointment.findByIdAndUpdate(payment.appointmentId, {
            paymentStatus: 'paid',
            status: 'confirmed',
            paymentMethod,
            updatedAt: new Date()
        });

        res.json({
            message: 'Payment confirmed successfully',
            payment
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get payment history
router.get('/payments/user/:userId', async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.params.userId })
            
            .populate('coachId', 'name')
            .populate('appointmentId', 'title date');
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get coach earnings
router.get('/payments/coach/:coachId/earnings', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let query = { coachId: req.params.coachId, paymentStatus: 'completed' };
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const payments = await Payment.find(query);
        
        const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalSessions = payments.length;
        
        res.json({
            totalEarnings,
            totalSessions,
            payments,
            averageEarningPerSession: totalSessions > 0 ? totalEarnings / totalSessions : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== APPOINTMENT MANAGEMENT ====================

// Book appointment
router.post('/appointments/book', async (req, res) => {
    try {
        const {
            userId, coachId, date, duration, type,
            title, description, videoCallEnabled
        } = req.body;

        // Get user and coach details
        const user = await User.findById(userId);
        const coach = await Coach.findById(coachId);

        if (!user || !coach) {
            return res.status(404).json({ message: 'User or coach not found' });
        }

        const amount = coach.hourlyRate * (duration / 60);

        const appointment = new Appointment({
            userId,
            coachId,
            userName: `${user.firstName} ${user.lastName}`,
            userEmail: user.email,
            coachName: coach.name,
            coachEmail: coach.email,
            title: title || `${type} Session with ${coach.name}`,
            description,
            date: new Date(date),
            duration,
            type,
            amount,
            videoCallEnabled: videoCallEnabled !== false,
            preparationNotes: `Please prepare for your ${type} session.`
        });

        await appointment.save();

        // Update coach's total sessions
        coach.totalSessions += 1;
        await coach.save();

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get coach appointments
router.get('/appointments/coach/:coachId', async (req, res) => {
    try {
        const { status, upcoming } = req.query;
        
        let query = { coachId: req.params.coachId };
        
        if (status) {
            query.status = status;
        }
        
        if (upcoming === 'true') {
            query.date = { $gte: new Date() };
        }

        const appointments = await Appointment.find(query)
            .populate('userId', 'firstName lastName email')
            .sort({ date: 1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user appointments
router.get('/appointments/user/:userId', async (req, res) => {
    try {
        const appointments = await Appointment.find({ userId: req.params.userId })
            .populate('coachId', 'name profileImage specialization rating')
            .sort({ date: -1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update appointment status
router.put('/appointments/:id/status', async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        const updateData = { 
            status,
            updatedAt: new Date()
        };
        
        if (notes) {
            if (status === 'completed') {
                updateData.coachNotes = notes;
            }
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== RATING & REVIEWS ====================

// Rate coach
router.post('/rate', async (req, res) => {
    try {
        const { coachId, userId, userName, userImage, rating, comment, appointmentId } = req.body;

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const coach = await Coach.findById(coachId);
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        // Check if user already rated this appointment
        const existingReview = coach.reviews.find(
            review => review.userId.toString() === userId && 
                     review.appointmentId?.toString() === appointmentId
        );

        if (existingReview) {
            return res.status(400).json({ message: 'You have already rated this session' });
        }

        // Add review
        coach.reviews.push({
            userId,
            userName,
            userImage,
            rating,
            comment,
            date: new Date(),
            appointmentId
        });

        // Update average rating
        const totalRatings = coach.reviews.length;
        const totalScore = coach.reviews.reduce((sum, review) => sum + review.rating, 0);
        coach.rating = totalScore / totalRatings;
        coach.totalRatings = totalRatings;

        await coach.save();

        // Update appointment with rating
        if (appointmentId) {
            await Appointment.findByIdAndUpdate(appointmentId, {
                userRating: rating,
                userReview: comment
            });
        }

        res.json({
            message: 'Rating submitted successfully',
            coach: {
                rating: coach.rating,
                totalRatings: coach.totalRatings
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get coach reviews
router.get('/:coachId/reviews', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const coach = await Coach.findById(req.params.coachId);
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        const reviews = coach.reviews
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(skip, skip + parseInt(limit));

        const totalPages = Math.ceil(coach.reviews.length / limit);

        res.json({
            reviews,
            currentPage: parseInt(page),
            totalPages,
            totalReviews: coach.reviews.length,
            averageRating: coach.rating
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== COACH DISCOVERY ====================

// Get all coaches with filters
router.get('/', async (req, res) => {
    try {
        const { 
            specialization, 
            minRating, 
            maxRate, 
            availability,
            sortBy = 'rating',
            page = 1,
            limit = 12
        } = req.query;
        
        const skip = (page - 1) * limit;
        
        let filter = {};
        let sort = {};

        if (specialization) {
            filter.specialization = { $in: [specialization] };
        }
        
        if (minRating) {
            filter.rating = { $gte: parseFloat(minRating) };
        }
        
        if (maxRate) {
            filter.hourlyRate = { $lte: parseFloat(maxRate) };
        }
        
        if (availability === 'online') {
            filter.isOnline = true;
        }

        // Sorting
        if (sortBy === 'rating') {
            sort = { rating: -1 };
        } else if (sortBy === 'experience') {
            sort = { experience: -1 };
        } else if (sortBy === 'rate') {
            sort = { hourlyRate: 1 };
        }

        const coaches = await Coach.find(filter)
            .select('-password')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Coach.countDocuments(filter);

        res.json({
            coaches,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalCoaches: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get featured coaches
router.get('/featured', async (req, res) => {
    try {
        const coaches = await Coach.find({ 
            featured: true,
            rating: { $gte: 4.5 }
        })
        .select('-password')
        .limit(6);

        res.json(coaches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== COACH ANALYTICS ====================

router.get('/:coachId/analytics', async (req, res) => {
    try {
        const coachId = req.params.coachId;
        
        // Get appointments data
        const appointments = await Appointment.find({ coachId });
        
        // Calculate analytics
        const totalSessions = appointments.length;
        const completedSessions = appointments.filter(a => a.status === 'completed').length;
        const pendingSessions = appointments.filter(a => a.status === 'pending').length;
        const cancelledSessions = appointments.filter(a => a.status === 'cancelled').length;
        
        const revenue = appointments
            .filter(a => a.paymentStatus === 'paid')
            .reduce((sum, a) => sum + a.amount, 0);
        
        const coach = await Coach.findById(coachId);
        
        res.json({
            totalSessions,
            completedSessions,
            pendingSessions,
            cancelledSessions,
            completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
            revenue,
            rating: coach.rating,
            totalRatings: coach.totalRatings,
            responseTime: coach.responseTime,
            availability: coach.availability
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;