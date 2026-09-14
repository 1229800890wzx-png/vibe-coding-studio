import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { websiteApiProxy } from './website-proxy.mjs';

const root = process.env.VIBE_WEB_ROOT ? path.resolve(process.env.VIBE_WEB_ROOT) : path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};
if (!existsSync(path.join(root, "index.html"))) {
  console.error("Please run npm run build first.");
  process.exit(1);
}
http
  .createServer((req, res) => {
    websiteApiProxy(req, res, () => serveStatic(req, res));
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`VIBE CODING: http://127.0.0.1:${port}`),
  );
function serveStatic(req, res) {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      return res.end("Method not allowed");
    }
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, "http://127.0.0.1").pathname,
      );
    } catch {
      res.writeHead(400);
      return res.end("Bad request");
    }
    const target = path.resolve(root, "." + pathname);
    if (target !== root && !target.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    let file = target;
    const found = existsSync(file) && statSync(file).isFile();
    if (!found) {
      if (path.extname(pathname)) {
        res.writeHead(404);
        return res.end("Not found");
      }
      file = path.join(root, "index.html");
    }
    const isDocument = file.endsWith(".html");
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": isDocument
        ? "no-cache"
        : pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    if (req.method === "HEAD") return res.end();
    createReadStream(file)
      .on("error", () => res.destroy())
      .pipe(res);
}
