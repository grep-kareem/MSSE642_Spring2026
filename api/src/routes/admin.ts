import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "../middleware.js";
import bcrypt from "bcryptjs";

const router = Router();
const prisma = new PrismaClient();

// ──────────────────────────────────────────────
//  USER MANAGEMENT
// ──────────────────────────────────────────────

// GET all users (admin only)
router.get("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    // VULN: Returns password hashes to admin
    const users = await prisma.user.findMany({
      include: {
        _count: { select: { reservations: true, reviews: true, notes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET single user detail (admin only)
router.get("/users/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    // VULN: Returns full user record including password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reservations: {
          include: { product: true },
          orderBy: { createdAt: "desc" },
        },
        reviews: { orderBy: { createdAt: "desc" } },
        notes: true,
        uploadedFiles: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// PUT /api/admin/users/:id - Update any user field (admin)
router.put("/users/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, role, password } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role; // VULN: No validation on role value
    if (password) {
      // VULN: Weak hashing rounds
      updateData.password = await bcrypt.hash(password, 4);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// PUT /api/admin/users/:id/role - Change user role (admin)
router.put(
  "/users/:id/role",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      // VULN: No validation on role value - can set arbitrary roles
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  },
);

// PATCH /api/admin/users/:id/disable - Toggle user active status
router.patch(
  "/users/:id/disable",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);

      // Set role to "disabled" to simulate account disable
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role: "disabled" },
      });

      res.json({ message: "User disabled", user });
    } catch (error) {
      res.status(500).json({ error: "Failed to disable user" });
    }
  },
);

// DELETE /api/admin/users/:id - Delete user (but no CSRF protection)
router.delete(
  "/users/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);

      // VULN: Can delete own admin account, no confirmation token
      await prisma.user.delete({ where: { id: userId } });

      res.json({ message: "User deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
);

// POST /api/admin/users - Create user as admin (set any role)
router.post("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password) {
      return res
        .status(400)
        .json({ error: "Email, name, and password are required" });
    }

    // VULN: Weak hash rounds, no password complexity enforcement
    const hashedPassword = await bcrypt.hash(password, 4);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || "customer",
      },
    });

    res.status(201).json({ user });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
});

// POST /api/admin/users/bulk-delete - Bulk delete users
router.post(
  "/users/bulk-delete",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "userIds array is required" });
      }

      // VULN: No CSRF protection, no confirmation, can delete all users
      const result = await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });

      res.json({
        message: `${result.count} users deleted`,
        count: result.count,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk delete users" });
    }
  },
);

// POST /api/admin/users/:id/reset-password - Admin resets user password
router.post(
  "/users/:id/reset-password",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;

      const password = newPassword || "password123"; // VULN: Default weak password

      const hashedPassword = await bcrypt.hash(password, 4);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // VULN: Returns the plaintext password in response
      res.json({ message: "Password reset successful", newPassword: password });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset password" });
    }
  },
);

// ──────────────────────────────────────────────
//  RESERVATION MANAGEMENT
// ──────────────────────────────────────────────

// GET all reservations (admin only)
router.get(
  "/reservations",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const reservations = await prisma.reservation.findMany({
        include: {
          product: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ reservations });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reservations" });
    }
  },
);

// PUT /api/admin/reservations/:id - Update reservation status
router.put(
  "/reservations/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const reservationId = parseInt(req.params.id);
      const { status } = req.body;

      // VULN: No validation on status value
      const reservation = await prisma.reservation.update({
        where: { id: reservationId },
        data: { status },
        include: { product: true, user: true },
      });

      res.json({ reservation });
    } catch (error) {
      res.status(500).json({ error: "Failed to update reservation" });
    }
  },
);

// DELETE /api/admin/reservations/:id - Delete reservation
router.delete(
  "/reservations/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const reservationId = parseInt(req.params.id);

      await prisma.reservation.delete({ where: { id: reservationId } });

      res.json({ message: "Reservation deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete reservation" });
    }
  },
);

// POST /api/admin/reservations/bulk-update - Bulk status update
router.post(
  "/reservations/bulk-update",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { reservationIds, status } = req.body;

      if (!Array.isArray(reservationIds) || !status) {
        return res
          .status(400)
          .json({ error: "reservationIds and status required" });
      }

      const result = await prisma.reservation.updateMany({
        where: { id: { in: reservationIds } },
        data: { status },
      });

      res.json({
        message: `${result.count} reservations updated`,
        count: result.count,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk update reservations" });
    }
  },
);

// ──────────────────────────────────────────────
//  PRODUCT MANAGEMENT (admin overrides)
// ──────────────────────────────────────────────

