import { ADSENSE_CLIENT, adsTxt } from "@/lib/ads";

export const dynamic = "force-static";

export function GET() {
  return new Response(adsTxt(ADSENSE_CLIENT), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
