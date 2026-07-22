# Preventive Health Platform – Setup Guide

## Quick Start

### 1. Backend

```bash
cd Fiteness-Meal-Plan-Genaretor/back-end
npm install
node index.js
```

Backend runs at `http://localhost:3001` (or `PORT` from `.env`).

### 2. Frontend

```bash
cd Fiteness-Meal-Plan-Genaretor/front-end
npm install
npm start
```

Frontend runs at `http://localhost:3000`.

### 3. Environment (optional)

Create `back-end/.env`:

```
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/preventive_health_platform
JWT_SECRET=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000

# Single-hospital patient registration (required for “hospital code” sign-up)
HOSPITAL_ID=demo-hospital
HOSPITAL_DISPLAY_NAME=Demo Hospital
HOSPITAL_REGISTRATION_CODE=your-secret-registration-code
```

- **`HOSPITAL_REGISTRATION_CODE`**: patients enter this on the registration page (keep secret).
- **`HOSPITAL_ID`**: stored on new patients and staff; dashboards scope to this tenant (legacy patients with no `hospitalId` still appear for backward compatibility).
- **Per-patient invites**: hospital admins can create links under **Staff → Patient registration invite** (`POST /api/hospital/patient-invites`). Invites work even if `HOSPITAL_REGISTRATION_CODE` is empty.

Create `front-end/.env`:

```
REACT_APP_API_URL=http://localhost:3001
```

---

## Create First Hospital Admin

**Option A: Seed script (recommended)**

```bash
cd Fiteness-Meal-Plan-Genaretor/back-end
node seed/createHospitalAdmin.js
```

Defaults:

- Email: `admin@hospital.local`
- Password: `ChangeMe123!`
- Hospital: `Demo Hospital`

Override with env vars:

```bash
HOSPITAL_ADMIN_EMAIL=admin@myhospital.com HOSPITAL_ADMIN_PASSWORD=SecurePass123! HOSPITAL_NAME="My Hospital" node seed/createHospitalAdmin.js
```

**Option B: Hospital signup (dev only)**

1. Go to `/staff` → Hospital Login
<!-- 2. Click "Create admin"
2. Fill first name, last name, email, password, hospital name
3. Submit -->

---

## Routes

| Path                  | Description                                  |
| --------------------- | -------------------------------------------- |
| `/`                   | Patient landing                              |
| `/staff` or `/portal` | Staff/Admin portal (Doctor + Hospital login) |
| `/login`              | Patient login                                |
| `/signup`             | Patient signup                               |
| `/doctor/login`       | Doctor login                                 |
| `/hospital/login`     | Hospital login                               |

---

## Token Storage

- **Patient**: `token`, `user`
- **Doctor**: `doctorToken`, `doctor`
- **Hospital**: `hospitalToken`, `hospital`

Ensure MongoDB is running before starting the backend.
