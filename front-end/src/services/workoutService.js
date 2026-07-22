class WorkoutService {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this._loaded = false;
    this._loadingPromise = null;
    this.workoutData = null;
    this.exercises = [];
    this.rules = {};
    this.lookup = {};
  }

  /**
   * Loads workout/exercise reference data once.
   * Safe to call multiple times.
   */
  async load() {
    if (this._loaded) return;
    if (this._loadingPromise) return this._loadingPromise;

    this._loadingPromise = (async () => {
      try {
        const [trained, rules, lookup] = await Promise.all([
          fetch(`${this.baseUrl}/api/workouts/data/trained_workout_data.json`).then(r => r.json()),
          fetch(`${this.baseUrl}/api/workouts/data/workout_rules.json`).then(r => r.json()),
          fetch(`${this.baseUrl}/api/workouts/data/exercise_lookup.json`).then(r => r.json())
        ]);

        this.workoutData = trained;
        this.exercises = trained?.exercise_database || [];
        this.rules = rules || {};
        this.lookup = lookup || {};
        this._loaded = true;
      } catch (e) {
        // If backend data endpoints aren't available, don't crash the UI.
        console.warn('WorkoutService: failed to load data, using fallback dataset.', e);
        this.exercises = this.exercises.length ? this.exercises : this._fallbackExercises();
        this._loaded = true;
      } finally {
        this._loadingPromise = null;
      }
    })();

    return this._loadingPromise;
  }

  /**
   * Synchronous getter used by components.
   * Call `await WorkoutService.load()` before this to ensure data is present.
   */
  getAllExercises() {
    return Array.isArray(this.exercises) ? this.exercises : [];
  }

  getExercisesByCriteria(filters = {}) {
    let filtered = [...this.getAllExercises()];

    if (filters.searchTerm) {
      const s = String(filters.searchTerm).toLowerCase();
      filtered = filtered.filter(ex => {
        const name = String(ex.Name || ex.name || '').toLowerCase();
        const bp = String(ex.BodyPart || '').toLowerCase();
        return name.includes(s) || bp.includes(s);
      });
    }

    if (filters.bodyPart) {
      const bp = String(filters.bodyPart).toLowerCase();
      filtered = filtered.filter(ex => String(ex.BodyPart || '').toLowerCase().includes(bp));
    }

    if (filters.equipment) {
      const eq = String(filters.equipment).toLowerCase();
      filtered = filtered.filter(ex => String(ex.Equipment || '').toLowerCase().includes(eq));
    }

    if (filters.difficulty) {
      const lvl = String(filters.difficulty).toLowerCase();
      filtered = filtered.filter(ex => String(ex.Level || '').toLowerCase() === lvl);
    }

    if (filters.type) {
      const t = String(filters.type).toLowerCase();
      filtered = filtered.filter(ex => String(ex.Type || '').toLowerCase().includes(t));
    }

    return filtered;
  }

  /**
   * Simple stats used by the UI.
   */
  getWorkoutStats() {
    const ex = this.getAllExercises();
    const levels = new Set(ex.map(e => e.Level).filter(Boolean));
    const bodyParts = new Set(ex.map(e => e.BodyPart).filter(Boolean));
    const equipment = new Set(ex.map(e => e.Equipment).filter(Boolean));

    return {
      totalExercises: ex.length,
      difficultyLevels: Array.from(levels),
      bodyParts: Array.from(bodyParts),
      equipmentTypes: Array.from(equipment)
    };
  }

  /**
   * Generates a workout plan (constraint-driven) using available exercises.
   * Keeps existing UI expectations.
   */
  generateWorkoutPlan(form) {
    const fitnessLevel = String(form?.fitnessLevel || 'beginner').toLowerCase();
    const workoutType = String(form?.workoutType || 'full-body').toLowerCase();
    const availableTime = Number(form?.availableTime || 20);
    const goal = String(form?.goal || 'general').toLowerCase();

    let candidates = this.getAllExercises();
    if (!candidates.length) candidates = this._fallbackExercises();

    const typeToBodyPart = {
      cardio: ['cardio', 'full body'],
      'full-body': ['full body', 'legs', 'back', 'chest', 'core'],
      strength: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'],
      flexibility: ['stretch', 'flexibility', 'full body']
    };

    const allowedBodyParts = typeToBodyPart[workoutType] || [];
    if (allowedBodyParts.length) {
      const filtered = candidates.filter(e => {
        const bp = String(e.BodyPart || '').toLowerCase();
        return allowedBodyParts.some(a => bp.includes(a));
      });
      if (filtered.length >= 6) candidates = filtered;
    }

    const levelMap = {
      beginner: ['beginner'],
      intermediate: ['intermediate', 'beginner'],
      advanced: ['advanced', 'intermediate']
    };
    const allowedLevels = levelMap[fitnessLevel] || ['beginner'];
    const byLevel = candidates.filter(e => allowedLevels.includes(String(e.Level || '').toLowerCase()));
    if (byLevel.length >= 6) candidates = byLevel;

    const count = availableTime <= 15 ? 4 : availableTime <= 30 ? 6 : 8;
    const picked = this._pickRandom(candidates, count);

    const exercises = picked.map(ex => {
      const name = ex.Name || ex.name || 'Exercise';
      const sets = goal.includes('muscle') ? 4 : 3;
      const reps = workoutType === 'cardio'
        ? '30 seconds'
        : fitnessLevel === 'beginner'
          ? '8-10'
          : fitnessLevel === 'advanced'
            ? '10-15'
            : '10-12';
      return { name, sets, reps };
    });

    const caloriesBurned = Math.round((availableTime * (workoutType === 'cardio' ? 9 : 6)));

    return {
      fitnessLevel,
      workoutType,
      duration: availableTime,
      goal,
      caloriesBurned,
      exercises,
      optimizationExplanation: [
        `Exercises selected to match your activity type: ${workoutType}.`,
        `Intensity matched to your activity tolerance level: ${fitnessLevel}.`,
        `Plan length optimized for your time constraint: ${availableTime} minutes.`
      ]
    };
  }

  _pickRandom(items, count) {
    const arr = [...items];
    const out = [];
    while (arr.length && out.length < count) {
      const idx = Math.floor(Math.random() * arr.length);
      out.push(arr.splice(idx, 1)[0]);
    }
    return out;
  }

  _fallbackExercises() {
    return [
      { Name: 'Bodyweight Squats', BodyPart: 'Legs', Equipment: 'Bodyweight', Level: 'Beginner', Type: 'Strength' },
      { Name: 'Push-ups (Knee)', BodyPart: 'Chest', Equipment: 'Bodyweight', Level: 'Beginner', Type: 'Strength' },
      { Name: 'Plank', BodyPart: 'Core', Equipment: 'Bodyweight', Level: 'Beginner', Type: 'Strength' },
      { Name: 'Jumping Jacks', BodyPart: 'Cardio', Equipment: 'Bodyweight', Level: 'Beginner', Type: 'Cardio' },
      { Name: 'Lunges', BodyPart: 'Legs', Equipment: 'Bodyweight', Level: 'Intermediate', Type: 'Strength' },
      { Name: 'Mountain Climbers', BodyPart: 'Cardio', Equipment: 'Bodyweight', Level: 'Intermediate', Type: 'Cardio' },
      { Name: 'Burpees', BodyPart: 'Cardio', Equipment: 'Bodyweight', Level: 'Advanced', Type: 'Cardio' },
      { Name: 'Shoulder Taps', BodyPart: 'Shoulders', Equipment: 'Bodyweight', Level: 'Beginner', Type: 'Strength' }
    ];
  }
}

// Export a singleton instance (UI expects direct method calls)
const workoutService = new WorkoutService();
export { WorkoutService };
export default workoutService;
