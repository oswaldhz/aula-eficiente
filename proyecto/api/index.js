const express = require("express");
const cors = require("cors");
const { Webhook } = require("svix");
const { createClerkClient, verifyToken } = require("@clerk/backend");
const { admin, db, isFirebaseReady, getFirebaseError } = require("../lib/firebase");
const multer = require("multer");

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

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.post("/api/clerk-webhook", async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString("utf-8");

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");
    const evt = wh.verify(rawBody, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const eventType = evt.type;
    const userData = evt.data;

    if (eventType === "user.created" || eventType === "user.updated") {
      const clerkUserId = userData.id;
      const email = userData.email_addresses?.[0]?.email_address || userData.email;
      const firstName = userData.first_name || "";
      const lastName = userData.last_name || "";
      const fullName = userData.full_name || `${firstName} ${lastName}`.trim() || email?.split("@")[0] || "";

      const teacherRef = db.ref(`teachers/${clerkUserId}`);
      const existing = await teacherRef.once("value");

      if (!existing.val()) {
        await teacherRef.set({ email, name: fullName, first_name: firstName, last_name: lastName, profile_image_url: "" });
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (e) {
    res.status(401).json({ error: "Invalid webhook signature" });
  }
});

app.use(express.json({ limit: "10mb" }));

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

app.get("/api/debug-env", (req, res) => {
  res.json({
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? `set (len=${process.env.CLERK_SECRET_KEY.length})` : "NOT SET",
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ? `set (len=${process.env.CLERK_PUBLISHABLE_KEY.length})` : "NOT SET",
    CLERK_CLIENT_ID: process.env.CLERK_CLIENT_ID ? `set (len=${process.env.CLERK_CLIENT_ID.length})` : "NOT SET",
    VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY ? "set" : "NOT SET",
    NEXT_PUBLIC_CLERK: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "set" : "NOT SET",
    REACT_APP_CLERK_PK: process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ? "set" : "NOT SET",
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "set" : "NOT SET",
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL ? "set" : "NOT SET",
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "set" : "NOT SET",
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? `set (len=${process.env.FIREBASE_PRIVATE_KEY.length})` : "NOT SET",
    isFirebaseReady: isFirebaseReady(),
    dbIsNull: db === null,
    firebaseError: getFirebaseError(),
    dbUrl: (process.env.FIREBASE_DATABASE_URL || "").length > 0 ? process.env.FIREBASE_DATABASE_URL.slice(0, 40) : "EMPTY",
    node: process.version,
  });
});

app.get("/api/debug-auth", async (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.json({ error: "No Authorization header" });

  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  const parts = token.split(".");
  if (parts.length !== 3) return res.json({ error: "Not a valid JWT" });

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    let verifyResult = null, verifyError = null;
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        authorizedParties: ["https://aula-eficiente.vercel.app"],
      });
      verifyResult = { sub: payload.sub, email: payload.email };
    } catch (e) {
      verifyError = e?.errors ? JSON.stringify(e.errors) : e?.message || String(e);
    }
    return res.json({
      payload,
      azp: payload.azp,
      iss: payload.iss,
      verifyResult: verifyResult ? { sub: verifyResult.sub } : null,
      verifyError,
    });
  } catch (e) {
    return res.json({ error: e.message });
  }
});

