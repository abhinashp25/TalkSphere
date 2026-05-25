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
import { generalRateLimit, authRateLimit, uploadRateLimit } from "../middleware/arcjet.middleware.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import { signupSchema, loginSchema, updateProfileSchema } from "../schemas/validation.schemas.js";

const router = express.Router();

// Apply general API rate limits to checking and syncing
router.post("/firebase-sync",  generalRateLimit, firebaseSync);
router.post("/logout",         generalRateLimit, logout);

// Apply strict auth rate limits and validation schemas to auth routes
router.post("/signup",         authRateLimit, validateSchema(signupSchema), signup);
router.post("/login",          authRateLimit, validateSchema(loginSchema), login);
router.post("/2fa/verify",     authRateLimit, verify2FALogin);
router.post("/2fa/toggle",     authRateLimit, protectRoute, toggle2FA);

// Apply profile update validations and upload rate limits (if avatar is attached)
router.put("/update-profile",  generalRateLimit, uploadRateLimit, protectRoute, validateSchema(updateProfileSchema), updateProfile);
router.patch("/privacy",       generalRateLimit, protectRoute, updatePrivacy);

// We manually check JWT here to avoid returning a 401 error code, 
// which clutters the Chrome/Firefox console on startup when not logged in.
router.get("/check", generalRateLimit, async (req, res) => {
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
