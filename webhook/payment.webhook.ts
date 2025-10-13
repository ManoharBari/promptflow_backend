   import express from "express";
import prisma from "../prisma";
const router = express.Router();

// DodoPayment webhook endpoint
router.post("/", async (req, res) => {
  try {
    const payload = req.body;

    // ✅ Step 1: Verify signature (DodoPayment usually sends a secret key)
    const signature = req.headers["x-dodopayment-signature"];
    if (signature !== process.env.DODO_WEBHOOK_SECRET) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // ✅ Step 2: Extract user info and amount from payload
    const { userId, paymentStatus, amount } = payload;

    if (paymentStatus !== "SUCCESS") {
      return res.status(200).json({ message: "Payment not completed" });
    }

    // ✅ Step 3: Determine how many tokens to give
    let tokensToAdd = 0;
    if (amount === 100) tokensToAdd = 100;
    else if (amount === 250) tokensToAdd = 300;
    else if (amount === 500) tokensToAdd = 700;

    // ✅ Step 4: Update user's token count
    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: { tokens: { increment: tokensToAdd } },
    });

    console.log(`💰 User ${user.email} received ${tokensToAdd} tokens`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
