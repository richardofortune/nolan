#!/usr/bin/env node
/**
 * Serve the design review page.
 *
 * It needs a server rather than a double-click because the review page previews
 * each screen in an iframe, and browsers refuse to load file:// iframes. Node's
 * own http module is enough, so this stays dependency-free like the rest of the
 * repo.
 *
 *   npm run designs            → serve and open
 *   npm run designs -- --port=6060
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.argv.find((a) => a.startsWith("--port="))?.slice(7) ?? 5599);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".md": "text/plain; charset=utf-8",
};

const server = createServer(async (req, res) => {
  // Strip the query and refuse anything trying to climb out of this directory.
  const rel = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const path = join(ROOT, rel.endsWith("/") ? rel + "index.html" : rel);
  if (!path.startsWith(ROOT)) {
    res.writeHead(403).end("no");
    return;
  }
  try {
    const body = await readFile(path);
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end(`not here: ${rel}`);
  }
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://localhost:${port}/`;
  console.log(`· design review → ${url}`);
  console.log("· ctrl-c to stop");
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(cmd, [url], { detached: true, stdio: "ignore", shell: process.platform === "win32" }).unref();
});
