import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import prisma from "../prisma";

const router = Router();

router.get("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      name: true,
      email: true,
      tokens: true,
      imageUrl: true,
    },
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

export default router;
