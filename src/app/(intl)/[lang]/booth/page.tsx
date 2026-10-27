import type { Metadata } from "next";
import { Booth } from "@/components/Booth";
import { pageMetadata } from "@/i18n/seo";
import { resolveLocale, type LangParams } from "../params";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return pageMetadata(await resolveLocale(params), "booth");
}

export default function BoothPage() {
  return <Booth />;
}
