const { Router } = require("express");
const { db } = require("../../lib/firebase");
const { snapshotToArray, snapshotToObject, asyncHandler } = require("../middleware/auth");

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { period_id, activity_id } = req.query;
  const snap = await db.ref("grades").orderByChild("teacher_id").equalTo(req.teacherId).once("value");
  let grades = snapshotToArray(snap);

  if (activity_id) {
    grades = grades.filter(g => g.activity_id === activity_id);
  }

  if (period_id) {
    const actSnap = await db.ref("activities").orderByChild("teacher_id").equalTo(req.teacherId).once("value");
    const activities = snapshotToArray(actSnap);
    const clsSnap = await db.ref("classrooms").orderByChild("period_id").equalTo(period_id).once("value");
    const clsIds = new Set(snapshotToArray(clsSnap).map(c => c.id));
    const actIds = new Set(activities.filter(a => clsIds.has(a.classroom_id)).map(a => a.id));
    grades = grades.filter(g => actIds.has(g.activity_id));
  }

  res.json(grades);
}));

router.post("/", asyncHandler(async (req, res) => {
  const { student_id, activity_id, score } = req.body;
  if (!student_id || !activity_id || score === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const actSnap = await db.ref(`activities/${activity_id}`).once("value");
  const activity = snapshotToObject(actSnap);
  if (!activity) return res.status(404).json({ error: "Activity not found" });
  if (activity.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });

  const parsedScore = parseFloat(score);
  if (parsedScore > parseFloat(activity.max_score)) {
    return res.status(400).json({ error: `Score cannot exceed ${activity.max_score}` });
  }

  const gradeId = `${activity_id}_${student_id}`;
  const existingSnap = await db.ref(`grades/${gradeId}`).once("value");
  const existing = existingSnap.val();

  if (existing) {
    await db.ref(`grades/${gradeId}`).update({ score: parsedScore, teacher_id: req.teacherId });
    return res.json({ id: gradeId, score: parsedScore, student_id, activity_id, message: "Grade updated (was existing)" });
  }

  await db.ref(`grades/${gradeId}`).set({ student_id, activity_id, score: parsedScore, teacher_id: req.teacherId, submission_date: "" });
  res.status(201).json({ id: gradeId, score: parsedScore, student_id, activity_id, message: "Grade created" });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const snap = await db.ref(`grades/${req.params.id}`).once("value");
  const grade = snapshotToObject(snap);
  if (!grade) return res.status(404).json({ error: "Grade not found" });
  if (grade.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });

  const activityId = req.body.activity_id || grade.activity_id;
  const actSnap = await db.ref(`activities/${activityId}`).once("value");
  const activity = snapshotToObject(actSnap);
  if (!activity) return res.status(404).json({ error: "Activity not found" });
  if (activity.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });

  const newScore = req.body.score !== undefined ? parseFloat(req.body.score) : grade.score;
  if (newScore > parseFloat(activity.max_score)) {
    return res.status(400).json({ error: `Score cannot exceed ${activity.max_score}` });
  }

  await db.ref(`grades/${req.params.id}`).update({
    score: newScore,
    student_id: req.body.student_id || grade.student_id,
    activity_id: activityId,
    teacher_id: req.teacherId,
    submission_date: req.body.submission_date || grade.submission_date || "",
  });
  res.json({ id: req.params.id, score: newScore, student_id: req.body.student_id || grade.student_id, activity_id: activityId, message: "Grade updated" });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const snap = await db.ref(`grades/${req.params.id}`).once("value");
  if (!snap.val()) return res.status(404).json({ error: "Grade not found" });
  if (snap.val().teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });
  await db.ref(`grades/${req.params.id}`).remove();
  res.json({ message: "Grade deleted" });
}));

module.exports = router;
