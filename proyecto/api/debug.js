const { createClerkClient } = require("@clerk/backend");

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || "",
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY || "",
});

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const info = {
    env: {
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? `set (len=${process.env.CLERK_SECRET_KEY.length})` : "NOT SET",
      CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ? `set (len=${process.env.CLERK_PUBLISHABLE_KEY.length})` : "NOT SET",
      CLERK_CLIENT_ID: process.env.CLERK_CLIENT_ID ? `set (len=${process.env.CLERK_CLIENT_ID.length})` : "NOT SET",
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "set" : "NOT SET",
      FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL ? "set" : "NOT SET",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "set" : "NOT SET",
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? `set (len=${process.env.FIREBASE_PRIVATE_KEY.length})` : "NOT SET",
    },
    node: process.version,
  };

  // test verifyToken if a token is provided
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const decoded = await clerkClient.verifyToken(token);
      info.verifyResult = { sub: decoded.sub };
      info.verifyError = null;
    } catch (e) {
      info.verifyResult = null;
      info.verifyError = e?.errors || e?.message || String(e);
    }

    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        info.jwtPayload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
      }
    } catch (e) {
      info.jwtDecodeError = e.message;
    }
  }

  res.status(200).json(info);
};
