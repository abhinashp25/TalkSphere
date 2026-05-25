import { z } from "zod";

// User signup schema
export const signupSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name cannot exceed 50 characters"),
  email: z.string()
    .trim()
    .email("Invalid email format"),
  password: z.string()
    .min(6, "Password must be at least 6 characters"),
});

// User login schema
export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Update profile schema
export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(50).optional(),
  bio: z.string().max(160).optional(),
  status: z.string().max(139).optional(),
  profilePic: z.string().optional(),
});

// Message schema
export const sendMessageSchema = z.object({
  text: z.string().max(2000, "Message text cannot exceed 2000 characters").optional(),
  image: z.string().optional(),
  audio: z.string().optional(),
  replyTo: z.any().optional(),
  isForwarded: z.boolean().optional(),
  isWhisper: z.boolean().optional(),
  document: z.object({
    data: z.string(),
    filename: z.string(),
    size: z.number(),
  }).optional(),
});

// Create group schema
export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(50, "Group name cannot exceed 50 characters"),
  description: z.string().max(200).optional(),
  memberIds: z.array(z.string()).optional(),
  groupPic: z.string().optional(),
});

// Upload status schema
export const uploadStatusSchema = z.object({
  content: z.string().min(1, "Status content is required"),
  type: z.enum(["text", "image"]),
});
