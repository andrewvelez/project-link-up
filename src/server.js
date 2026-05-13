import { createHandler } from "./app.js";
import { join, dirname } from "node:path";

const port = Number(Bun.env.PORT ?? 3000);

// Detect if running from a compiled binary or source
const isCompiled = Bun.main.endsWith("/app"); 
const baseDir = isCompiled ? dirname(process.execPath) : import.meta.dir;
const publicDir = new URL(`file://${join(baseDir, "public")}/`);

Bun.serve({
  port,
  fetch: createHandler({ publicDir }),
});

console.log(`🚀 Server running at http://localhost:${port}`);