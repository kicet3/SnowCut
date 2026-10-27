import type { Metadata, Viewport } from "next";
import { PrivacyView } from "@/components/site/PrivacyView";
import { pageMetadata } from "@/i18n/seo";
import { resolveLocale, type LangParams } from "../params";

export const viewport: Viewport = { themeColor: "#fff5f7" };

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return pageMetadata(await resolveLocale(params), "privacy");
}

export default async function Privacy({ params }: LangParams) {
  return <PrivacyView locale={await resolveLocale(params)} />;
}
