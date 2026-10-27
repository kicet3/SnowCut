import type { ReactNode } from "react";
import { SiteDocument, siteViewport } from "@/components/site/SiteDocument";
import { langStaticParams, resolveLocale, type LangParams } from "./params";

export const viewport = siteViewport;
export const dynamicParams = false;
export const generateStaticParams = langStaticParams;

export default async function LocaleLayout({ children, params }: LangParams & { children: ReactNode }) {
  return <SiteDocument locale={await resolveLocale(params)}>{children}</SiteDocument>;
}