app.post("/api/upload-profile-image", upload.single("file"), asyncHandler(async (req, res) => {
  const userId = await getTeacherIdFromToken(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!req.file) return res.status(400).json({ error: "No file provided" });
  try {
    const clerkForm = new FormData();
    clerkForm.append("file", new Blob([req.file.buffer], { type: "image/jpeg" }), "profile.jpg");
    const clerkResp = await fetch(
      `https://api.clerk.com/v1/users/${userId}/profile_image`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
        body: clerkForm,
      }
    );
    if (!clerkResp.ok) {
      const errText = await clerkResp.text();
      return res.status(clerkResp.status).json({ error: `Clerk API error: ${errText}` });
    }
    const data = await clerkResp.json();
    res.json({ imageUrl: data.image_url || data.profileImageUrl || data.imageUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
  res.json({
    message: "Usuario validado",
    name: req.teacher.name,
    id: req.teacher.id,
  });
});

app.get("/api/periods", async (req, res) => {
  try {
    const snap = await db.ref("periods").orderByChild("teacher_id").equalTo(req.teacherId).once("value");
    const periods = snapshotToArray(snap);
    res.json(periods);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/periods", async (req, res) => {
  try {
    const { name, year } = req.body;
    if (!name || year === undefined) {
      return res.status(400).json({ error: "Name and year are required" });
    }
    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedYear)) {
      return res.status(400).json({ error: "year must be an integer" });
    }
    const ref = db.ref("periods").push();
    await ref.set({ name, year: parsedYear, teacher_id: req.teacherId });
    res.status(201).json({ id: ref.key, message: "Periodo creado" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/periods/:periodId", async (req, res) => {
  try {
    const snap = await db.ref(`periods/${req.params.periodId}`).once("value");
    const period = snapshotToObject(snap);
    if (!period) return res.status(404).json({ error: "Periodo no encontrado" });
    if (period.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });
    res.json(period);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/periods/:periodId", async (req, res) => {
  try {
    const snap = await db.ref(`periods/${req.params.periodId}`).once("value");
    const period = snapshotToObject(snap);
    if (!period) return res.status(404).json({ error: "Periodo no encontrado" });
    if (period.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.year !== undefined) {
      const year = parseInt(req.body.year, 10);
      if (isNaN(year)) return res.status(400).json({ error: "year must be an integer" });
      updates.year = year;
    }
    if (req.body.teacher_id !== undefined && req.body.teacher_id !== req.teacherId) {
      return res.status(403).json({ error: "Forbidden: cannot change teacher_id" });
    }
    await db.ref(`periods/${req.params.periodId}`).update(updates);
    res.json({ id: req.params.periodId, message: "Periodo actualizado" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/periods/:periodId", async (req, res) => {
  try {
    const snap = await db.ref(`periods/${req.params.periodId}`).once("value");
    const period = snapshotToObject(snap);
    if (!period) return res.status(404).json({ error: "Periodo no encontrado" });
    if (period.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });
    await db.ref(`periods/${req.params.periodId}`).remove();
    res.json({ id: req.params.periodId, message: "Periodo eliminado" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/classrooms", async (req, res) => {
  try {
    const { period_id } = req.query;

    if (period_id) {
      const snap = await db.ref("periods").child(period_id).once("value");
      const period = snapshotToObject(snap);
      if (!period) return res.status(404).json({ error: "Periodo no encontrado" });
      if (period.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });

      const clsSnap = await db.ref("classrooms").orderByChild("period_id").equalTo(period_id).once("value");
      return res.json(snapshotToArray(clsSnap));
    }

    const periodsSnap = await db.ref("periods").orderByChild("teacher_id").equalTo(req.teacherId).once("value");
    const periods = snapshotToArray(periodsSnap);
    if (periods.length === 0) return res.json([]);

    periods.sort((a, b) => b.id.localeCompare(a.id));
    const latestPeriodId = periods[0].id;

    const clsSnap = await db.ref("classrooms").orderByChild("period_id").equalTo(latestPeriodId).once("value");
    res.json(snapshotToArray(clsSnap));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/classrooms/:periodId", async (req, res) => {
  try {
    const snap = await db.ref("periods").child(req.params.periodId).once("value");
    const period = snapshotToObject(snap);
    if (!period) return res.status(404).json({ error: "Periodo no encontrado" });
    if (period.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });

    const clsSnap = await db.ref("classrooms").orderByChild("period_id").equalTo(req.params.periodId).once("value");
    res.json(snapshotToArray(clsSnap));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/classrooms", async (req, res) => {
  try {
    const { name, description, period_id } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    let targetPeriodId = period_id;
    if (!targetPeriodId) {
      const periodsSnap = await db.ref("periods").orderByChild("teacher_id").equalTo(req.teacherId).once("value");
      const periods = snapshotToArray(periodsSnap);
      periods.sort((a, b) => b.id.localeCompare(a.id));
      if (periods.length === 0) return res.status(400).json({ error: "No period found" });
      targetPeriodId = periods[0].id;
    } else {
      const periodSnap = await db.ref(`periods/${targetPeriodId}`).once("value");
      const period = snapshotToObject(periodSnap);
      if (!period) return res.status(404).json({ error: "Periodo no encontrado" });
      if (period.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });
    }

    const ref = db.ref("classrooms").push();
    await ref.set({ name, description: description || "", teacher_id: req.teacherId, period_id: targetPeriodId });
    res.status(201).json({ id: ref.key, name, description: description || "", teacher_id: req.teacherId, period_id: targetPeriodId, message: "Classroom created" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/classrooms/:id", async (req, res) => {
  try {
    const snap = await db.ref(`classrooms/${req.params.id}`).once("value");
    const cls = snapshotToObject(snap);
    if (!cls) return res.status(404).json({ error: "Classroom not found" });
    if (cls.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });

    if (req.body.name !== undefined && !String(req.body.name).trim()) {
      return res.status(400).json({ error: "name cannot be empty" });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.period_id !== undefined) {
      const periodSnap = await db.ref(`periods/${req.body.period_id}`).once("value");
      const period = snapshotToObject(periodSnap);
      if (!period) return res.status(404).json({ error: "Periodo no encontrado" });
      if (period.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });
      updates.period_id = req.body.period_id;
    }
    await db.ref(`classrooms/${req.params.id}`).update(updates);
    const updated = await db.ref(`classrooms/${req.params.id}`).once("value");
    res.json({ id: req.params.id, ...updated.val(), message: "Classroom updated" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/classrooms/:id", async (req, res) => {
  try {
    const snap = await db.ref(`classrooms/${req.params.id}`).once("value");
    const cls = snapshotToObject(snap);
    if (!cls) return res.status(404).json({ error: "Classroom not found" });
    if (cls.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });
    await db.ref(`classrooms/${req.params.id}`).remove();
    res.json({ id: req.params.id, message: "Classroom deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/students", async (req, res) => {
  try {
    const { period_id, classroom_id } = req.query;
    const allSnap = await db.ref("students").once("value");
    let students = snapshotToArray(allSnap);

    if (classroom_id) {
      students = students.filter(s => s.classroom_id === classroom_id);
    }

    if (period_id) {
      const clsSnap = await db.ref("classrooms").orderByChild("period_id").equalTo(period_id).once("value");
      const clsIds = new Set(snapshotToArray(clsSnap).map(c => c.id));
      students = students.filter(s => clsIds.has(s.classroom_id));
    }

    res.json(students);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const { name, identifier, classroom_id } = req.body;
    if (!name || !identifier) {
      return res.status(400).json({ error: "Name and identifier are required" });
    }
    const ref = db.ref("students").push();
    await ref.set({ name, identifier, classroom_id: classroom_id || "" });
    res.status(201).json({ id: ref.key, message: "Student created" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/students/bulk", async (req, res) => {
  try {
    const { students: studentsData, classroom_id } = req.body;
    if (!studentsData || !Array.isArray(studentsData) || studentsData.length === 0) {
      return res.status(400).json({ error: "No students provided" });
    }

    const created = [];
    const errors = [];
    const existingSnap = await db.ref("students").once("value");
    const existingStudents = snapshotToArray(existingSnap);
    const existingIdentifiers = new Set(existingStudents.map(s => s.identifier));

    for (let i = 0; i < studentsData.length; i++) {
      const name = (studentsData[i].name || "").trim();
      const identifier = (studentsData[i].identifier || "").trim();
      if (!name || !identifier) {
        errors.push({ row: i + 1, error: "Name and identifier are required" });
        continue;
      }
      if (existingIdentifiers.has(identifier)) {
        errors.push({ row: i + 1, error: `Duplicate identifier '${identifier}'` });
        continue;
      }
      const ref = db.ref("students").push();
      await ref.set({ name, identifier, classroom_id: classroom_id || "" });
      existingIdentifiers.add(identifier);
      created.push({ name, identifier });
    }

    res.status(201).json({ created: created.length, errors });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const snap = await db.ref(`students/${req.params.id}`).once("value");
    if (!snap.val()) return res.status(404).json({ error: "Student not found" });

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.identifier !== undefined) updates.identifier = req.body.identifier;
    if (req.body.classroom_id !== undefined) updates.classroom_id = req.body.classroom_id;
    await db.ref(`students/${req.params.id}`).update(updates);
    res.json({ message: "Student updated" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const snap = await db.ref(`students/${req.params.id}`).once("value");
    if (!snap.val()) return res.status(404).json({ error: "Student not found" });
    await db.ref(`students/${req.params.id}`).remove();
    res.json({ message: "Student deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/activities", async (req, res) => {
  try {
    const { period_id, classroom_id } = req.query;
    const allSnap = await db.ref("activities").once("value");
    let activities = snapshotToArray(allSnap);

    if (classroom_id) {
      activities = activities.filter(a => a.classroom_id === classroom_id);
    }

    if (period_id) {
      const clsSnap = await db.ref("classrooms").orderByChild("period_id").equalTo(period_id).once("value");
      const clsIds = new Set(snapshotToArray(clsSnap).map(c => c.id));
      activities = activities.filter(a => clsIds.has(a.classroom_id));
    }

    res.json(activities);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/activities", async (req, res) => {
  try {
    const { title, description, due_date, max_score, classroom_id } = req.body;
    if (!title || max_score === undefined || !due_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const ref = db.ref("activities").push();
    await ref.set({
      title,
      description: description || "",
      due_date,
      max_score: parseFloat(max_score),
      classroom_id: classroom_id || "",
    });
    res.status(201).json({ id: ref.key, message: "Activity created" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/activities/:id", async (req, res) => {
  try {
    const snap = await db.ref(`activities/${req.params.id}`).once("value");
    if (!snap.val()) return res.status(404).json({ error: "Activity not found" });

    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.due_date !== undefined) updates.due_date = req.body.due_date;
    if (req.body.max_score !== undefined) updates.max_score = parseFloat(req.body.max_score);
    if (req.body.classroom_id !== undefined) updates.classroom_id = req.body.classroom_id;
    await db.ref(`activities/${req.params.id}`).update(updates);
    res.json({ id: req.params.id, message: "Activity updated" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/activities/:id", async (req, res) => {
  try {
    const snap = await db.ref(`activities/${req.params.id}`).once("value");
    if (!snap.val()) return res.status(404).json({ error: "Activity not found" });
    await db.ref(`activities/${req.params.id}`).remove();
    res.json({ message: "Activity deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/grades", async (req, res) => {
  try {
    const { period_id, activity_id } = req.query;
    const allSnap = await db.ref("grades").once("value");
    let grades = snapshotToArray(allSnap);

    if (activity_id) {
      grades = grades.filter(g => g.activity_id === activity_id);
    }

    if (period_id) {
      const actSnap = await db.ref("activities").once("value");
      const activities = snapshotToArray(actSnap);
      const clsSnap = await db.ref("classrooms").orderByChild("period_id").equalTo(period_id).once("value");
      const clsIds = new Set(snapshotToArray(clsSnap).map(c => c.id));
      const actIds = new Set(activities.filter(a => clsIds.has(a.classroom_id)).map(a => a.id));
      grades = grades.filter(g => actIds.has(g.activity_id));
    }

    res.json(grades);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/grades", async (req, res) => {
  try {
    const { student_id, activity_id, score } = req.body;
    if (!student_id || !activity_id || score === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const actSnap = await db.ref(`activities/${activity_id}`).once("value");
    const activity = snapshotToObject(actSnap);
    if (!activity) return res.status(404).json({ error: "Activity not found" });

    const parsedScore = parseFloat(score);
    if (parsedScore > parseFloat(activity.max_score)) {
      return res.status(400).json({ error: `Score cannot exceed ${activity.max_score}` });
    }

    const allGradesSnap = await db.ref("grades").once("value");
    const allGrades = snapshotToArray(allGradesSnap);
    const existing = allGrades.find(g => g.student_id === student_id && g.activity_id === activity_id);

    if (existing) {
      await db.ref(`grades/${existing.id}`).update({ score: parsedScore });
      return res.json({ id: existing.id, score: parsedScore, student_id, activity_id, message: "Grade updated (was existing)" });
    }

    const ref = db.ref("grades").push();
    await ref.set({ student_id, activity_id, score: parsedScore, submission_date: "" });
    res.status(201).json({ id: ref.key, score: parsedScore, student_id, activity_id, message: "Grade created" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/grades/:id", async (req, res) => {
  try {
    const snap = await db.ref(`grades/${req.params.id}`).once("value");
    const grade = snapshotToObject(snap);
    if (!grade) return res.status(404).json({ error: "Grade not found" });

    const activityId = req.body.activity_id || grade.activity_id;
    const actSnap = await db.ref(`activities/${activityId}`).once("value");
    const activity = snapshotToObject(actSnap);
    if (!activity) return res.status(404).json({ error: "Activity not found" });

    const newScore = req.body.score !== undefined ? parseFloat(req.body.score) : grade.score;
    if (newScore > parseFloat(activity.max_score)) {
      return res.status(400).json({ error: `Score cannot exceed ${activity.max_score}` });
    }

    await db.ref(`grades/${req.params.id}`).update({
      score: newScore,
      student_id: req.body.student_id || grade.student_id,
      activity_id: activityId,
      submission_date: req.body.submission_date || grade.submission_date || "",
    });
    res.json({ id: req.params.id, score: newScore, student_id: req.body.student_id || grade.student_id, activity_id: activityId, message: "Grade updated" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/grades/:id", async (req, res) => {
  try {
    const snap = await db.ref(`grades/${req.params.id}`).once("value");
    if (!snap.val()) return res.status(404).json({ error: "Grade not found" });
    await db.ref(`grades/${req.params.id}`).remove();
    res.json({ message: "Grade deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/teachers/profile", async (req, res) => {
  try {
    const snap = await db.ref(`teachers/${req.teacherId}`).once("value");
    const teacher = snap.val();
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    res.json({ id: req.teacherId, ...teacher });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/teachers/profile", async (req, res) => {
  try {
    const updates = {};
    if (req.body.first_name !== undefined) updates.first_name = req.body.first_name;
    if (req.body.last_name !== undefined) updates.last_name = req.body.last_name;
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.profile_image_url !== undefined) updates.profile_image_url = req.body.profile_image_url;
    await db.ref(`teachers/${req.teacherId}`).update(updates);
    const snap = await db.ref(`teachers/${req.teacherId}`).once("value");
    res.json({ id: req.teacherId, ...snap.val() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
