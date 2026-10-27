import type { Metadata, Viewport } from "next";
import { HomeView } from "@/components/site/HomeView";
import { pageMetadata } from "@/i18n/seo";
import { resolveLocale, type LangParams } from "./params";

export const viewport: Viewport = { themeColor: "#fff5f7" };

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return pageMetadata(await resolveLocale(params), "home");
}

export default async function Home({ params }: LangParams) {
  return <HomeView locale={await resolveLocale(params)} />;
}
