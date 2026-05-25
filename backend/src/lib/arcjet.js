import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";
import { ENV } from "./env.js";

// Common setup options
const baseConfig = {
  key: ENV.ARCJET_KEY,
  proxies: ["true"],
  env: ENV.NODE_ENV === "production" ? "production" : "development",
};

// 1. General API protection (60 requests per minute per IP)
export const ajGeneral = arcjet({
  ...baseConfig,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    slidingWindow({
      mode: "LIVE",
      max: 60,
      interval: 60,
    }),
  ],
});

// 2. Auth routes protection (5 requests per 15 minutes per IP)
export const ajAuth = arcjet({
  ...baseConfig,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    slidingWindow({
      mode: "LIVE",
      max: 5,
      interval: 900, // 15 minutes
    }),
  ],
});

// 3. AI / LLM protection (10 requests per minute per user)
export const ajAI = arcjet({
  ...baseConfig,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    slidingWindow({
      mode: "LIVE",
      max: 10,
      interval: 60,
      characteristics: ["userId"],
    }),
  ],
});

// 4. File upload protection (5 requests per minute per IP)
export const ajUpload = arcjet({
  ...baseConfig,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    slidingWindow({
      mode: "LIVE",
      max: 5,
      interval: 60,
    }),
  ],
});

export default ajGeneral;