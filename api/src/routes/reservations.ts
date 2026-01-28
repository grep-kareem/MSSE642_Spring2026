import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireAuth } from "../middleware.js";

const router = Router();
const prisma = new PrismaClient();

const CreateReservationSchema = z.object({
  productId: z.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const UpdateReservationSchema = z.object({
  status: z.enum(["active", "cancelled", "completed"]),
});

// POST create reservation
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const data = CreateReservationSchema.parse(req.body);
    const userId = req.user!.id;

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      return res
        .status(400)
        .json({ error: "End date must be after start date" });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check for overlapping reservations
    const overlapping = await prisma.reservation.findFirst({
      where: {
        productId: data.productId,
        status: { in: ["active", "completed"] },
        OR: [
          {
            AND: [
              { startDate: { lt: endDate } },
              { endDate: { gt: startDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return res
        .status(409)
        .json({ error: "Product not available for selected dates" });
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId,
        productId: data.productId,
        startDate,
        endDate,
      },
      include: { product: true },
    });

    res.status(201).json({ reservation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create reservation" });
  }
});

// GET user reservations
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const reservations = await prisma.reservation.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { startDate: "desc" },
    });

    res.json({ reservations });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
});

// GET single reservation
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { product: true, user: true },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    // Check if user owns the reservation or is admin
    if (reservation.userId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json({ reservation });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reservation" });
  }
});

// PUT update reservation (cancel)
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const data = UpdateReservationSchema.parse(req.body);
    const reservationId = parseInt(req.params.id);

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    // Check if user owns the reservation or is admin
    if (reservation.userId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: data.status },
      include: { product: true },
    });

    res.json({ reservation: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update reservation" });
  }
});

export { router as reservationsRoutes };
