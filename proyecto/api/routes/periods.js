const { Router } = require("express");
const { db } = require("../../lib/firebase");
const { snapshotToArray, snapshotToObject, asyncHandler } = require("../middleware/auth");

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const snap = await db.ref("periods").orderByChild("teacher_id").equalTo(req.teacherId).once("value");
  res.json(snapshotToArray(snap));
}));

router.post("/", asyncHandler(async (req, res) => {
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
}));

router.get("/:periodId", asyncHandler(async (req, res) => {
  const snap = await db.ref(`periods/${req.params.periodId}`).once("value");
  const period = snapshotToObject(snap);
  if (!period) return res.status(404).json({ error: "Periodo no encontrado" });
  if (period.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });
  res.json(period);
}));

router.put("/:periodId", asyncHandler(async (req, res) => {
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
}));

router.delete("/:periodId", asyncHandler(async (req, res) => {
  const snap = await db.ref(`periods/${req.params.periodId}`).once("value");
  const period = snapshotToObject(snap);
  if (!period) return res.status(404).json({ error: "Periodo no encontrado" });
  if (period.teacher_id !== req.teacherId) return res.status(403).json({ error: "Forbidden" });

  const classroomSnap = await db.ref("classrooms").orderByChild("period_id").equalTo(req.params.periodId).once("value");
  const classrooms = snapshotToArray(classroomSnap);
  const ops = [];

  for (const cls of classrooms) {
    const [studentSnap, activitySnap] = await Promise.all([
      db.ref("students").orderByChild("classroom_id").equalTo(cls.id).once("value"),
      db.ref("activities").orderByChild("classroom_id").equalTo(cls.id).once("value"),
    ]);
    const students = snapshotToArray(studentSnap);
    const activities = snapshotToArray(activitySnap);

    for (const stu of students) ops.push(db.ref(`students/${stu.id}`).remove());
    for (const act of activities) {
      const gradeSnap = await db.ref("grades").orderByChild("activity_id").equalTo(act.id).once("value");
      const grades = snapshotToArray(gradeSnap);
      for (const g of grades) ops.push(db.ref(`grades/${g.id}`).remove());
      ops.push(db.ref(`activities/${act.id}`).remove());
    }
    ops.push(db.ref(`classrooms/${cls.id}`).remove());
  }

  ops.push(db.ref(`periods/${req.params.periodId}`).remove());
  await Promise.all(ops);
  res.json({ id: req.params.periodId, message: "Periodo y datos asociados eliminados" });
}));

module.exports = router;
