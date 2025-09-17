import express from "express";
import prisma from "../prisma";

const router = express.Router();

// Public templates: list all (system and user's)
router.get("/", async (req, res, next) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(templates);
  } catch (err) {
    next(err);
  }
});

export default router;
