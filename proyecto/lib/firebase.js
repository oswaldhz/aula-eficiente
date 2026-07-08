const admin = require("firebase-admin");

let firebaseError = null;
let db = null;

try {
  if (!admin.apps.length) {
    const key = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    const cred = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: key,
    });
    admin.initializeApp({ credential: cred, databaseURL: process.env.FIREBASE_DATABASE_URL });
  }
  db = admin.database();
  firebaseError = null;
} catch (e) {
  firebaseError = e?.message || String(e);
  db = null;
}

module.exports = { admin, db, isFirebaseReady: () => db !== null, getFirebaseError: () => firebaseError };
