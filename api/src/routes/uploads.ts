import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware.js";
import path from "path";
import fs from "fs";

const router = Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// POST upload file - No validation on file type, size, or content
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    // Simple base64 file upload (no multer needed)
    const { filename, content, mimetype } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: "Filename and content required" });
    }

    // VULN: No file type validation - can upload .php, .sh, .exe, etc.
    // VULN: No size limit check
    // VULN: Original filename used directly - path traversal possible
    const buffer = Buffer.from(content, "base64");
    const savePath = path.join(uploadsDir, filename); // No sanitization of filename

    fs.writeFileSync(savePath, buffer);

    const upload = await prisma.uploadedFile.create({
      data: {
        userId: req.user!.id,
        filename: filename,
        originalName: filename,
        mimetype: mimetype || "application/octet-stream",
        size: buffer.length,
        path: savePath,
      },
    });

    res.status(201).json({
      upload,
      url: `/api/uploads/files/${filename}`,
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Upload failed",
      details: error.message,
    });
  }
});

// GET list uploads - shows all users' uploads (no filtering by user)
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    // VULN: Shows ALL uploads from ALL users, not just the current user
    const uploads = await prisma.uploadedFile.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ uploads });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch uploads" });
  }
});

// GET download file - path traversal via filename
router.get("/files/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;

  // VULN: Path traversal - no validation on filename parameter
  // Attacker can use ../../../etc/passwd
  const filePath = path.join(uploadsDir, filename);

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // VULN: Serves file without checking content type - could serve HTML/JS
    res.sendFile(filePath);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE upload - IDOR: no ownership check
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const uploadId = parseInt(req.params.id);

    // VULN: Any authenticated user can delete any upload
    const upload = await prisma.uploadedFile.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      return res.status(404).json({ error: "Upload not found" });
    }

    // Delete file from disk
    if (fs.existsSync(upload.path)) {
      fs.unlinkSync(upload.path);
    }

    await prisma.uploadedFile.delete({ where: { id: uploadId } });

    res.json({ message: "Upload deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete upload" });
  }
});

export { router as uploadsRoutes };
