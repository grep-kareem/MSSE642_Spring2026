import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "../middleware.js";

const router = Router();
const prisma = new PrismaClient();

// GET all users (admin only)
router.get("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    // VULN: Returns password hashes to admin
    const users = await prisma.user.findMany();

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

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

// DELETE /api/admin/users/:id - Delete user (but no CSRF protection)
router.delete(
  "/users/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);

      await prisma.user.delete({ where: { id: userId } });

      res.json({ message: "User deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
);

export { router as adminRoutes };
