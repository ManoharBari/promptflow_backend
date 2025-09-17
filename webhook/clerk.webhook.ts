import { Webhook } from "svix";
import { Request, Response } from "express";
import prisma from "../prisma";

export async function clerkWebhook(req: Request, res: Response) {
  const payload = req.body;
  const headers = req.headers;

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  try {
    const evt = wh.verify(JSON.stringify(payload), headers as any) as { type: string; data: any };

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
