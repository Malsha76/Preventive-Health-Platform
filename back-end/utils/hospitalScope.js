const User = require('../models/User');

function slugHospitalName(name) {
  const s = String(name || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 48);
  return s || 'hospital';
}

/**
 * Hospital/tenant id for the logged-in staff member.
 * Persists a missing hospitalId using HOSPITAL_ID env or hospitalName slug (legacy admins).
 */
async function resolveStaffHospitalId(userId) {
  if (!userId) return process.env.HOSPITAL_ID || null;
  const u = await User.findById(userId).select('hospitalId hospitalName role');
  if (u?.hospitalId) return u.hospitalId;

  let hid = process.env.HOSPITAL_ID || null;
  if (!hid && u?.hospitalName && ['hospital_admin', 'doctor'].includes(u.role)) {
    hid = slugHospitalName(u.hospitalName);
  }
  if (hid && u && ['hospital_admin', 'doctor'].includes(u.role)) {
    await User.findByIdAndUpdate(userId, { $set: { hospitalId: hid } });
  }
  return hid;
}

/**
 * Patients visible to this installation / hospital admin.
 * Includes legacy patients with no hospitalId so existing demo data still appears.
 */
function buildPatientMatch(hospitalId) {
  const roleQ = { role: { $in: ['patient', undefined] } };
  if (!hospitalId) return roleQ;
  return {
    ...roleQ,
    $or: [{ hospitalId }, { hospitalId: null }, { hospitalId: '' }, { hospitalId: { $exists: false } }],
  };
}

async function getScopedPatientObjectIds(hospitalId) {
  const q = buildPatientMatch(hospitalId);
  return User.find(q).distinct('_id');
}

module.exports = {
  resolveStaffHospitalId,
  buildPatientMatch,
  getScopedPatientObjectIds,
};
