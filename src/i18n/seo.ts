import type { Metadata } from "next";
import { ADSENSE_CLIENT } from "@/lib/ads";
import { GOOGLE_VERIFICATION, NAVER_VERIFICATION, SITE_NAME, SITE_URL, languageAlternates, localeUrl, ogImage } from "@/lib/site";
import { DEFAULT_LOCALE, LOCALES, OG_LOCALE, localePath, type Locale } from "./config";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
import { getMessages } from "./messages";

export type PageKey = "home" | "booth" | "privacy";

const PATH: Record<PageKey, string> = { home: "/", booth: "/booth", privacy: "/privacy" };

/** 언어·페이지별 메타데이터: 제목, 설명, canonical, hreflang, Open Graph, 트위터 카드 */
export function pageMetadata(locale: Locale, page: PageKey): Metadata {
  const m = getMessages(locale).meta;
  const path = PATH[page];
  const title = page === "home" ? m.siteTitle : page === "booth" ? `${m.boothTitle} · ${SITE_NAME}` : `${m.privacyTitle} · ${SITE_NAME}`;
  const description = page === "home" ? m.siteDescription : page === "booth" ? m.boothDescription : m.privacyDescription;
  const url = localeUrl(locale, path);
  const image = { url: ogImage(locale), width: 1200, height: 630, alt: m.ogAlt };

  const other: Record<string, string> = {};
  if (NAVER_VERIFICATION) other["naver-site-verification"] = NAVER_VERIFICATION;

  // 애드센스 사이트 소유 확인. 광고 스크립트는 광고를 켰을 때만 넣으므로 확인은 메타 태그로 한다.
  const adsense: Record<string, string> = ADSENSE_CLIENT ? { "google-adsense-account": ADSENSE_CLIENT } : {};

  return {
    metadataBase: new URL(`${SITE_URL}/`),
    title: { absolute: title },
    description,
    keywords: m.keywords,
    applicationName: SITE_NAME,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    verification: { google: GOOGLE_VERIFICATION || undefined, other },
    formatDetection: { telephone: false, email: false, address: false },
    category: "photography",
    appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
    other: adsense,
    // 다른 언어는 그 언어의 매니페스트 (홈 화면 앱이 그 언어의 촬영 화면으로 열리게)
    ...(locale === DEFAULT_LOCALE ? {} : { manifest: `${BASE}${localePath(locale, "/manifest.webmanifest")}` }),
  };
}