// PATCH /api/admin/products/:id/price - Quick price update
router.patch(
  "/products/:id/price",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const { dailyPrice } = req.body;

      // VULN: No validation — negative prices, zero, or absurd values accepted
      const product = await prisma.product.update({
        where: { id: productId },
        data: { dailyPrice: parseFloat(dailyPrice) },
      });

      res.json({ product });
    } catch (error) {
      res.status(500).json({ error: "Failed to update price" });
    }
  },
);

// POST /api/admin/products/bulk-delete - Bulk delete products
router.post(
  "/products/bulk-delete",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { productIds } = req.body;

      if (!Array.isArray(productIds)) {
        return res.status(400).json({ error: "productIds array is required" });
      }

      const result = await prisma.product.deleteMany({
        where: { id: { in: productIds } },
      });

      res.json({
        message: `${result.count} products deleted`,
        count: result.count,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk delete products" });
    }
  },
);

// ──────────────────────────────────────────────
//  REVIEW MODERATION
// ──────────────────────────────────────────────

// GET all reviews (admin only)
router.get("/reviews", requireAdmin, async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// DELETE /api/admin/reviews/:id - Delete review (moderation)
router.delete(
  "/reviews/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const reviewId = parseInt(req.params.id);

      await prisma.review.delete({ where: { id: reviewId } });

      res.json({ message: "Review deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete review" });
    }
  },
);

// ──────────────────────────────────────────────
//  SITE SETTINGS & SYSTEM
// ──────────────────────────────────────────────

// In-memory settings store (VULN: not persistent, no auth token validation)
let siteSettings: Record<string, any> = {
  siteName: "Brisk Rentals",
  maintenanceMode: false,
  registrationEnabled: true,
  maxReservationDays: 30,
  defaultCurrency: "USD",
  contactEmail: "admin@brisk-rentals.com",
  motd: "Welcome to Brisk Rentals!",
};

// GET /api/admin/settings - Get site settings
router.get("/settings", requireAdmin, async (req: Request, res: Response) => {
  res.json({ settings: siteSettings });
});

// PUT /api/admin/settings - Update site settings
router.put("/settings", requireAdmin, async (req: Request, res: Response) => {
  try {
    // VULN: Mass assignment - any key/value can be set
    siteSettings = { ...siteSettings, ...req.body };

    res.json({ message: "Settings updated", settings: siteSettings });
  } catch (error) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// PATCH /api/admin/settings/maintenance - Toggle maintenance mode
router.patch(
  "/settings/maintenance",
  requireAdmin,
  async (req: Request, res: Response) => {
    siteSettings.maintenanceMode = !siteSettings.maintenanceMode;

    res.json({
      message: `Maintenance mode ${siteSettings.maintenanceMode ? "enabled" : "disabled"}`,
      maintenanceMode: siteSettings.maintenanceMode,
    });
  },
);

// ──────────────────────────────────────────────
//  STATS / DASHBOARD
// ──────────────────────────────────────────────

// GET /api/admin/stats - Dashboard statistics
router.get("/stats", requireAdmin, async (req: Request, res: Response) => {
  try {
    const [userCount, productCount, reservationCount, reviewCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.reservation.count(),
        prisma.review.count(),
      ]);

    const activeReservations = await prisma.reservation.count({
      where: { status: "active" },
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // VULN: Leaks internal counts and recent user data
    res.json({
      stats: {
        users: userCount,
        products: productCount,
        reservations: { total: reservationCount, active: activeReservations },
        reviews: reviewCount,
      },
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ──────────────────────────────────────────────
//  EXPORT / DATA
// ──────────────────────────────────────────────

// GET /api/admin/export - CSV export with SQL injection
router.get("/export", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { table, format } = req.query;
    const tableName = (table as string) || "User";

    // VULN: SQL injection via table name parameter
    const data = await prisma.$queryRawUnsafe(`SELECT * FROM ${tableName}`);

    if (format === "csv") {
      const rows = data as any[];
      if (rows.length === 0) {
        return res.type("text/csv").send("");
      }
      const headers = Object.keys(rows[0]).join(",");
      const csv = rows.map((r: any) => Object.values(r).join(",")).join("\n");
      res.type("text/csv").send(`${headers}\n${csv}`);
    } else {
      res.json({ data });
    }
  } catch (error: any) {
    // VULN: Leaks SQL error details
    res.status(500).json({
      error: "Export failed",
      details: error.message,
      query: `SELECT * FROM ${req.query.table}`,
    });
  }
});

export { router as adminRoutes };
