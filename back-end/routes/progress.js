// const express = require('express');
// const multer = require('multer');
// const Progress = require('../models/Progress');
// const router = express.Router();

// const upload = multer();

// // Track progress
// router.post('/track', upload.none(), async (req, res) => {
//     try {
//         const { userId, weight, caloriesConsumed, workoutsCompleted, waterIntake, sleepHours, mood, notes } = req.body;

//         const progress = new Progress({
//             userId,
//             weight,
//             caloriesConsumed,
//             workoutsCompleted,
//             waterIntake,
//             sleepHours,
//             mood,
//             notes
//         });

//         await progress.save();
        
//         // Return the expected response structure
//         res.status(201).json({ 
//             message: 'Progress tracked successfully',
//             data: progress 
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             message: 'Error tracking progress',
//             error: error.message 
//         });
//     }
// });

// // Get user's progress history
// router.get('/user/:userId', async (req, res) => {
//     try {
//         const progress = await Progress.find({ userId: req.params.userId })
//             .sort({ date: -1 })
//             .limit(30);
        
//         res.json(progress);
//     } catch (error) {
//         res.status(500).json({ 
//             message: 'Error fetching progress',
//             error: error.message 
//         });
//     }
// });

// module.exports = router;






// const express = require('express');
// const router = express.Router();
// const Progress = require('../models/Progress');

// // Get all progress entries for a user
// router.get('/user/:userId', async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const { startDate, endDate, limit = 100 } = req.query;

//         let query = { userId };

//         // Add date range filtering if provided
//         if (startDate || endDate) {
//             query.date = {};
//             if (startDate) query.date.$gte = new Date(startDate);
//             if (endDate) query.date.$lte = new Date(endDate);
//         }

//         const progressEntries = await Progress.find(query)
//             .sort({ date: -1 })
//             .limit(parseInt(limit));

//         res.json(progressEntries);
//     } catch (error) {
//         console.error('Error fetching progress data:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// // Get specific progress entry
// router.get('/:id', async (req, res) => {
//     try {
//         const progress = await Progress.findById(req.params.id);
//         if (!progress) {
//             return res.status(404).json({ error: 'Progress entry not found' });
//         }
//         res.json(progress);
//     } catch (error) {
//         console.error('Error fetching progress entry:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// // Create new progress entry
// router.post('/', async (req, res) => {
//     try {
//         const {
//             userId,
//             weight,
//             caloriesConsumed,
//             workoutsCompleted,
//             waterIntake,
//             sleepHours,
//             mood,
//             notes,
//             protein,
//             carbs,
//             fats,
//             steps,
//             heartRate,
//             bloodPressure,
//             energyLevel,
//             stressLevel
//         } = req.body;

//         // Calculate BMI if weight and height are provided
//         let bmi = null;
//         if (req.body.weight && req.body.height) {
//             const heightInMeters = req.body.height / 100;
//             bmi = (req.body.weight / (heightInMeters * heightInMeters)).toFixed(2);
//         }

//         const progress = new Progress({
//             userId,
//             date: new Date(),
//             weight,
//             bmi,
//             caloriesConsumed,
//             workoutsCompleted: workoutsCompleted || 0,
//             waterIntake,
//             sleepHours,
//             mood,
//             notes,
//             protein,
//             carbs,
//             fats,
//             steps,
//             heartRate,
//             bloodPressure,
//             energyLevel,
//             stressLevel
//         });

//         const savedProgress = await progress.save();
//         res.status(201).json(savedProgress);
//     } catch (error) {
//         console.error('Error creating progress entry:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// // Update progress entry
// router.put('/:id', async (req, res) => {
//     try {
//         const progress = await Progress.findByIdAndUpdate(
//             req.params.id,
//             req.body,
//             { new: true, runValidators: true }
//         );

//         if (!progress) {
//             return res.status(404).json({ error: 'Progress entry not found' });
//         }

//         res.json(progress);
//     } catch (error) {
//         console.error('Error updating progress entry:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// // Delete progress entry
// router.delete('/:id', async (req, res) => {
//     try {
//         const progress = await Progress.findByIdAndDelete(req.params.id);

//         if (!progress) {
//             return res.status(404).json({ error: 'Progress entry not found' });
//         }

//         res.json({ message: 'Progress entry deleted successfully' });
//     } catch (error) {
//         console.error('Error deleting progress entry:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// // Get progress statistics
// router.get('/stats/:userId', async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const { days = 30 } = req.query;

