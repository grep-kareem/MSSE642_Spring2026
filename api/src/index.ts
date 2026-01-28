import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { authRoutes } from "./routes/auth";
import { productsRoutes } from "./routes/products";
import { reservationsRoutes } from "./routes/reservations";
import { adminRoutes } from "./routes/admin";

const app = express();
const prisma = new PrismaClient();

const API_PORT = parseInt(process.env.API_PORT || "4000", 10);
const WEB_URL = process.env.WEB_URL || "http://localhost:3000";

// Middleware
app.use(express.json());

// CORS configuration
app.use(
  cors({
    origin: [WEB_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  }),
);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const start = async () => {
  try {
    await prisma.$connect();
    console.log("✓ Connected to database");

    app.listen(API_PORT, "0.0.0.0", () => {
      console.log(`✓ API server running on http://0.0.0.0:${API_PORT}`);
      console.log(`  Local: http://localhost:${API_PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();

export default app;
