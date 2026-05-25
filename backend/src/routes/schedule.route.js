import express from "express";
import { createScheduledMessage, getScheduledMessages, cancelScheduledMessage } from "../controllers/schedule.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { generalRateLimit, uploadRateLimit } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// Apply general API rate limits and authentication baseline
router.use(generalRateLimit, protectRoute);

router.get("/",              getScheduledMessages);
router.post("/:id",          uploadRateLimit, createScheduledMessage);   
router.delete("/:id/cancel", cancelScheduledMessage);

export default router;
