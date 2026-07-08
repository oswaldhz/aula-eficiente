const { verifyToken } = require("@clerk/backend");
const { db } = require("../../lib/firebase");

function snapshotToArray(snapshot) {
  const val = snapshot.val();
  if (!val) return [];
  return Object.entries(val).map(([id, data]) => ({ id, ...data }));
}

function snapshotToObject(snapshot) {
  const val = snapshot.val();
  if (!val) return null;
  return { id: snapshot.key, ...val };
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function getTeacherIdFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: ["https://aula-eficiente.vercel.app"],
    });
    return payload.sub;
  } catch (e) {
    console.error("Clerk verifyToken error:", e?.errors || e?.message || e);
    return null;
  }
}

async function ensureTeacherExists(clerkUserId) {
  const teacherRef = db.ref(`teachers/${clerkUserId}`);
  const snap = await teacherRef.once("value");
  if (!snap.val()) {
    await teacherRef.set({
      email: "",
      name: "",
      first_name: "",
      last_name: "",
      profile_image_url: "",
    });
  }
  const teacherSnap = await teacherRef.once("value");
  return { id: clerkUserId, ...teacherSnap.val() };
}

module.exports = { snapshotToArray, snapshotToObject, asyncHandler, getTeacherIdFromToken, ensureTeacherExists };
