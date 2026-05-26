import { ajGeneral, ajAuth, ajAI, ajUpload, ajTone } from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

/**
 * Handles the Arcjet decision outcome.
 * Sets the Retry-After header for rate limits.
 * 
 * @param {import("@arcjet/node").ArcjetDecision} decision - The Arcjet decision
 * @param {import("express").Response} res - Express response object
 * @param {string} customRateLimitMsg - Customized message for rate limits
 * @returns {import("express").Response | null} Response object if denied, otherwise null
 */
const handleDecision = (decision, res, customRateLimitMsg) => {
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      const resetTime = decision.reason.reset || 60;
      res.set("Retry-After", resetTime.toString());
      return res.status(429).json({ 
        message: customRateLimitMsg || "Too many requests. Please try again later.",
        retryAfter: resetTime 
      });
    } else if (decision.reason.isBot()) {
      return res.status(403).json({ message: "Access denied. Bot activity detected." });
    } else {
      return res.status(403).json({ message: "Access denied by security policy." });
    }
  }

  // Check for spoofed bots
  if (decision.results.some(isSpoofedBot)) {
    return res.status(403).json({
      error: "Spoofed bot detected.",
      message: "Malicious bot activity detected.",
    });
  }

  return null;
};

// General API protection: 60 requests per minute per IP
export const generalRateLimit = async (req, res, next) => {
  try {
    const decision = await ajGeneral.protect(req);
    const deniedResponse = handleDecision(decision, res, "Too many requests. Please try again later.");
    if (deniedResponse) return;
    next();
  } catch (error) {
    console.error("Error in generalRateLimit middleware:", error);
    next();
  }
};

// Auth endpoint protection: 5 requests per 15 minutes per IP
export const authRateLimit = async (req, res, next) => {
  try {
    const decision = await ajAuth.protect(req);
    const deniedResponse = handleDecision(decision, res, "Too many login/signup attempts. Please try again in 15 minutes.");
    if (deniedResponse) return;
    next();
  } catch (error) {
    console.error("Error in authRateLimit middleware:", error);
    next();
  }
};

// AI assistant endpoint protection: 30 requests per minute per user
export const aiRateLimit = async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || "anonymous";
    const decision = await ajAI.protect(req, { userId });
    const deniedResponse = handleDecision(decision, res, "Too many AI assistant requests. Please try again in a minute.");
    if (deniedResponse) return;
    next();
  } catch (error) {
    console.error("Error in aiRateLimit middleware:", error);
    next();
  }
};

// Tone analysis protection: 150 requests per minute per user
export const toneRateLimit = async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || "anonymous";
    const decision = await ajTone.protect(req, { userId });
    const deniedResponse = handleDecision(decision, res, "Too many tone analysis requests. Please try again in a minute.");
    if (deniedResponse) return;
    next();
  } catch (error) {
    console.error("Error in toneRateLimit middleware:", error);
    next();
  }
};

// File upload endpoint protection: 5 requests per minute per IP
export const uploadRateLimit = async (req, res, next) => {
  try {
    const body = req.body || {};
    const { image, audio, document, groupPic, content } = body;
    const isUpload = image || audio || document || groupPic || (content && body.type === "image");

    if (!isUpload) {
      return next();
    }

    const decision = await ajUpload.protect(req);
    const deniedResponse = handleDecision(decision, res, "Too many file uploads. Please try again in a minute.");
    if (deniedResponse) return;
    next();
  } catch (error) {
    console.error("Error in uploadRateLimit middleware:", error);
    next();
  }
};

// Maintain compatibility with existing imports
export const arcjetProtection = generalRateLimit;
