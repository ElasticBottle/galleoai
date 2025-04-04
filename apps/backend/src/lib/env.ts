import { parseServerEnv } from "@rectangular-labs/schema/env";
import { env as envHono } from "hono/adapter";
import { getContext } from "hono/context-storage";

export const env = () => parseServerEnv(envHono(getContext()));
