const Coach = require('../models/Coach');

// Shared bcrypt hash for password "password123" (matches your existing demo hash)
const DEFAULT_PASSWORD_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.H.8gJpzZjV.2.6FZjKZq1Q6Y0eO";

const HARD_CODED_COACHES = [
  { name: "Sarah Johnson", email: "sarah@coach.com", hourlyRate: 3500, specialization: ["Nutrition", "Weight Loss"], password: DEFAULT_PASSWORD_HASH },
  { name: "Nimal Perera", email: "nimal@coach.com", hourlyRate: 3000, specialization: ["Strength", "No-gym Workouts"], password: DEFAULT_PASSWORD_HASH },
  { name: "Ayesha Silva", email: "ayesha@coach.com", hourlyRate: 3200, specialization: ["Yoga", "Wellness"], password: DEFAULT_PASSWORD_HASH },
  { name: "Kavindu Fernando", email: "kavindu@coach.com", hourlyRate: 2800, specialization: ["Cardio", "Fat Loss"], password: DEFAULT_PASSWORD_HASH },
  { name: "Meena Kumar", email: "meena@coach.com", hourlyRate: 3600, specialization: ["Sports Nutrition", "Muscle Gain"], password: DEFAULT_PASSWORD_HASH }
];

async function seedHardcodedCoaches({ reset = false } = {}) {
  if (reset) {
    await Coach.deleteMany({});
  }

  for (const c of HARD_CODED_COACHES) {
    const existing = await Coach.findOne({ email: c.email });
    if (!existing) {
      await Coach.create({
        ...c,
        rating: 4.7,
        totalRatings: 20,
        isOnline: true,
        languages: ["English", "Sinhala"],
        experience: 5,
        bio: `${c.name} is available for coaching via in-app chat and paid appointments.`
      });
    }
  }
}

module.exports = { HARD_CODED_COACHES, seedHardcodedCoaches };
