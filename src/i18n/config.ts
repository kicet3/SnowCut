/**
 * 다국어 설정. 한국어는 기존 주소(/, /booth, /privacy)를 그대로 쓰고, 다른 언어는 /en, /ja, /zh 아래에 둔다.
 *
 * 접속한 나라에 맞는 언어로 보내는 방법 (사용자가 언어를 직접 고르면 lang 쿠키를 남기고 더 이상 옮기지 않는다):
 * - Vercel: vercel.json의 redirects가 접속 IP의 나라(x-vercel-ip-country)를 보고 한국어 주소에서 해당 언어 주소로 보낸다.
 * - 그 밖의 정적 호스팅: 한국어 페이지의 인라인 스크립트가 브라우저 시간대로 나라를 짐작해 옮긴다 (geoRedirectScript).
 * 검색엔진 봇은 옮기지 않는다. 언어별 주소는 hreflang으로 알린다.
 */
export const LOCALES = ["ko", "en", "ja", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ko";
/** 기본 언어가 아닌 언어 (주소 앞에 붙는다) */
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE) as Exclude<Locale, "ko">[];

export const LOCALE_NAMES: Record<Locale, string> = { ko: "한국어", en: "English", ja: "日本語", zh: "简体中文" };
/** <html lang> · hreflang 값 */
export const HTML_LANG: Record<Locale, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh-Hans" };
export const OG_LOCALE: Record<Locale, string> = { ko: "ko_KR", en: "en_US", ja: "ja_JP", zh: "zh_CN" };

/** 나라(ISO 3166-1 alpha-2) → 언어. 여기에 없는 나라는 영어. */
export const COUNTRY_LOCALE: Record<string, Locale> = {
  KR: "ko",
  JP: "ja",
  CN: "zh",
  TW: "zh",
  HK: "zh",
  MO: "zh",
};

/** IP를 모를 때 나라를 짐작하는 시간대. 여기에 없는 시간대는 위 표에 없는 나라로 본다. */
export const TIMEZONE_COUNTRY: Record<string, string> = {
  "Asia/Seoul": "KR",
  "Asia/Tokyo": "JP",
  "Asia/Shanghai": "CN",
  "Asia/Chongqing": "CN",
  "Asia/Chungking": "CN",
  "Asia/Harbin": "CN",
  "Asia/Urumqi": "CN",
  "Asia/Kashgar": "CN",
  "PRC": "CN",
  "Asia/Hong_Kong": "HK",
  "Hongkong": "HK",
  "Asia/Macau": "MO",
  "Asia/Macao": "MO",
  "Asia/Taipei": "TW",
  "ROC": "TW",
  "Japan": "JP",
  "ROK": "KR",
};

export const LANG_COOKIE = "lang";
/** 옮기지 않을 검색엔진·미리보기 봇 (vercel.json과 같은 목록) */
export const BOT_PATTERN =
  "bot|crawl|spider|slurp|yeti|daum|bytespider|facebookexternalhit|embedly|preview|mediapartners-google|google-inspectiontool|google-read-aloud|googleother|google-extended|apis-google|-user/|perplexity|whatsapp|kakaotalk-scrap";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function localeForCountry(country: string | null | undefined): Locale {
  return COUNTRY_LOCALE[(country ?? "").toUpperCase()] ?? "en";
}

/** 시간대로 짐작한 언어. 시간대를 모르면 null (옮기지 않는다). */
export function localeForTimeZone(timeZone: string | null | undefined): Locale | null {
  if (!timeZone) return null;
  return localeForCountry(TIMEZONE_COUNTRY[timeZone]);
}

/** 언어별 주소 (basePath 제외). path는 "/" 또는 "/booth" 처럼 쓴다. */
export function localePath(locale: Locale, path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return p;
  return `/${locale}${p === "/" ? "" : p}`;
}

/** 주소에서 언어를 떼어 낸다 ("/en/booth" → { locale: "en", path: "/booth" }). basePath는 미리 떼고 넘긴다. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const m = /^\/([^/]+)(\/.*)?$/.exec(pathname);
  if (m && isLocale(m[1]) && m[1] !== DEFAULT_LOCALE) return { locale: m[1], path: m[2] || "/" };
  return { locale: DEFAULT_LOCALE, path: pathname || "/" };
}

/**
 * 한국어 페이지 <head>에 넣는 인라인 스크립트. 봇이 아니면
 * - 언어를 고른 적이 있으면(lang 쿠키) 그 언어 주소로,
 * - 아니면 시간대로 나라를 짐작해 그 언어 주소로 옮긴다.
 * 화면이 그려지기 전에 실행되도록 외부 파일 없이 문자열로 만든다.
 */
export function geoRedirectScript(basePath: string): string {
  const PREFIXED: string[] = PREFIXED_LOCALES;
  const tz: Record<string, Locale> = {};
  for (const [zone, country] of Object.entries(TIMEZONE_COUNTRY)) tz[zone] = localeForCountry(country);
  const js = `(function(){try{
if(new RegExp(${JSON.stringify(BOT_PATTERN)},"i").test(navigator.userAgent||""))return;
var k=/(?:^|;\\s*)${LANG_COOKIE}=([^;]*)/.exec(document.cookie),l;
if(k){l=k[1];if(${JSON.stringify(PREFIXED)}.indexOf(l)<0)return;}
else{var z=Intl.DateTimeFormat().resolvedOptions().timeZone;if(!z)return;l=${JSON.stringify(tz)}[z]||"en";if(l==="${DEFAULT_LOCALE}")return;}
var b=${JSON.stringify(basePath)},p=location.pathname;if(b&&p.indexOf(b)===0)p=p.slice(b.length);
if(!p||p==="/")p="";
location.replace(b+"/"+l+p+location.search+location.hash);
}catch(e){}})();`;
  return js.replace(/\n/g, "");
}

/** 언어를 고르면 쿠키에 남긴다 (1년). 나라에 따른 자동 이동보다 우선한다. */
export function langCookie(locale: Locale): string {
  return `${LANG_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
