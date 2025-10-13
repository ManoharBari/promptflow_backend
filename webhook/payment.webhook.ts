import express from "express";
import prisma from "../prisma";
import crypto from "crypto";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const signature = req.headers["x-dodo-signature"];

    // ✅ Step 1: Verify webhook signature (optional but recommended)
    const expected = crypto
      .createHmac("sha256", process.env.DODO_WEBHOOK_SECRET)
      .update(req.rawBody)
      .digest("hex");

    if (signature && signature !== expected) {
      console.error("Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = req.body;

    // ✅ Step 2: Only handle successful payments
    if (event.type !== "payment.succeeded") {
      return res.status(200).json({ message: "Event ignored" });
    }

    const data = event.data;
    const email = data.customer?.email;
    const amount = data.total_amount; // amount in cents (e.g., 400)

    if (!email) {
      console.error("No email found in payload");
      return res.status(400).json({ error: "Missing email" });
    }

    // ✅ Step 3: Find user in DB by email (or clerkId if you stored metadata)
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      console.error("User not found for email:", email);
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Step 4: Calculate tokens based on payment amount
    let tokensToAdd = 50;

    // ✅ Step 5: Update user's tokens
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { tokens: { increment: tokensToAdd } },
    });

    console.log(`💰 Added ${tokensToAdd} tokens to ${email}`);
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
