import { webManifest } from "@/i18n/manifest";
import { langStaticParams, resolveLocale, type LangParams } from "../params";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = langStaticParams;

export async function GET(_: Request, { params }: LangParams) {
  return Response.json(webManifest(await resolveLocale(params)), { headers: { "content-type": "application/manifest+json" } });
}
