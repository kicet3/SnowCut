// 빌드 결과(out/)를 내려주는 작은 정적 서버.
//
//   npm run build && npm run serve
//   PORT=4173 HOST=127.0.0.1 npm run serve
//
// 커스텀 캐릭터 누끼: BG_REMOVER_URL을 주면 /bg-remover/* 요청을 Background-Remover 서버로 넘긴다.
// 앱은 NEXT_PUBLIC_BG_REMOVER_URL=/bg-remover 로 빌드한다 (같은 주소라 CORS·혼합 콘텐츠 문제가 없다).
//   BG_REMOVER_URL=http://127.0.0.1:5000 npm run serve
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream";

const ROOT = path.resolve(import.meta.dirname, "out");
const PORT = Number(process.env.PORT || 4173);
// tailscale serve가 127.0.0.1로 넘겨주므로 기본은 이 PC 안에서만 받는다.
const HOST = process.env.HOST || "127.0.0.1";
const BG_REMOVER_URL = process.env.BG_REMOVER_URL ? new URL(process.env.BG_REMOVER_URL) : null;
const BG_PREFIX = "/bg-remover/";
const BG_ROUTES = { "background-removal/remove": "POST", health: "GET" };

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

/** /bg-remover/<경로> → BG_REMOVER_URL/<경로>. 본문(업로드 이미지)은 그대로 흘려 보낸다. */
function proxyBgRemover(req, res, rest) {
  // 정해진 API만 넘긴다 ("//다른호스트/..." 같은 경로로 엉뚱한 곳에 요청하지 않도록).
  const route = BG_ROUTES[rest.split("?")[0]];
  if (!route || req.method !== route) {
    res.writeHead(404, { "content-type": "text/plain" });
    return res.end("not found");
  }
  const target = new URL(rest.split("?")[0], BG_REMOVER_URL.href.replace(/\/?$/, "/"));
  const client = target.protocol === "https:" ? https : http;
  const headers = {};
  for (const h of ["content-type", "content-length", "accept"]) if (req.headers[h]) headers[h] = req.headers[h];
  // CPU로 돌리면 한 장에 수십 초 걸리므로 넉넉히 기다린다.
  const upstream = client.request(target, { method: req.method, headers, timeout: 120_000 }, (up) => {
    const out = {};
    for (const h of ["content-type", "content-length", "content-disposition"]) if (up.headers[h]) out[h] = up.headers[h];
    res.writeHead(up.statusCode || 502, out);
    // 중간에 어느 쪽이 끊기면 다른 쪽도 닫는다 (브라우저가 끝없이 기다리지 않게).
    pipeline(up, res, (err) => {
      if (err) upstream.destroy();
    });
  });
  upstream.on("timeout", () => upstream.destroy(new Error("upstream timeout")));
  upstream.on("error", (err) => {
    console.warn("[server] bg-remover proxy error", err?.message);
    if (res.headersSent) return res.destroy();
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ detail: "누끼 서버에 연결하지 못했어요." }));
  });
  // 브라우저가 업로드 중에 끊으면 누끼 서버 요청도 접는다.
  pipeline(req, upstream, (err) => {
    if (err) upstream.destroy(err);
  });
}

http
  .createServer((req, res) => {
    if (BG_REMOVER_URL && req.url.startsWith(BG_PREFIX)) return proxyBgRemover(req, res, req.url.slice(BG_PREFIX.length));
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
  .listen(PORT, HOST, () => {
    console.log(`SnowCut: http://${HOST}:${PORT}`);
    if (BG_REMOVER_URL) console.log(`  누끼 서버: ${BG_PREFIX}* → ${BG_REMOVER_URL.href}`);
  });
