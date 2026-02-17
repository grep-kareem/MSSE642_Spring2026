import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { authRoutes } from "./routes/auth.js";
import { productsRoutes } from "./routes/products.js";
import { reservationsRoutes } from "./routes/reservations.js";
import { adminRoutes } from "./routes/admin.js";
import { reviewsRoutes } from "./routes/reviews.js";
import { usersRoutes } from "./routes/users.js";
import { notesRoutes } from "./routes/notes.js";
import { debugRoutes } from "./routes/debug.js";
import { uploadsRoutes } from "./routes/uploads.js";

const app = express();
const prisma = new PrismaClient();

const API_PORT = parseInt(process.env.API_PORT || "4000", 10);
const WEB_URL = process.env.WEB_URL || "http://localhost:3000";

// Middleware
app.use(express.json({ limit: "50mb" })); // VULN: Very large body limit
app.use(express.urlencoded({ extended: true }));

// VULN: Wildcard CORS - allows any origin
app.use(
  cors({
    origin: true, // Reflects any origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// VULN: No security headers (X-Frame-Options, CSP, etc.)
// This makes the app vulnerable to clickjacking, MIME sniffing, etc.

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false, // VULN: JavaScript can access session cookie
      secure: false, // VULN: Cookie sent over HTTP
      sameSite: "none" as const, // VULN: Cookie sent cross-site (CSRF)
      maxAge: 365 * 24 * 60 * 60 * 1000, // VULN: 1 year session
    },
  }),
);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// VULN: Powered-by header reveals technology stack
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Powered-By", "Express 4.18.2 / Node.js / Prisma ORM");
  res.setHeader("Server", "Brisk/1.0.0 (Node.js)");
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/debug", debugRoutes); // VULN: Debug routes exposed in production
app.use("/api/uploads", uploadsRoutes);

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    nodeVersion: process.version,
    uptime: process.uptime(),
  });
});

// VULN: Reflected XSS via search endpoint that returns HTML
app.get("/api/search", async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' required" });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q as string } },
          { description: { contains: q as string } },
        ],
      },
    });

    // VULN: Returns HTML with unsanitized query parameter - reflected XSS
    const html = `
      <html>
        <head><title>Search Results for: ${q}</title></head>
        <body>
          <h1>Search Results for: ${q}</h1>
          <p>Found ${products.length} results</p>
          <ul>
            ${products.map((p) => `<li>${p.name} - $${p.dailyPrice}/day</li>`).join("")}
          </ul>
          <a href="/">Back to home</a>
        </body>
      </html>
    `;
    res.type("html").send(html);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

// VULN: Open redirect endpoint
app.get("/api/redirect", (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "URL parameter required" });
  }
  // VULN: No validation on redirect target - open redirect
  res.redirect(url as string);
});

// VULN: Server-Side Request Forgery (SSRF) - fetch arbitrary URLs
app.get("/api/fetch", async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "URL parameter required" });
  }

  try {
    // VULN: SSRF - fetches any URL including internal network resources
    const response = await fetch(url as string);
    const body = await response.text();
    res.json({
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: body.substring(0, 10000), // Limit response size
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  // VULN: Reveals attempted path in error message
  res.status(404).json({
    error: "Not found",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Error handler - VULN: Verbose error messages with stack traces
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: err.message || "Internal server error",
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
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
