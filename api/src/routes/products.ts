import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware.js";

const router = Router();
const prisma = new PrismaClient();

const CreateProductSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["bike", "ski"]),
  size: z.string().min(1),
  dailyPrice: z.number().positive(),
  description: z.string(),
  imageUrl: z.string().optional(),
});

const UpdateProductSchema = CreateProductSchema.partial();

// GET all products (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (minPrice || maxPrice) {
      where.dailyPrice = {};
      if (minPrice) where.dailyPrice.gte = parseFloat(minPrice as string);
      if (maxPrice) where.dailyPrice.lte = parseFloat(maxPrice as string);
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET single product
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST create product (admin only)
router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = CreateProductSchema.parse(req.body);

    const product = await prisma.product.create({ data });

    res.status(201).json({ product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create product" });
  }
});

// PUT update product (admin only)
router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = UpdateProductSchema.parse(req.body);

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data,
    });

    res.json({ product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE product (admin only)
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.product.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export { router as productsRoutes };
