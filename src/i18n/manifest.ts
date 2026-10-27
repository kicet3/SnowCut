import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, HTML_LANG, type Locale } from "./config";
import { getMessages } from "./messages";

/**
 * 언어별 웹 앱 매니페스트. 한국어는 /manifest.webmanifest, 다른 언어는 /<언어>/manifest.webmanifest.
 * 주소는 매니페스트 파일 기준 상대 경로라 basePath(GitHub Pages 하위 경로)에서도 맞는다.
 * 홈 화면에서 열면 메인 페이지 대신 바로 그 언어의 촬영 화면으로 들어간다.
 */
export function webManifest(locale: Locale): MetadataRoute.Manifest {
  const icons = locale === DEFAULT_LOCALE ? "./icons" : "../icons";
  return {
    name: "SnowCut",
    short_name: "SnowCut",
    description: getMessages(locale).meta.siteDescription,
    lang: HTML_LANG[locale],
    categories: ["photo", "entertainment"],
    start_url: "./booth",
    scope: "./",
    display: "standalone",
    background_color: "#1a1315",
    theme_color: "#1a1315",
    icons: [
      { src: `${icons}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${icons}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
  };
}
