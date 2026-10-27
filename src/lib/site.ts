/**
 * 검색엔진(SEO)·생성형 AI 검색(GEO)에 쓰는 사이트 정보. 메타데이터, 구조화 데이터(JSON-LD), sitemap, llms.txt가 같은 값을 쓴다.
 *   NEXT_PUBLIC_SITE_URL=https://snowcut.vercel.app   (정식 주소. 없으면 이 값)
 *   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION / NEXT_PUBLIC_NAVER_SITE_VERIFICATION = 서치 콘솔 · 서치어드바이저 소유 확인 값
 */
import { HTML_LANG, LOCALES, LOCALE_NAMES, localePath, type Locale } from "../i18n/config";
import type { Messages } from "../i18n/messages";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 끝 / 없는 사이트 주소 (basePath 포함) */
export const SITE_URL = ((process.env.NEXT_PUBLIC_SITE_URL || "https://snowcut.vercel.app").replace(/\/+$/, "") + BASE_PATH).replace(/\/+$/, "");

export const SITE_NAME = "SnowCut";

/** 커스텀 캐릭터(누끼) 기능. 준비가 끝나면 NEXT_PUBLIC_ENABLE_CHARACTER=1 로 켠다. */
export const CHARACTER_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CHARACTER === "1";

export const GOOGLE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "";
export const NAVER_VERIFICATION = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ?? "";

/** 사이트 안 경로를 절대 주소로 */
export function absoluteUrl(path: string): string {
  // 루트는 끝 / 없이 (Next가 canonical·hreflang에 쓰는 모양과 sitemap을 맞춘다)
  if (path === "/" || path === "") return SITE_URL;
  return SITE_URL + (path.startsWith("/") ? path : `/${path}`);
}

/** 사이트 안 경로(언어 접두사 포함)를 절대 주소로 */
export function localeUrl(locale: Locale, path = "/"): string {
  return absoluteUrl(localePath(locale, path));
}

/** 언어별 주소 표 (hreflang). x-default는 표에 없는 나라가 가게 되는 영어 주소. */
export function languageAlternates(path = "/"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[HTML_LANG[l]] = localeUrl(l, path);
  out["x-default"] = localeUrl("en", path);
  return out;
}

export function ogImage(locale: Locale): string {
  return absoluteUrl(`/og/og-${locale}.png`);
}

/** 메인 페이지 구조화 데이터: 사이트 · 웹앱 · 자주 묻는 질문 · 사용법 */
export function homeJsonLd(locale: Locale, m: Messages) {
  const home = localeUrl(locale, "/");
  const features = [...m.home.features.items, m.home.features.character]
    .filter((f) => CHARACTER_ENABLED || f !== m.home.features.character)
    .map((f) => `${f.title}: ${f.body}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        url: home,
        name: SITE_NAME,
        alternateName: ["스노우컷", "SnowCut Photo Booth"],
        description: m.meta.siteDescription,
        inLanguage: HTML_LANG[locale],
      },
      {
        "@type": "WebApplication",
        "@id": `${home}#app`,
        name: SITE_NAME,
        url: home,
        description: m.meta.siteDescription,
        applicationCategory: "PhotographyApplication",
        applicationSubCategory: m.meta.appCategory,
        operatingSystem: m.meta.operatingSystem,
        browserRequirements: m.meta.browserRequirements,
        inLanguage: LOCALES.map((l) => HTML_LANG[l]),
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: features,
        image: ogImage(locale),
        potentialAction: { "@type": "UseAction", target: localeUrl(locale, "/booth") },
      },
      {
        "@type": "FAQPage",
        "@id": `${home}#faq`,
        inLanguage: HTML_LANG[locale],
        mainEntity: m.home.faq.items.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "HowTo",
        "@id": `${home}#howto`,
        name: m.meta.howToName,
        inLanguage: HTML_LANG[locale],
        totalTime: "PT3M",
        step: m.home.how.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.body,
          url: `${home}#how`,
        })),
      },
    ],
  };
}

/** <script type="application/ld+json">에 넣을 문자열. </script> 주입을 막도록 <를 이스케이프한다. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** 생성형 AI 검색용 요약 (https://llmstxt.org 형식). 영어 본문에 언어별 주소를 함께 싣는다. */
export function llmsTxt(en: Messages, all: Record<Locale, Messages>): string {
  const features = [...en.home.features.items, ...(CHARACTER_ENABLED ? [en.home.features.character] : [])];
  return [
    `# ${SITE_NAME}`,
    "",
    `> ${en.meta.siteDescription}`,
    "",
    en.home.about.body,
    "",
    "## Pages",
    "",
    ...LOCALES.map(
      (l) =>
        `- ${LOCALE_NAMES[l]}: [${all[l].meta.siteTitle}](${localeUrl(l, "/")}) · [${all[l].meta.boothTitle}](${localeUrl(l, "/booth")}) · [${all[l].meta.privacyTitle}](${localeUrl(l, "/privacy")})`,
    ),
    "",
    "## Features",
    "",
    ...features.map((f) => `- ${f.title}: ${f.body}`),
    "",
    "## How it works",
    "",
    ...en.home.how.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`),
    "",
    "## FAQ",
    "",
    ...en.home.faq.items.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
  ].join("\n");
}
