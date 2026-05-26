import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { aiRateLimit, toneRateLimit } from "../middleware/arcjet.middleware.js";
import {
  sendAIMessage, getSmartReplies,
  analyzeTone, generateDigest, translateMessage,
} from "../controllers/ai.controller.js";

const router = express.Router();

// Enforce authentication
router.use(protectRoute);

router.post("/chat",          aiRateLimit, sendAIMessage);
router.post("/smart-replies", aiRateLimit, getSmartReplies);
router.post("/tone",          toneRateLimit, analyzeTone);
router.post("/digest",        aiRateLimit, generateDigest);
router.post("/translate",     aiRateLimit, translateMessage);

export default router;
