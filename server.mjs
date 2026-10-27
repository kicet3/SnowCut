// 빌드 결과(out/)를 내려주는 작은 정적 서버.
//
//   npm run build && npm run serve
//   PORT=4173 HOST=127.0.0.1 npm run serve
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "out");
const PORT = Number(process.env.PORT || 4173);
// tailscale serve가 127.0.0.1로 넘겨주므로 기본은 이 PC 안에서만 받는다.
const HOST = process.env.HOST || "127.0.0.1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain",
  ".json": "application/json",
};

function serveFile(p, res) {
  // 끝의 / 는 떼고 찾는다 (/booth/ → booth.html). path.join이 남기는 끝 구분자도 함께 뗀다.
  const f0 = path.join(ROOT, p).replace(/[\\/]+$/, "") || ROOT;
  if (f0 !== ROOT && !f0.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  let f = f0;
  // /booth → booth.html (같은 이름의 폴더 booth/ 에는 페이지 데이터만 있다), / → index.html
  if (!path.extname(f) && fs.existsSync(f + ".html")) f += ".html";
  else if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" });
    return res.end("not found");
  }
  const stream = fs.createReadStream(f);
  stream.once("open", () => {
    res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
    stream.pipe(res);
  });
  stream.on("error", () => {
    if (!res.headersSent) res.writeHead(404);
    res.end();
  });
}

http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    } catch {
      res.writeHead(400);
      return res.end();
    }
    try {
      serveFile(pathname, res);
    } catch (err) {
      console.warn("[server] handler error", err?.message);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    }
  })
  .listen(PORT, HOST, () => console.log(`SnowCut: http://${HOST}:${PORT}`));
