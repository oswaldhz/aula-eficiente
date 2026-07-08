const admin = require("firebase-admin");
const { getFirebasePrivateKey } = require("../api/lib/env");

let firebaseError = null;
let db = null;

try {
  if (!admin.apps.length) {
    const key = getFirebasePrivateKey();
    const dbUrl = (process.env.FIREBASE_DATABASE_URL || "").replace(/^["']|["']$/g, "");
    const projectId = (process.env.FIREBASE_PROJECT_ID || "").replace(/^["']|["']$/g, "");
    const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").replace(/^["']|["']$/g, "");
    const cred = admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: key,
    });
    admin.initializeApp({ credential: cred, databaseURL: dbUrl });
  }
  db = admin.database();
  firebaseError = null;
} catch (e) {
  firebaseError = e?.message || String(e);
  db = null;
}

module.exports = { admin, db, isFirebaseReady: () => db !== null, getFirebaseError: () => firebaseError };
