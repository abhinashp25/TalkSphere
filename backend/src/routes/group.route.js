import express from "express";
import {
  createGroup, getMyGroups, getGroupMessages, sendGroupMessage,
  addMember, removeMember, leaveGroup,
  markGroupMessagesRead, getMessageReadBy,
} from "../controllers/group.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { generalRateLimit, uploadRateLimit } from "../middleware/arcjet.middleware.js";
import { validateSchema } from "../middleware/validation.middleware.js";
import { createGroupSchema, sendMessageSchema } from "../schemas/validation.schemas.js";

const router = express.Router();

// Apply general API rate limits and authentication baseline
router.use(generalRateLimit, protectRoute);

router.post("/",                                uploadRateLimit, validateSchema(createGroupSchema), createGroup);
router.get("/",                                 getMyGroups);
router.get("/:groupId/messages",                getGroupMessages);
router.post("/:groupId/messages",               uploadRateLimit, validateSchema(sendMessageSchema), sendGroupMessage);
router.put("/:groupId/read",                    markGroupMessagesRead);
router.get("/:groupId/messages/:messageId/read",getMessageReadBy);
router.post("/:groupId/members",                addMember);
router.delete("/:groupId/members/:userId",      removeMember);
router.post("/:groupId/leave",                  leaveGroup);

export default router;
