import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "../middleware.js";

const router = Router();
const prisma = new PrismaClient();

// GET all users (admin only)
router.get("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
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

export { router as adminRoutes };
