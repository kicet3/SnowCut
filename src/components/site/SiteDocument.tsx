import type { Viewport } from "next";
import { Black_Han_Sans, IBM_Plex_Sans_KR, Jua } from "next/font/google";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE, HTML_LANG, geoRedirectScript, type Locale } from "@/i18n/config";
import { I18nProvider } from "@/i18n/I18nProvider";
import "@/app/globals.css";

// 한글 글꼴은 미리 불러올 subset이 없어서 preload를 끈다. 필요한 글자 범위만 그때그때 받는다.
const display = Black_Han_Sans({ weight: "400", preload: false, display: "swap", variable: "--font-display-face" });
const body = IBM_Plex_Sans_KR({ weight: ["400", "500", "700"], preload: false, display: "swap", variable: "--font-body-face" });
const print = Jua({ weight: "400", preload: false, display: "swap", variable: "--font-print-face" });

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const siteViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1315",
};

/**
 * 두 루트 레이아웃((ko)와 (intl)/[lang])이 같이 쓰는 문서 뼈대.
 * Vercel이 아닌 곳에 올리면 한국어 페이지에서 시간대로 나라를 짐작해 언어 주소로 옮긴다 (Vercel은 vercel.json이 IP로 처리).
 */
export function SiteDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  const geo = locale === DEFAULT_LOCALE && !process.env.VERCEL;
  return (
    <html lang={HTML_LANG[locale]} data-locale={locale} className={`${display.variable} ${body.variable} ${print.variable}`}>
      {geo && (
        <head>
          <script dangerouslySetInnerHTML={{ __html: geoRedirectScript(BASE) }} />
        </head>
      )}
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
