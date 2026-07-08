const express = require("express");
const cors = require("cors");
const { createClerkClient } = require("@clerk/backend");
const { db, isFirebaseReady } = require("../lib/firebase");
const multer = require("multer");
const { asyncHandler, getTeacherIdFromToken, ensureTeacherExists } = require("./middleware/auth");
const { validateEnv } = require("./lib/env");

const missing = validateEnv();
if (missing.length > 0) {
  console.warn("Missing required environment variables:\n  - " + missing.join("\n  - "));
}

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const clerkPk = process.env.CLERK_PUBLISHABLE_KEY || process.env.CLERK_CLIENT_ID || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY || "";
let clerkClient;
try {
  clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY || "",
    publishableKey: clerkPk,
  });
} catch (e) {
  console.error("Failed to create Clerk client:", e);
  clerkClient = null;
}

app.use(cors({ origin: true, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));

app.use(express.json({ limit: "10mb" }));

if (process.env.NODE_ENV !== "production") {
  const { verifyToken } = require("@clerk/backend");
  app.get("/api/debug-env", (req, res) => {
    res.json({
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? `set (len=${process.env.CLERK_SECRET_KEY.length})` : "NOT SET",
      CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ? `set (len=${process.env.CLERK_PUBLISHABLE_KEY.length})` : "NOT SET",
      CLERK_CLIENT_ID: process.env.CLERK_CLIENT_ID ? `set (len=${process.env.CLERK_CLIENT_ID.length})` : "NOT SET",
      VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY ? "set" : "NOT SET",
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "set" : "NOT SET",
      FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL ? "set" : "NOT SET",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "set" : "NOT SET",
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? `set (len=${process.env.FIREBASE_PRIVATE_KEY.length})` : "NOT SET",
      isFirebaseReady: isFirebaseReady(),
      node: process.version,
    });
  });

  app.get("/api/debug-auth", async (req, res) => {
    const header = req.headers.authorization;
    if (!header) return res.json({ error: "No Authorization header" });
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        authorizedParties: ["https://aula-eficiente.vercel.app"],
      });
      return res.json({ sub: payload.sub, email: payload.email, azp: payload.azp, iss: payload.iss });
    } catch (e) {
      return res.json({ error: e?.errors ? JSON.stringify(e.errors) : e?.message || String(e) });
    }
  });
}

app.post("/api/upload-profile-image", upload.single("file"), asyncHandler(async (req, res) => {
  const userId = await getTeacherIdFromToken(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!req.file) return res.status(400).json({ error: "No file provided" });
  const clerkForm = new FormData();
  clerkForm.append("file", new Blob([req.file.buffer], { type: "image/jpeg" }), "profile.jpg");
  const clerkResp = await fetch(`https://api.clerk.com/v1/users/${userId}/profile_image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    body: clerkForm,
  });
  if (!clerkResp.ok) {
    const errText = await clerkResp.text();
    return res.status(clerkResp.status).json({ error: `Clerk API error: ${errText}` });
  }
  const data = await clerkResp.json();
  res.json({ imageUrl: data.image_url || data.profileImageUrl || data.imageUrl });
}));

app.use(asyncHandler(async (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  if (req.path === "/api/clerk-webhook") return next();
  if (!isFirebaseReady()) {
    return res.status(500).json({ error: "Firebase not initialized" });
  }
  const clerkUserId = await getTeacherIdFromToken(req);
  if (!clerkUserId) {
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
  const teacher = await ensureTeacherExists(clerkUserId);
  req.teacher = teacher;
  req.teacherId = clerkUserId;
  next();
}));

app.get("/api/test-teacher", (req, res) => {
  res.json({ message: "Usuario validado", name: req.teacher.name, id: req.teacher.id });
});

app.use("/api/periods", require("./routes/periods"));
app.use("/api/classrooms", require("./routes/classrooms"));
app.use("/api/students", require("./routes/students"));
app.use("/api/activities", require("./routes/activities"));
app.use("/api/grades", require("./routes/grades"));
app.use("/api/teachers", require("./routes/teachers"));
app.use("/api", require("./routes/webhooks"));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err?.stack || err?.message || err);
  res.status(500).json({ error: err?.message || "Internal server error", _type: err?.constructor?.name });
});

app.all("*", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

module.exports = app;
