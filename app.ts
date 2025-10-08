import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { clerkMiddleware } from "@clerk/express";
import { clerkWebhook } from "./webhook/clerk.webhook";
import paymentWebhook from "./webhook/payment.webhook";
import promptsRouter from "./controllers/prompt.controller";
import templatesRouter from "./controllers/template.controller";
import user from "./controllers/user.controller";

const app = express();

app.use(cors());
app.use(morgan("dev"));

app.post(
  "/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhook
);

app.use(
  "/webhook/payment",
  express.json({ verify: (req, res, buf) => (req.rawBody = buf) }),
  paymentWebhook
);

// IMPORTANT: add clerkMiddleware() once, before protected routes
app.use(clerkMiddleware());

app.get("/health", (req, res) => res.json({ status: "ok" }));

// now your routes (requireAuth will rely on clerkMiddleware)
app.use("/prompts", express.json(), promptsRouter);
app.use("/templates", templatesRouter);
app.use("/user", user);

app.listen(5000, () => {
  console.log(`PromptFlow backend listening on port 5000`);
});

app.get("/", (req, res) => {
  res.send("Hello World! Welcome to PromptFlow Backend.");
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

export default app;
