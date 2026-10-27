import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** AI 검색·답변 크롤러와 Bing·네이버 검색 크롤러. 막지 않는다는 뜻을 분명히 하려고 따로 적는다. */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "Yeti",
];

// 페이지마다 함께 나오는 React 데이터 파일(*.txt)과 404 페이지는 검색 결과에 나올 필요가 없다.
// 페이지를 그리는 데 쓰는 /_next/ 스크립트·스타일은 막지 않는다.
const rule = {
  allow: [`${BASE}/`, `${BASE}/llms.txt`, `${BASE}/ads.txt`],
  disallow: [`${BASE}/*.txt$`, `${BASE}/404.html`, `${BASE}/_not-found`],
};

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", ...rule },
      // 크롤러 이름을 적은 묶음이 있으면 그 크롤러는 * 규칙을 보지 않으므로 같은 규칙을 다시 준다.
      { userAgent: AI_CRAWLERS, ...rule },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
