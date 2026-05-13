import { mkdir, rm } from "node:fs/promises";
import { watch } from "node:fs";
import { join } from "node:path";

const isWatch = Bun.argv.includes("--watch");
const distDir = join(import.meta.dir, "dist");
const outfile = join(distDir, "app");

/** @type {import("bun").Subprocess | undefined} */
let server;

/**
 * Runs tests and builds the standalone binary.
 */
async function build() {
  console.log("\n🧪 Running tests...");
  const testResult = Bun.spawnSync(["bun", "test"], { stdout: "inherit" });
  
  if (!testResult.success) {
    console.error("❌ Tests failed. Build aborted.");
    return false;
  }

  console.log("🛠️  Building executable...");
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  const result = await Bun.build({
    entrypoints: ["src/server.js"],
    target: "bun",
    minify: !isWatch,
    sourcemap: "none",
    // @ts-ignore - Ignoring if @types/bun is outdated; this is valid Bun 1.1+
    compile: {
      outfile,
      autoloadDotenv: true,
      autoloadBunfig: true
    }
  });

  if (!result.success) {
    console.error("❌ Build failed");
    for (const log of result.logs) console.error(log);
    return false;
  }

  console.log(`✅ Built: ${outfile}`);
  return true;
}

/**
 * Manages the server child process
 */
async function restart() {
  if (server) {
    server.kill();
    await server.exited;
  }

  server = Bun.spawn([outfile], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
    env: Bun.env
  });
}

// Initial execution`
const success = await build();

if (isWatch) {
  if (success) await restart();

  let timer;
  watch(join(import.meta.dir, "src"), { recursive: true }, (event, filename) => {
    if (!filename) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (await build()) await restart();
    }, 200);
  });
  console.log("👀 Watching for changes...");
} else {
  process.exit(success ? 0 : 1);
}