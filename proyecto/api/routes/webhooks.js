const { Router } = require("express");
const { Webhook } = require("svix");
const { db } = require("../../lib/firebase");

const router = Router();

router.post("/clerk-webhook", async (req, res) => {
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

module.exports = router;
