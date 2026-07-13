import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { saveCallLog, getCallHistory, deleteCallLog, clearCallHistory } from "../controllers/call.controller.js";

const router = express.Router();

router.use(protectRoute);

router.post("/save", saveCallLog);
router.get("/history", getCallHistory);
router.delete("/delete/:id", deleteCallLog);
router.delete("/clear", clearCallHistory);

export default router;
