const { Router } = require("express");
const { db } = require("../../lib/firebase");
const { snapshotToArray, snapshotToObject, asyncHandler } = require("../middleware/auth");

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
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
}));

router.get("/:periodId", asyncHandler(async (req, res) => {
  const snap = await db.ref("periods").child(req.params.periodId).once("value");
  const period = snapshotToObject(snap);
  if (!period) return res.status(404).json({ error: "Periodo no encontrado" });
  if (period.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });

  const clsSnap = await db.ref("classrooms").orderByChild("period_id").equalTo(req.params.periodId).once("value");
  res.json(snapshotToArray(clsSnap));
}));

router.post("/", asyncHandler(async (req, res) => {
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
}));

router.put("/:id", asyncHandler(async (req, res) => {
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
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const snap = await db.ref(`classrooms/${req.params.id}`).once("value");
  const cls = snapshotToObject(snap);
  if (!cls) return res.status(404).json({ error: "Classroom not found" });
  if (cls.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });
  await db.ref(`classrooms/${req.params.id}`).remove();
  res.json({ id: req.params.id, message: "Classroom deleted" });
}));

module.exports = router;
