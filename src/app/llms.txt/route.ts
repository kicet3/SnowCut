import { MESSAGES } from "@/i18n/messages";
import { llmsTxt } from "@/lib/site";

export const dynamic = "force-static";

// 생성형 AI 검색이 읽는 사이트 요약 (https://llmstxt.org)
export function GET() {
  return new Response(llmsTxt(MESSAGES.en, MESSAGES), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
