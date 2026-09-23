import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/apty.db";

// Ensure the directory for a file-backed database exists.
if (url.startsWith("file:")) {
  const filePath = url.slice("file:".length);
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
}

// Reuse a single client across HMR reloads in dev.
const globalForDb = globalThis as unknown as { __aptyClient?: Client };
const client = globalForDb.__aptyClient ?? createClient({ url });
if (process.env.NODE_ENV !== "production") globalForDb.__aptyClient = client;

export const db = drizzle(client, { schema });
export { schema };
