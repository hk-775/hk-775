import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../site");
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".jsonl": "application/x-ndjson",
  ".png": "image/png", ".vtt": "text/vtt", ".zip": "application/zip",
};
createServer(async (request, response) => {
  try {
    let path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (path === "/") {
      response.writeHead(302, { location: "/hk-775/" }).end();
      return;
    }
    if (!path.startsWith("/hk-775/")) {
      response.writeHead(404).end();
      return;
    }
    path = path.slice("/hk-775/".length);
    const file = resolve(root, path || "index.html");
    if (!file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const contents = await readFile(file);
    response.writeHead(200, { "content-type": types[extname(file)] || "text/plain" });
    response.end(contents);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(4177, "127.0.0.1", () => console.log("Preview: http://127.0.0.1:4177/hk-775/"));
