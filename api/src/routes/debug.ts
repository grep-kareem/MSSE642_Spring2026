import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireAdmin } from "../middleware.js";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

const router = Router();
const prisma = new PrismaClient();

// GET /api/debug/config - Exposes application configuration
router.get("/config", (req: Request, res: Response) => {
  // VULN: Information disclosure - exposes environment and config
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: {
      NODE_ENV: process.env.NODE_ENV || "development",
      DATABASE_URL: process.env.DATABASE_URL,
      SESSION_SECRET:
        process.env.SESSION_SECRET || "dev-secret-change-in-production",
      API_PORT: process.env.API_PORT || "4000",
      WEB_URL: process.env.WEB_URL || "http://localhost:3000",
    },
    cwd: process.cwd(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    pid: process.pid,
  });
});

// GET /api/debug/users - Dump all users with passwords
router.get("/users", async (req: Request, res: Response) => {
  try {
    // VULN: Exposes all user data including password hashes without auth
    const users = await prisma.user.findMany();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/debug/db - Raw database query endpoint
router.get("/db", async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query parameter required" });
    }

    // VULN: Arbitrary SQL execution via query parameter
    const result = await prisma.$queryRawUnsafe(query as string);
    res.json({ result });
  } catch (error: any) {
    // VULN: Leaks SQL errors
    res.status(500).json({
      error: "Query failed",
      details: error.message,
      query: req.query.query,
    });
  }
});

// POST /api/debug/exec - Command injection endpoint
router.post("/exec", (req: Request, res: Response) => {
  const { cmd } = req.body;

  if (!cmd) {
    return res.status(400).json({ error: "Command required" });
  }

  // VULN: Direct command injection - executes arbitrary system commands
  exec(cmd, { timeout: 10000 }, (error, stdout, stderr) => {
    res.json({
      stdout: stdout,
      stderr: stderr,
      error: error ? error.message : null,
    });
  });
});

// GET /api/debug/file - Path traversal endpoint
router.get("/file", (req: Request, res: Response) => {
  const { path: filePath } = req.query;

  if (!filePath) {
    return res.status(400).json({ error: "Path parameter required" });
  }

  // VULN: Path traversal - no validation on file path
  // Attacker can use ../../etc/passwd
  const resolvedPath = path.resolve(process.cwd(), filePath as string);

  try {
    if (fs.existsSync(resolvedPath)) {
      const stat = fs.statSync(resolvedPath);
      if (stat.isDirectory()) {
        const files = fs.readdirSync(resolvedPath);
        return res.json({ path: resolvedPath, type: "directory", files });
      }
      const content = fs.readFileSync(resolvedPath, "utf-8");
      return res.json({ path: resolvedPath, type: "file", content });
    }
    res.status(404).json({ error: "File not found", path: resolvedPath });
  } catch (error: any) {
    res.status(500).json({ error: error.message, path: resolvedPath });
  }
});

// POST /api/debug/eval - JavaScript eval endpoint
router.post("/eval", (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code required" });
  }

  try {
    // VULN: Arbitrary JavaScript execution via eval
    const result = eval(code);
    res.json({ result: String(result) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/debug/logs - Exposes application logs
router.get("/logs", (req: Request, res: Response) => {
  // VULN: Information disclosure
  res.json({
    message: "Application logs",
    sessions: "Check /api/debug/sessions for active sessions",
    environment: process.env,
  });
});

// GET /api/debug/sessions - List all active sessions
router.get("/sessions", async (req: Request, res: Response) => {
  try {
    // VULN: Exposes all active sessions without auth
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

export { router as debugRoutes };
