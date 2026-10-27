import { notFound } from "next/navigation";
import { PREFIXED_LOCALES, isLocale, type Locale } from "@/i18n/config";

export type LangParams = { params: Promise<{ lang: string }> };

/** /en, /ja, /zh 만 미리 만든다. 한국어는 (ko) 아래 접두사 없는 주소. */
export function langStaticParams() {
  return PREFIXED_LOCALES.map((lang) => ({ lang }));
}

export async function resolveLocale(params: LangParams["params"]): Promise<Exclude<Locale, "ko">> {
  const { lang } = await params;
  if (!isLocale(lang) || lang === "ko") notFound();
  return lang;
}
