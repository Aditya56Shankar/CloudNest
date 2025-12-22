import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Account from "../models/Account.js";
import Session from "../models/Session.js";

const router = express.Router();

// --------------------- SIGNUP ---------------------
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await User.create({
      name,
      email,
      emailVerified: false,
    });

    // Create Account (Credentials provider)
    await Account.create({
      accountId: Math.random().toString(36).substring(2, 9),
      providerId: "credentials",
      userId: user._id,
      password: hashedPassword,
    });

    // Create JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Create session
    await Session.create({
      token,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// --------------------- SIGNIN ---------------------
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user + account for credentials provider
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const account = await Account.findOne({
      userId: user._id,
      providerId: "credentials",
    });

    if (!account) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isValid = await bcrypt.compare(password, account.password);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Create session
    await Session.create({
      token,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to sign in" });
  }
});

export default router;
