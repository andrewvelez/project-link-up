/**
 * Server process to start the frontend app.
 * by: Andrew Velez
 */

import { createHandler } from "./app.js";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const port = Number(Bun.env.PORT ?? 3000);

const isCompiled = Bun.main.endsWith("/app");

const publicPath = isCompiled
  ? join(dirname(process.execPath), "public")
  : join(import.meta.dir, "..", "public");

const publicDir = pathToFileURL(`${publicPath}/`);

Bun.serve({
  port,
  fetch: createHandler({ publicDir }),
});

console.log(`server.js: Server running at http://localhost:${port}`);