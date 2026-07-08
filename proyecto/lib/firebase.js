const admin = require("firebase-admin");

let db = null;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  db = admin.database();
  console.log("Firebase initialized successfully");
} catch (e) {
  console.error("Firebase init error:", e?.message || e);
  db = null;
}

module.exports = { admin, db, isFirebaseReady: () => db !== null };
