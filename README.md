# AI-Based Post-Consultation Lifestyle Optimization System (Healthcare Support)

This is an enhanced version of the original **AI-Integrated Preventive Health Planning Platform**.
It is re-positioned as a **post-consultation lifestyle support platform** for clinics / private hospitals.

## Stack
- **Front-end:** React (CRA)
- **Back-end:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Real-time messaging:** Socket.IO (coach ↔ patient chat)
- **Optimization / AI:**
  - Meal plan optimization: Genetic Algorithm (GA) module (python folder / ...)
  - Workout generation: rule-based + dataset-driven selection (can be upgraded to AI)

## Main modules
- Patient login/signup
- Physical activity planning (goal & constraints)
- Nutrition optimization & meal recommendations
- Health advisor login + advisor dashboard
- Advisor ↔ user chat (Socket.IO)
- Appointments (optional)

## How to run (Windows)

### 1) Start MongoDB
Make sure MongoDB is running (local or Atlas).

### 2) Back-end
```bash
cd back-end
# IMPORTANT: if you previously got "Cannot find module dotenv" run:
# npm install
npm install

# create .env
# MONGO_URI=... your mongodb connection string
# JWT_SECRET=yourSecret
# PORT=3001

npm run dev
```

### 3) Front-end
```bash
cd front-end
# If you got fork-ts-checker errors before, run these once:
# rmdir /s /q node_modules
# del package-lock.json
# npm cache clean --force

npm install
npm start
```

Open: http://localhost:3000

## Notes for supervisor / report
The novelty is NOT “because it uses ChatGPT”. The novelty is:
1. **Clinical constraint-based planning** (doctor-approved constraints + patient goal)
2. **Optimization** (GA-based selection to match nutrition targets while respecting restrictions)
3. **Post-consultation adherence** support (tracking + reminders + coach monitoring)
4. **Continuous personalization** (feedback loop to refine plans)

