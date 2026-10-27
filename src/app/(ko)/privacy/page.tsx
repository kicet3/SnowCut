import type { Viewport } from "next";
import { PrivacyView } from "@/components/site/PrivacyView";
import { pageMetadata } from "@/i18n/seo";

export const metadata = pageMetadata("ko", "privacy");
export const viewport: Viewport = { themeColor: "#fff5f7" };

export default function Privacy() {
  return <PrivacyView locale="ko" />;
}
