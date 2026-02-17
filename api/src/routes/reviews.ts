import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware.js";

const router = Router();
const prisma = new PrismaClient();

// GET reviews for a product (public) - returns raw HTML in body (stored XSS vector)
router.get("/product/:productId", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST create review - NO INPUT SANITIZATION (stored XSS)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { productId, rating, title, body } = req.body;

    // Intentionally no sanitization of title or body - stored XSS vector
    const review = await prisma.review.create({
      data: {
        productId: parseInt(productId),
        userId: req.user!.id,
        rating: parseInt(rating),
        title: title,
        body: body, // Raw HTML/JS stored directly
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({ review });
  } catch (error: any) {
    // VULN: Verbose error - leaks internal details
    res.status(500).json({
      error: "Failed to create review",
      details: error.message,
      stack: error.stack,
    });
  }
});

// DELETE review - IDOR: no ownership check
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);

    // VULN: No check if the user owns this review - any authenticated user can delete any review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    res.json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

export { router as reviewsRoutes };
