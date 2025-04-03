import { env } from "@/lib/env";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";

const app = new Hono()
  .use(contextStorage())
  .use(
    "*",
    cors({
      origin: [env.VITE_FRONTEND_URL],
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      credentials: true,
    }),
  )
  .get("/", (c) => {
    return c.json({
      message: "Hello from the backend!",
    });
  });

export default app;

export type AppType = typeof app;
