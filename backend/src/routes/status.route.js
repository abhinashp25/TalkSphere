import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { generalRateLimit, uploadRateLimit } from "../middleware/arcjet.middleware.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import { uploadStatusSchema } from "../schemas/validation.schemas.js";
import { uploadStatus, getStatuses } from "../controllers/status.controller.js";

const router = express.Router();

router.get("/", generalRateLimit, protectRoute, getStatuses);
router.post("/", generalRateLimit, uploadRateLimit, protectRoute, validateSchema(uploadStatusSchema), uploadStatus);

export default router;
