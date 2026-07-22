// back-end/index.js
// AI-Based Post-Consultation Lifestyle Optimization System (Healthcare Support)

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// ==================== CONFIG ====================
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/preventive_health_platform';

// ==================== SOCKET.IO ====================
const io = socketIo(server, {
  cors: { origin: FRONTEND_ORIGIN, methods: ['GET', 'POST'] },
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  // Client can join role-based rooms for near real-time updates
  // Rooms: patient:<id>, coach:<id>, hospital
  socket.on('join', ({ role, id }) => {
    try {
      if (role === 'patient' && id) socket.join(`patient:${id}`);
      if ((role === 'coach' || role === 'advisor' || role === 'doctor') && id) socket.join(`coach:${id}`);
      if (role === 'hospital') socket.join('hospital');
    } catch (e) {
      // ignore join errors
    }
  });
  socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));
});

// ==================== MIDDLEWARE ====================
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/workouts/data', express.static(path.join(__dirname, 'data')));

// multer (for upload.none() usage)
const upload = multer();

// ==================== MODELS ====================
const UserModel = require('./models/User');
const Workout = require('./models/Workout');

// ==================== ROUTES ====================
const progressRoutes = require('./routes/progress');
const coachesRoutes = require('./routes/coaches');
// const appointmentsRoutes = require('./routes/appointments'); // removed (not used)
const paymentsRoutes = require('./routes/payments');
const messagesRoutes = require('./routes/messages');
const consultationsRoutes = require('./routes/consultations');
const adherenceRoutes = require('./routes/adherence');
const alertsRoutes = require('./routes/alerts');
const hospitalRoutes = require('./routes/hospital');
const reportsRoutes = require('./routes/reports');
const followupsRoutes = require('./routes/followups');
const medicationsRoutes = require('./routes/medications');
const authRoutes = require('./routes/auth');
const { createPatientUser } = require('./services/patientRegistration');

// Seed hardcoded coaches
const { seedHardcodedCoaches } = require('./seed/hardcodedCoaches');

app.use('/api/progress', progressRoutes);
app.use('/api/coaches', coachesRoutes);
// app.use('/api/appointments', appointmentsRoutes); // removed (not used)
app.use('/api/payments', paymentsRoutes);
app.use('/api/coaches/messages', messagesRoutes);

// New: post-consultation workflow
app.use('/api/consultations', consultationsRoutes);
app.use('/api/adherence', adherenceRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/followups', followupsRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/auth', authRoutes);

// ==================== MONGODB ====================
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB - fitness-app database');
    try {
      await seedHardcodedCoaches();
      console.log('🧑‍🏫 Hardcoded coaches ready (5)');
    } catch (e) {
      console.error('Coach seed error:', e.message);
    }
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ==================== AUTH ROUTES ====================

app.post('/signup', upload.none(), async (req, res) => {
  try {
    const { firstName, lastName, email, password, hospitalCode, inviteToken } = req.body || {};
    const user = await createPatientUser({
      firstName,
      lastName,
      email,
      password,
      hospitalCode,
      inviteToken,
    });
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role || 'patient' }, JWT_SECRET, {
      expiresIn: '7d',
    });
    res.json({
      message: 'Signup successful',
      user: { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, hospitalId: user.hospitalId },
      token,
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Error creating user' });
  }
});

app.post('/login', upload.none(), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email, role: { $in: ['patient', undefined, null] } });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    let ok = false;
    // Backward compatibility: older users may have plain-text passwords in DB
    if (typeof user.password === 'string' && user.password.startsWith('$2')) {
      ok = await bcrypt.compare(password, user.password);
    } else {
      ok = user.password === password;
      // if matched, upgrade to bcrypt hash
      if (ok) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }
    if (!ok) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role || 'patient' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});

app.get('/user/:userId', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Convenience lookup (used by the Health Advisor dashboard)
app.get('/user/by-email/:email', async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.params.email }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== MEAL PLANS (stored on user) ====================
// NOTE: front-end passes userId (not email) so the whole app consistently uses the userId.
app.post('/save-meal-plan', upload.none(), async (req, res) => {
  try {
    const { userId, mealPlan, nutritionSummary, userData } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.mealPlans = user.mealPlans || [];
    user.mealPlans.push({ planData: mealPlan, nutritionSummary, userData });

    await user.save();
    res.json({ message: 'Meal plan saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving meal plan', error: err.message });
  }
});

app.get('/meal-plans/:userId', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.mealPlans || []);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching meal plans', error: err.message });
  }
});

