import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find session using mongoose + populate userId
    const session = await Session.findOne({ token }).populate("userId");
    console.log("SESSION FOUND:", session);
    console.log("POPULATED USER:", session?.userId);

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Session expired" });
    }

    // session.userId contains the actual User object
    req.user = session.userId;

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Invalid token" });
  }
};
