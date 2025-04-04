import { env } from "@/lib/env";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import chatRoute from "./chat"; // Import the chat route

const app = new Hono()
  .use(contextStorage())
  .use(
    "*",
    cors({
      origin: () => {
        return env().VITE_FRONTEND_URL;
      },
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
  })
  .route("/api/chat", chatRoute); // Mount the chat route

export default app;

export type AppType = typeof app;
