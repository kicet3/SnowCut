import type { MetadataRoute } from "next";
import { LOCALES } from "@/i18n/config";
import { languageAlternates, localeUrl } from "@/lib/site";

export const dynamic = "force-static";

const PAGES = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/booth", priority: 0.8, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
] as const;

/** 언어마다 한 줄씩, 각 줄에 같은 페이지의 다른 언어 주소(hreflang)를 함께 싣는다. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((p) =>
    LOCALES.map((l) => ({
      url: localeUrl(l, p.path),
      changeFrequency: p.changeFrequency,
      priority: p.priority,
      alternates: { languages: languageAlternates(p.path) },
    })),
  );
}
