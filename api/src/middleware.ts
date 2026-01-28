import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = (req.session as any).userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // In a real app, fetch from DB to get current user data
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } finally {
    await prisma.$disconnect();
  }
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = (req.session as any).userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } finally {
    await prisma.$disconnect();
  }
};
