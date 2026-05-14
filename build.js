/**
 * Build file for the project.
 * by: Andrew Velez
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { $ } from "bun";

const isDev = Bun.argv.includes("--watch");
const distDir = path.join(import.meta.dir, "dist");
const outfile = path.join(distDir, "app");
const publicSourceDir = path.join(import.meta.dir, "public");
const publicOutDir = path.join(distDir, "public");

let server;

/**
 * Runs tests and builds the standalone binary.
 */
async function build() {
  console.log("build.js: Building executable...");
  await $`rm -r ${distDir}`.nothrow().quiet();
  await $`mkdir -p ${distDir}`.quiet();

  const result = await Bun.build({
    entrypoints: ["src/server.js"],
    target: "bun",
    minify: !isDev,
    sourcemap: isDev ? "inline" : "none",
    throw: false,
    compile: {
      outfile,
      autoloadDotenv: true,
      autoloadBunfig: true,
    },
  });

  if (!result.success) {
    console.error("build.js: Build failed!");
    for (const log of result.logs) {
      console.error(log);
    }
    return false;
  }

  if (fs.existsSync(publicSourceDir)) {
    await fs.promises.cp(publicSourceDir, publicOutDir, {
      recursive: true,
      force: true,
    });
  }

  console.log(`build.js: Built: ${outfile}`);
  return true;
}

async function restart() {
  if (server) {
    server.kill();
    await server.exited;
  }

  server = Bun.spawn([outfile], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
    env: Bun.env,
  });
}

const success = await build();

if (isDev) {
  if (success) await restart();

  /**
   * Debounce timer used to collapse multiple file-change events into one
   * rebuild.
   */
  let timer;

  fs.watch(path.join(import.meta.dir, "src"), { recursive: true }, (_event, filename) => {
    if (!filename) return;

    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (await build()) await restart();
    }, 200);
  });

  console.log("build.js: Watching for changes...");
} else {
  process.exit(success ? 0 : 1);
}
