import type { Viewport } from "next";
import { HomeView } from "@/components/site/HomeView";
import { pageMetadata } from "@/i18n/seo";

export const metadata = pageMetadata("ko", "home");
// 메인 페이지만 밝은 테마라서 브라우저 상단 색도 맞춘다.
export const viewport: Viewport = { themeColor: "#fff5f7" };

export default function Home() {
  return <HomeView locale="ko" />;
}