// ==================== WORKOUT DATA + GENERATOR ====================

let TRAINED = {};
let RULES = {};
try {
  const trainedPath = path.join(__dirname, 'data', 'trained_workout_data.json');
  const rulesPath = path.join(__dirname, 'data', 'workout_rules.json');
  TRAINED = JSON.parse(fs.readFileSync(trainedPath, 'utf8'));
  RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  console.log('💪 Workout datasets loaded');
} catch (e) {
  console.warn('⚠️ Workout datasets not loaded:', e.message);
}

app.get('/api/workouts/data/trained', (req, res) => res.json(TRAINED || {}));
app.get('/api/workouts/data/rules', (req, res) => res.json(RULES || {}));

function calculateCaloriesBurned(fitnessLevel, duration, workoutType) {
  const baseCaloriesPerMin = { beginner: 4, intermediate: 6, advanced: 8 };
  const intensity = {
    cardio: 1.3,
    'full-body': 1.2,
    'upper-body': 1.0,
    'lower-body': 1.1,
    core: 0.9,
  };

  const lvl = String(fitnessLevel || 'beginner').toLowerCase();
  const type = String(workoutType || 'full-body').toLowerCase();
  const mins = Number(duration || 30);

  const base = baseCaloriesPerMin[lvl] || 4;
  const mult = intensity[type] || 1.0;

  return Math.round(base * mins * mult);
}

function pickExercises({ fitnessLevel, workoutType, availableTime }) {
  const level = String(fitnessLevel || 'beginner').toLowerCase();
  const type = String(workoutType || 'full-body').toLowerCase();
  const minutes = Number(availableTime || 30);

  const db = Array.isArray(TRAINED?.exercise_database) ? TRAINED.exercise_database : [];

  const levelMap = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  const targetLevel = levelMap[level] || 'Beginner';

  let pool = db.filter((x) => String(x.Level || '').toLowerCase() === targetLevel.toLowerCase());
  if (pool.length === 0) pool = db;

  const count = minutes <= 30 ? 5 : 7;
  pool = pool.sort(() => Math.random() - 0.5);
  const chosen = pool.slice(0, Math.min(count, pool.length));

  const preset =
    level === 'advanced'
      ? { sets: 5, reps: '6-10', rest: 60 }
      : level === 'intermediate'
      ? { sets: 4, reps: '8-12', rest: 75 }
      : { sets: 3, reps: '10-12', rest: 90 };

  return chosen.map((e) => ({
    name: e.Title || 'Exercise',
    sets: preset.sets,
    reps: type === 'cardio' ? '30-60 sec' : preset.reps,
    rest: preset.rest,
    description: e.Desc || '',
    equipment: e.Equipment || '',
    bodyPart: e.BodyPart || '',
    level: e.Level || '',
    muscleGroup: e.Muscle_Group || '',
  }));
}

// Generate workout
app.post('/api/workouts/generate', upload.none(), async (req, res) => {
  try {
    const { userId, fitnessLevel, availableTime, workoutType, goal } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const minutes = Number(availableTime || 30);
    const exercises = pickExercises({ fitnessLevel, workoutType, availableTime: minutes });
    const caloriesBurned = calculateCaloriesBurned(fitnessLevel, minutes, workoutType);

    const plan = { goal: goal || '', fitnessLevel, workoutType, minutes };

    const workout = await Workout.create({
      userId,
      fitnessLevel,
      availableTime: minutes,
      workoutType,
      exercises,
      caloriesBurned,
      duration: minutes,
      plan,
      goal: goal || '',
    });

    res.json({
      _id: workout._id,
      goal: workout.goal,
      caloriesBurned: workout.caloriesBurned,
      duration: workout.duration,
      exercises: workout.exercises,
      plan: workout.plan,
      generatedAt: workout.generatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/workouts/user/:userId', async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.params.userId }).sort({ generatedAt: -1 });
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== HEALTH ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found', path: req.originalUrl, method: req.method });
});

// ==================== START ====================
server.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
});