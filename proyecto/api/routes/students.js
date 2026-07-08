const { Router } = require("express");
const { db } = require("../../lib/firebase");
const { snapshotToArray, asyncHandler } = require("../middleware/auth");

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { period_id, classroom_id } = req.query;
  const snap = await db.ref("students").orderByChild("teacher_id").equalTo(req.teacherId).once("value");
  let students = snapshotToArray(snap);

  if (classroom_id) {
    students = students.filter(s => s.classroom_id === classroom_id);
  }

  if (period_id) {
    const clsSnap = await db.ref("classrooms").orderByChild("period_id").equalTo(period_id).once("value");
    const clsIds = new Set(snapshotToArray(clsSnap).map(c => c.id));
    students = students.filter(s => clsIds.has(s.classroom_id));
  }

  res.json(students);
}));

router.post("/", asyncHandler(async (req, res) => {
  const { name, identifier, classroom_id } = req.body;
  if (!name || !identifier) {
    return res.status(400).json({ error: "Name and identifier are required" });
  }
  const ref = db.ref("students").push();
  await ref.set({ name, identifier, classroom_id: classroom_id || "", teacher_id: req.teacherId });
  res.status(201).json({ id: ref.key, message: "Student created" });
}));

router.post("/bulk", asyncHandler(async (req, res) => {
  const { students: studentsData, classroom_id } = req.body;
  if (!studentsData || !Array.isArray(studentsData) || studentsData.length === 0) {
    return res.status(400).json({ error: "No students provided" });
  }

  const created = [];
  const errors = [];
  const existingSnap = await db.ref("students").orderByChild("teacher_id").equalTo(req.teacherId).once("value");
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
    await ref.set({ name, identifier, classroom_id: classroom_id || "", teacher_id: req.teacherId });
    existingIdentifiers.add(identifier);
    created.push({ name, identifier });
  }

  res.status(201).json({ created: created.length, errors });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const snap = await db.ref(`students/${req.params.id}`).once("value");
  if (!snap.val()) return res.status(404).json({ error: "Student not found" });
  if (snap.val().teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });

  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.identifier !== undefined) updates.identifier = req.body.identifier;
  if (req.body.classroom_id !== undefined) updates.classroom_id = req.body.classroom_id;
  await db.ref(`students/${req.params.id}`).update(updates);
  res.json({ message: "Student updated" });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const snap = await db.ref(`students/${req.params.id}`).once("value");
  if (!snap.val()) return res.status(404).json({ error: "Student not found" });
  if (snap.val().teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });
  await db.ref(`students/${req.params.id}`).remove();
  res.json({ message: "Student deleted" });
}));

module.exports = router;
