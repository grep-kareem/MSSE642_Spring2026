import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware.js";

const router = Router();
const prisma = new PrismaClient();

// GET user profile - IDOR: any user can view any other user's full profile by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    // VULN: No auth check, returns sensitive data including password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reservations: {
          include: { product: true },
        },
        reviews: true,
        notes: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // VULN: Leaks password hash and all private data
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// PUT update profile - Mass Assignment vulnerability
router.put("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // VULN: Mass assignment - user can set ANY field including 'role'
    // An attacker can send { "role": "admin" } to escalate privileges
    const user = await prisma.user.update({
      where: { id: userId },
      data: req.body, // No field filtering!
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    // VULN: Verbose error leaks schema details
    res.status(500).json({
      error: "Failed to update profile",
      details: error.message,
    });
  }
});

// GET search users - SQL-like injection via Prisma raw query
router.get("/", async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    if (search) {
      // VULN: Raw SQL query with string interpolation - SQL injection
      const users = await prisma.$queryRawUnsafe(
        `SELECT id, email, name, role, password FROM User WHERE name LIKE '%${search}%' OR email LIKE '%${search}%'`,
      );
      return res.json({ users });
    }

    // Without search, return basic list (still leaks emails)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ users });
  } catch (error: any) {
    // VULN: Leaks SQL error messages
    res.status(500).json({
      error: "Failed to search users",
      details: error.message,
    });
  }
});

// POST password reset - No rate limiting, user enumeration
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // VULN: User enumeration - different response for existing vs non-existing users
      return res
        .status(404)
        .json({ error: "No account found with this email address" });
    }

    // VULN: Fake "sent" response, but the token is predictable (timestamp-based)
    const resetToken = Buffer.from(`${user.id}:${Date.now()}`).toString(
      "base64",
    );

    // VULN: Token leaked in response
    res.json({
      message: "Password reset link sent to your email",
      debug_token: resetToken, // Accidentally left in response
    });
  } catch (error) {
    res.status(500).json({ error: "Password reset failed" });
  }
});

// POST confirm password reset - Token is just base64 encoded userId:timestamp
router.post("/reset-password/confirm", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    // VULN: Weak token validation - just base64 decode and extract userId
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userIdStr] = decoded.split(":");
    const userId = parseInt(userIdStr);

    if (!userId) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const bcrypt = await import("bcryptjs");
    // VULN: Only 4 salt rounds (weak hashing)
    const hashedPassword = await bcrypt.hash(newPassword, 4);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Password reset failed" });
  }
});

export { router as usersRoutes };
