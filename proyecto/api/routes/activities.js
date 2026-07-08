const { Router } = require("express");
const { db } = require("../../lib/firebase");
const { snapshotToArray, asyncHandler } = require("../middleware/auth");

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { period_id, classroom_id } = req.query;
  const snap = await db.ref("activities").orderByChild("teacher_id").equalTo(req.teacherId).once("value");
  let activities = snapshotToArray(snap);

  if (classroom_id) {
    activities = activities.filter(a => a.classroom_id === classroom_id);
  }

  if (period_id) {
    const clsSnap = await db.ref("classrooms").orderByChild("period_id").equalTo(period_id).once("value");
    const clsIds = new Set(snapshotToArray(clsSnap).map(c => c.id));
    activities = activities.filter(a => clsIds.has(a.classroom_id));
  }

  res.json(activities);
}));

router.post("/", asyncHandler(async (req, res) => {
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
    teacher_id: req.teacherId,
  });
  res.status(201).json({ id: ref.key, message: "Activity created" });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const snap = await db.ref(`activities/${req.params.id}`).once("value");
  if (!snap.val()) return res.status(404).json({ error: "Activity not found" });
  if (snap.val().teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });

  const updates = {};
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.due_date !== undefined) updates.due_date = req.body.due_date;
  if (req.body.max_score !== undefined) updates.max_score = parseFloat(req.body.max_score);
  if (req.body.classroom_id !== undefined) updates.classroom_id = req.body.classroom_id;
  await db.ref(`activities/${req.params.id}`).update(updates);
  res.json({ id: req.params.id, message: "Activity updated" });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const snap = await db.ref(`activities/${req.params.id}`).once("value");
  if (!snap.val()) return res.status(404).json({ error: "Activity not found" });
  if (snap.val().teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });
  await db.ref(`activities/${req.params.id}`).remove();
  res.json({ message: "Activity deleted" });
}));

module.exports = router;