//         const startDate = new Date();
//         startDate.setDate(startDate.getDate() - parseInt(days));

//         const stats = await Progress.aggregate([
//             {
//                 $match: {
//                     userId,
//                     date: { $gte: startDate }
//                 }
//             },
//             {
//                 $group: {
//                     _id: null,
//                     avgWeight: { $avg: '$weight' },
//                     avgCalories: { $avg: '$caloriesConsumed' },
//                     avgSleep: { $avg: '$sleepHours' },
//                     avgWater: { $avg: '$waterIntake' },
//                     totalWorkouts: { $sum: '$workoutsCompleted' },
//                     latestWeight: { $last: '$weight' },
//                     weightChange: {
//                         $push: {
//                             date: '$date',
//                             weight: '$weight'
//                         }
//                     }
//                 }
//             }
//         ]);

//         res.json(stats[0] || {});
//     } catch (error) {
//         console.error('Error fetching progress stats:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// module.exports = router;






const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');

// ==================== DEBUG MIDDLEWARE ====================
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// ==================== GET ALL PROGRESS ENTRIES FOR A USER ====================
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate, limit = 100 } = req.query;

        console.log(`📋 Fetching progress for user: ${userId}`);
        console.log(`📅 Date range: ${startDate || 'none'} to ${endDate || 'none'}`);

        let query = { userId };

        // Add date range filtering if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
                console.log(`Start date filter: ${query.date.$gte}`);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
                console.log(`End date filter: ${query.date.$lte}`);
            }
        }

        console.log(`🔍 MongoDB query:`, JSON.stringify(query, null, 2));

        const progressEntries = await Progress.find(query)
            .sort({ date: -1 })
            .limit(parseInt(limit));

        console.log(`✅ Found ${progressEntries.length} entries for user ${userId}`);

        // Log first few entries for debugging
        if (progressEntries.length > 0) {
            console.log(`📊 Sample entries (first 3):`);
            progressEntries.slice(0, 3).forEach((entry, index) => {
                console.log(`  ${index + 1}. ID: ${entry._id}, Date: ${entry.date}, Weight: ${entry.weight}kg`);
            });
        }

        res.json(progressEntries);
    } catch (error) {
        console.error('❌ Error fetching progress data:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ==================== GET SPECIFIC PROGRESS ENTRY ====================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Fetching progress entry with ID: ${id}`);

        const progress = await Progress.findById(id);
        
        if (!progress) {
            console.log(`❌ Progress entry not found: ${id}`);
            return res.status(404).json({ error: 'Progress entry not found' });
        }

        console.log(`✅ Found progress entry:`, {
            id: progress._id,
            userId: progress.userId,
            date: progress.date,
            weight: progress.weight
        });

        res.json(progress);
    } catch (error) {
        console.error('❌ Error fetching progress entry:', error);
        console.error('❌ Error details:', error.message);
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ==================== CREATE NEW PROGRESS ENTRY ====================
router.post('/', async (req, res) => {
    try {
        console.log('📝 Received POST request to create progress entry');
        console.log('📦 Full request body:', JSON.stringify(req.body, null, 2));

        const {
            userId,
            weight,
            caloriesConsumed,
            workoutsCompleted,
            waterIntake,
            sleepHours,
            mood,
            notes,
            protein,
            carbs,
            fats,
            steps,
            heartRate,
            bloodPressure,
            energyLevel,
            stressLevel,
            height
        } = req.body;

        // Validate required fields
        if (!userId) {
            console.log('❌ Missing userId in request');
            return res.status(400).json({ error: 'User ID is required' });
        }

        console.log(`👤 Creating progress for user: ${userId}`);

        // Calculate BMI if weight and height are provided
        let bmi = null;
        if (weight && height) {
            const heightInMeters = height / 100;
            bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
            console.log(`📊 Calculated BMI: ${bmi} (weight: ${weight}kg, height: ${height}cm)`);
        }

        // Create progress object
        const progressData = {
            userId,
            date: new Date(),
            weight: weight || null,
            bmi,
            caloriesConsumed: caloriesConsumed || null,
            workoutsCompleted: workoutsCompleted || 0,
            waterIntake: waterIntake || null,
            sleepHours: sleepHours || null,
            mood: mood || null,
            notes: notes || '',
            protein: protein || null,
            carbs: carbs || null,
            fats: fats || null,
            steps: steps || null,
            heartRate: heartRate || null,
            bloodPressure: bloodPressure || null,
            energyLevel: energyLevel || null,
            stressLevel: stressLevel || null
        };

        console.log('💾 Progress data to save:', JSON.stringify(progressData, null, 2));

        const progress = new Progress(progressData);

        console.log('🔄 Saving to MongoDB...');
        const savedProgress = await progress.save();
        
        console.log('✅ Successfully saved to database!');
        console.log('📄 Saved document:', {
            id: savedProgress._id,
            userId: savedProgress.userId,
            date: savedProgress.date,
            weight: savedProgress.weight,
            createdAt: savedProgress.createdAt
        });

        res.status(201).json(savedProgress);
    } catch (error) {
        console.error('❌ Error creating progress entry:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = {};
            Object.keys(error.errors).forEach(key => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({ 
                error: 'Validation error', 
                details: errors 
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({ 
                error: 'Duplicate entry', 
                message: 'A progress entry already exists for this date' 
            });
        }

        res.status(500).json({ 
            error: 'Server error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ==================== UPDATE PROGRESS ENTRY ====================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`✏️ Updating progress entry with ID: ${id}`);
        console.log('📦 Update data:', JSON.stringify(req.body, null, 2));

        const progress = await Progress.findByIdAndUpdate(
            id,
            req.body,
            { 
                new: true, 
                runValidators: true,
                context: 'query'
            }
        );

        if (!progress) {
            console.log(`❌ Progress entry not found for update: ${id}`);
            return res.status(404).json({ error: 'Progress entry not found' });
        }

        console.log(`✅ Successfully updated progress entry: ${id}`);
        console.log('📄 Updated document:', {
            id: progress._id,
            userId: progress.userId,
            date: progress.date,
            weight: progress.weight,
            updatedAt: progress.updatedAt
        });

        res.json(progress);
    } catch (error) {
        console.error('❌ Error updating progress entry:', error);
        console.error('❌ Error details:', error.message);
        
        if (error.name === 'ValidationError') {
            const errors = {};
            Object.keys(error.errors).forEach(key => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({ 
                error: 'Validation error', 
                details: errors 
            });
        }

        res.status(500).json({ 
            error: 'Server error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ==================== DELETE PROGRESS ENTRY ====================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Deleting progress entry with ID: ${id}`);

        const progress = await Progress.findByIdAndDelete(id);

        if (!progress) {
            console.log(`❌ Progress entry not found for deletion: ${id}`);
            return res.status(404).json({ error: 'Progress entry not found' });
        }

        console.log(`✅ Successfully deleted progress entry: ${id}`);
        console.log('📄 Deleted document info:', {
            id: progress._id,
            userId: progress.userId,
            date: progress.date
        });

        res.json({ 
            message: 'Progress entry deleted successfully',
            deletedId: progress._id,
            userId: progress.userId
        });
    } catch (error) {
        console.error('❌ Error deleting progress entry:', error);
        console.error('❌ Error details:', error.message);
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message 
        });
    }
});

// ==================== GET PROGRESS STATISTICS ====================
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 30 } = req.query;

        console.log(`📊 Getting stats for user: ${userId} (last ${days} days)`);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        console.log(`📅 Start date for stats: ${startDate}`);

        const stats = await Progress.aggregate([
            {
                $match: {
                    userId: userId,
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    avgWeight: { $avg: '$weight' },
                    avgCalories: { $avg: '$caloriesConsumed' },
                    avgSleep: { $avg: '$sleepHours' },
                    avgWater: { $avg: '$waterIntake' },
                    totalWorkouts: { $sum: '$workoutsCompleted' },
                    totalEntries: { $sum: 1 },
                    latestWeight: { $last: '$weight' },
                    earliestWeight: { $first: '$weight' },
                    weightChange: {
                        $push: {
                            date: '$date',
                            weight: '$weight'
                        }
                    }
                }
            },
            {
                $addFields: {
                    weightDifference: {
                        $cond: {
                            if: { $and: ['$latestWeight', '$earliestWeight'] },
                            then: { $subtract: ['$latestWeight', '$earliestWeight'] },
                            else: null
                        }
                    }
                }
            }
        ]);

        console.log(`📈 Aggregation result:`, JSON.stringify(stats, null, 2));

        if (stats.length === 0) {
            console.log(`ℹ️ No stats found for user ${userId} in the last ${days} days`);
            res.json({
                avgWeight: null,
                avgCalories: null,
                avgSleep: null,
                avgWater: null,
                totalWorkouts: 0,
                totalEntries: 0,
                latestWeight: null,
                weightDifference: null
            });
        } else {
            const result = stats[0];
            console.log(`✅ Stats calculated for user ${userId}:`, {
                totalEntries: result.totalEntries,
                avgWeight: result.avgWeight,
                totalWorkouts: result.totalWorkouts
            });
            res.json(result);
        }
    } catch (error) {
        console.error('❌ Error fetching progress stats:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ==================== HEALTH CHECK ROUTE ====================
router.get('/health/check', async (req, res) => {
    try {
        console.log('🏥 Health check requested');
        
        // Test database connection
        const dbState = mongoose.connection.readyState;
        const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        
        // Count total documents
        const totalDocs = await Progress.countDocuments();
        
        // Get database info
        const dbInfo = {
            database: mongoose.connection.db.databaseName,
            state: dbStates[dbState],
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            totalProgressEntries: totalDocs,
            collections: await mongoose.connection.db.listCollections().toArray()
                .then(collections => collections.map(col => col.name))
        };

        console.log('✅ Health check passed:', dbInfo);

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: dbInfo
        });
    } catch (error) {
        console.error('❌ Health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ==================== TEST DATA ROUTE (DEV ONLY) ====================
if (process.env.NODE_ENV === 'development') {
    router.post('/test/create-sample', async (req, res) => {
        try {
            const { userId, count = 5 } = req.body;
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            console.log(`🧪 Creating ${count} sample entries for user: ${userId}`);

            const sampleEntries = [];
            const now = new Date();

            for (let i = 0; i < count; i++) {
                const entryDate = new Date(now);
                entryDate.setDate(entryDate.getDate() - i);

                const sampleEntry = {
                    userId,
                    date: entryDate,
                    weight: 70 + (Math.random() * 4 - 2), // Random weight around 70kg
                    caloriesConsumed: Math.floor(1800 + Math.random() * 500),
                    workoutsCompleted: Math.floor(Math.random() * 3),
                    waterIntake: 2 + Math.random() * 1.5,
                    sleepHours: 6 + Math.random() * 3,
                    mood: ['excellent', 'good', 'average', 'poor', 'terrible'][Math.floor(Math.random() * 5)],
                    notes: `Sample entry ${i + 1}`,
                    protein: Math.floor(50 + Math.random() * 100),
                    carbs: Math.floor(150 + Math.random() * 150),
                    fats: Math.floor(30 + Math.random() * 40),
                    steps: Math.floor(5000 + Math.random() * 10000)
                };

                const progress = new Progress(sampleEntry);
                const saved = await progress.save();
                sampleEntries.push(saved);
            }

            console.log(`✅ Created ${sampleEntries.length} sample entries`);

            res.status(201).json({
                message: `Created ${sampleEntries.length} sample entries`,
                entries: sampleEntries.map(e => ({
                    id: e._id,
                    date: e.date,
                    weight: e.weight
                }))
            });
        } catch (error) {
            console.error('❌ Error creating sample data:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/test/list-all', async (req, res) => {
        try {
            console.log('📋 Listing all progress entries in database');
            
            const allEntries = await Progress.find({})
                .sort({ date: -1 })
                .limit(50);

            const summary = allEntries.map(entry => ({
                id: entry._id,
                userId: entry.userId,
                date: entry.date,
                weight: entry.weight,
                calories: entry.caloriesConsumed,
                workouts: entry.workoutsCompleted
            }));

            console.log(`📊 Found ${allEntries.length} total entries in database`);
            
            // Group by user
            const byUser = {};
            allEntries.forEach(entry => {
                if (!byUser[entry.userId]) {
                    byUser[entry.userId] = 0;
                }
                byUser[entry.userId]++;
            });

            res.json({
                totalEntries: await Progress.countDocuments(),
                recentEntries: allEntries.length,
                entriesByUser: byUser,
                sampleEntries: summary
            });
        } catch (error) {
            console.error('❌ Error listing all entries:', error);
            res.status(500).json({ error: error.message });
        }
    });
}

module.exports = router;