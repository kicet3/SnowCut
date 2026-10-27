"use client";

import { LOCALES, LOCALE_NAMES, langCookie, localePath, splitLocale, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 언어 고르기. 고른 언어는 쿠키에 남겨서 나라에 따른 자동 이동보다 우선한다. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, m } = useI18n();

  const change = (next: Locale) => {
    document.cookie = langCookie(next);
    let p = location.pathname;
    if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length);
    // /index.html · /booth.html 처럼 파일 이름으로 열었어도 같은 페이지로 옮긴다.
    const { path } = splitLocale(p.replace(/\.html$/, "").replace(/\/index$/, "") || "/");
    // 촬영 화면은 전체를 새로 불러와야 해서(다른 루트 레이아웃) 일반 이동을 쓴다.
    location.assign(BASE + localePath(next, path) + location.search + location.hash);
  };

  return (
    <label className={`lang-switch${className ? ` ${className}` : ""}`}>
      <span className="sr-only">{m.common.language}</span>
      <span aria-hidden>🌐</span>
      <select value={locale} onChange={(e) => change(e.target.value as Locale)} aria-label={m.common.language}>
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
