import type { MetadataRoute } from "next";
import { webManifest } from "@/i18n/manifest";

export const dynamic = "force-static";

// 한국어(기본) 매니페스트. 다른 언어는 (intl)/[lang]/manifest.webmanifest
export default function manifest(): MetadataRoute.Manifest {
  return webManifest("ko");
}
