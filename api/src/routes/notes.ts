import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware.js";

const router = Router();
const prisma = new PrismaClient();

// GET all notes for current user
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    res.json({ notes });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// GET public notes - no auth required
router.get("/public", async (req: Request, res: Response) => {
  try {
    const notes = await prisma.note.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ notes });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch public notes" });
  }
});

// GET single note - IDOR: no ownership check
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);

    // VULN: Any authenticated user can read any note by ID (even private ones)
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch note" });
  }
});

// POST create note - no input validation
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, content, isPublic } = req.body;

    // VULN: No input validation or sanitization
    const note = await prisma.note.create({
      data: {
        userId: req.user!.id,
        title,
        content,
        isPublic: isPublic || false,
      },
    });

    res.status(201).json({ note });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to create note",
      details: error.message,
    });
  }
});

// PUT update note - IDOR: no ownership check
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const { title, content, isPublic } = req.body;

    // VULN: Any authenticated user can update any note
    const note = await prisma.note.update({
      where: { id: noteId },
      data: { title, content, isPublic },
    });

    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: "Failed to update note" });
  }
});

// DELETE note - IDOR: no ownership check
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);

    // VULN: Any authenticated user can delete any note
    await prisma.note.delete({
      where: { id: noteId },
    });

    res.json({ message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export { router as notesRoutes };
