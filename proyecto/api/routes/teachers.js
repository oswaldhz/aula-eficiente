const { Router } = require("express");
const { db } = require("../../lib/firebase");
const { asyncHandler } = require("../middleware/auth");

const router = Router();

router.get("/profile", asyncHandler(async (req, res) => {
  const snap = await db.ref(`teachers/${req.teacherId}`).once("value");
  const teacher = snap.val();
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });
  res.json({ id: req.teacherId, ...teacher });
}));

router.put("/profile", asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.first_name !== undefined) updates.first_name = req.body.first_name;
  if (req.body.last_name !== undefined) updates.last_name = req.body.last_name;
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.profile_image_url !== undefined) updates.profile_image_url = req.body.profile_image_url;
  await db.ref(`teachers/${req.teacherId}`).update(updates);
  const snap = await db.ref(`teachers/${req.teacherId}`).once("value");
  res.json({ id: req.teacherId, ...snap.val() });
}));

module.exports = router;
