import type { ReactNode } from "react";
import { SiteDocument, siteViewport } from "@/components/site/SiteDocument";

export const viewport = siteViewport;

// 한국어(기본 언어)는 접두사 없는 주소: /, /booth, /privacy
export default function KoreanLayout({ children }: { children: ReactNode }) {
  return <SiteDocument locale="ko">{children}</SiteDocument>;
}
