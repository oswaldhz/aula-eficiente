const REQUIRED = [
  ["CLERK_SECRET_KEY", "Clerk API secret key"],
  ["CLERK_PUBLISHABLE_KEY", "Clerk publishable key (or VITE_CLERK_PUBLISHABLE_KEY)"],
  ["FIREBASE_PROJECT_ID", "Firebase project ID"],
  ["FIREBASE_DATABASE_URL", "Firebase Realtime Database URL"],
  ["FIREBASE_CLIENT_EMAIL", "Firebase service account client email"],
  ["FIREBASE_PRIVATE_KEY", "Firebase service account private key"],
];

const OPTIONAL = [
  ["CLERK_WEBHOOK_SECRET", "Clerk webhook signing secret"],
  ["PORT", "Server port (default: 3000)"],
];

function validateEnv() {
  const missing = [];
  for (const [key, label] of REQUIRED) {
    const val = process.env[key];
    if (!val || val === "test") {
      missing.push(`${key} (${label})`);
    }
  }
  return missing;
}

function getFirebasePrivateKey() {
  return (process.env.FIREBASE_PRIVATE_KEY || "").replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
}

function getClerkPublishableKey() {
  return process.env.CLERK_PUBLISHABLE_KEY || process.env.CLERK_CLIENT_ID || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY || "";
}

module.exports = { validateEnv, getFirebasePrivateKey, getClerkPublishableKey, REQUIRED, OPTIONAL };
