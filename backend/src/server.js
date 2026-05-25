import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import path from "path";
import cors from "cors";
import helmet from "helmet";

import authRoutes      from "./routes/auth.route.js";
import messageRoutes   from "./routes/message.route.js";
import groupRoutes     from "./routes/group.route.js";
import aiRoutes        from "./routes/ai.route.js";
import scheduleRoutes  from "./routes/schedule.route.js";
import disappearRoutes from "./routes/disappear.route.js";
import searchRoutes    from "./routes/search.route.js";
import statusRoutes    from "./routes/status.route.js";

import { connectDB } from "./lib/db.js";
import { ENV }       from "./lib/env.js";
import { app, server } from "./lib/socket.js";
import { startScheduler } from "./controllers/schedule.controller.js";

const __dirname = path.resolve();
const PORT = ENV.PORT || 3000;

app.set('trust proxy', 1); // Tell Express to trust Render's load balancer

// Disable X-Powered-By header
app.disable("x-powered-by");

// Apply security headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com", "https://www.googletagmanager.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.cloudinary.com", "https://*.tenor.com", "https://*.googleapis.com", "https://*.googleusercontent.com", "https://lh3.googleusercontent.com"],
        connectSrc: ["'self'", "ws:", "wss:", "http://localhost:3000", "https://realtime-chat-app-1b5af.firebaseapp.com", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://www.google-analytics.com", "https://*.google-analytics.com"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    xssFilter: true,
    noSniff: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" },
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);
app.use(cookieParser());

app.use("/api/auth",      authRoutes);
app.use("/api/messages",  messageRoutes);
app.use("/api/groups",    groupRoutes);
app.use("/api/ai",        aiRoutes);
app.use("/api/scheduled", scheduleRoutes);
app.use("/api/disappear", disappearRoutes);
app.use("/api/search",    searchRoutes);
app.use("/api/status",    statusRoutes);

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Global error handling middleware (must be registered last)
app.use((err, req, res, next) => {
  console.error(`[Error] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}:`, err);
  
  const statusCode = err.status || err.statusCode || 500;
  const isProduction = ENV.NODE_ENV === "production";
  
  res.status(statusCode).json({
    message: statusCode === 500 
      ? "Something went wrong. Please try again later."
      : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

mongoose.connection.once("open", () => {
  startScheduler();
});

// Explicitly bind to 0.0.0.0 for Render
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});

// Trigger nodemon restart
