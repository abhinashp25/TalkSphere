import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { aiRateLimit } from "../middleware/arcjet.middleware.js";
import {
  sendAIMessage, getSmartReplies,
  analyzeTone, generateDigest, translateMessage,
} from "../controllers/ai.controller.js";

const router = express.Router();

// Enforce authentication and per-user AI rate limits
router.use(protectRoute, aiRateLimit);

router.post("/chat",          sendAIMessage);
router.post("/smart-replies", getSmartReplies);
router.post("/tone",          analyzeTone);
router.post("/digest",        generateDigest);
router.post("/translate",     translateMessage);

export default router;
