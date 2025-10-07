import { Webhook } from "svix";
import { Request, Response } from "express";
import prisma from "../prisma";
import "dotenv/config";

export async function clerkWebhook(req: Request, res: Response) {
  const payload = req.body; // this is a Buffer
  const headers = req.headers;

  console.log("Headers:", headers);
  console.log("Raw body string:", payload.toString());

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET as string);
  try {
    // Verify using raw buffer → string
    const evt = wh.verify(payload.toString(), headers as any) as {
      type: string;
      data: any;
    };

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const user = evt.data;

      await prisma.user.upsert({
        where: { clerkId: user.id },
        update: {
          email: user.email_addresses[0]?.email_address,
          name: user.first_name
            ? `${user.first_name} ${user.last_name || ""}`.trim()
            : null,
          imageUrl: user.image_url,
        },
        create: {
          clerkId: user.id,
          tokens: 3,
          email: user.email_addresses[0]?.email_address,
          name: user.first_name
            ? `${user.first_name} ${user.last_name || ""}`.trim()
            : null,
          imageUrl: user.image_url,
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Webhook error", err);
    res.status(400).json({ error: "Invalid signature" });
  }
}
