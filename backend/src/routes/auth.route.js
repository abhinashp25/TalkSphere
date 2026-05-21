import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import {
  signup, login, logout, updateProfile,
  updatePrivacy, toggle2FA, verify2FALogin,
  firebaseSync
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
router.use(arcjetProtection);

router.post("/firebase-sync",  firebaseSync);
router.post("/signup",         signup);
router.post("/login",          login);
router.post("/logout",         logout);
router.post("/2fa/verify",     verify2FALogin);
router.post("/2fa/toggle",     protectRoute, toggle2FA);
router.put("/update-profile",  protectRoute, updateProfile);
router.patch("/privacy",       protectRoute, updatePrivacy);

// We manually check JWT here to avoid returning a 401 error code, 
// which clutters the Chrome/Firefox console on startup when not logged in.
router.get("/check", async (req, res) => {
  try {
      const token = req.cookies.jwt;
      if (!token) return res.status(200).json(null);
      
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      if (!decoded || !decoded.userId) return res.status(200).json(null);

      const user = await User.findById(decoded.userId).select("-password -twoFA.otpHash -twoFA.otpExpiry");
      if (!user) return res.status(200).json(null);

      res.status(200).json(user);
  } catch (error) {
      // If token expired or invalid, silently return null
      res.status(200).json(null);
  }
});

export default router;
