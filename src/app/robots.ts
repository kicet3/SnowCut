import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

// 검색엔진과 AI 검색 크롤러 모두 허용한다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
