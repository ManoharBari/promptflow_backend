import express from "express";
import { z } from "zod";
import { requireAuth, getAuth, clerkClient } from "@clerk/express";
import * as service from "../prompt/prompt.service";

const router = express.Router();


// Protect all routes in this router (optional): router.use(requireAuth());
router.post("/", requireAuth(), async (req, res, next) => {
  try {
    const data = req.body;
    
    // Get the authenticated user's id from the request
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Call LLM service to generate/store prompt
    const prompt = await service.createPrompt(userId, data.inputText);
    res.status(201).json(prompt);
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAuth(), async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 50);
    const skip = Number(req.query.skip ?? 0);

    const { userId } = getAuth(req);

    const items = await service.listPrompts(userId, limit, skip);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

export default router;
