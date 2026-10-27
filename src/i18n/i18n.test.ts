import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { LAYOUT_KEYS } from "../lib/frame";
import { FRAMES, FRAME_CATEGORIES } from "../lib/frames";
import { FILTERS } from "../lib/look/presets";
import {
  BOT_PATTERN,
  COUNTRY_LOCALE,
  LOCALES,
  geoRedirectScript,
  localeForCountry,
  localeForTimeZone,
  localePath,
  splitLocale,
  type Locale,
} from "./config";
import { MESSAGES, type Messages } from "./messages";

/** 문구 트리의 모양 (문자열·함수·배열 길이) */
function shape(v: unknown): unknown {
  if (typeof v === "function") return `fn/${v.length}`;
  if (Array.isArray(v)) return v.map(shape);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, shape((v as Record<string, unknown>)[k])]));
  return typeof v;
}

describe("언어별 문구", () => {
  for (const l of LOCALES) {
    it(`${l}: 한국어와 같은 키·배열 길이·함수 인자 수`, () => {
      expect(shape(MESSAGES[l])).toEqual(shape(MESSAGES.ko));
    });
    it(`${l}: 빈 문구가 없다`, () => {
      const empty: string[] = [];
      const walk = (v: unknown, path: string) => {
        if (typeof v === "string" && !v.trim()) empty.push(path);
        else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
      };
      walk(MESSAGES[l], l);
      expect(empty).toEqual([]);
    });
  }

  it("레이아웃·프레임·필터 이름이 실제 목록과 맞는다", () => {
    const c: Messages["catalog"] = MESSAGES.ko.catalog;
    expect(Object.keys(c.layouts).sort()).toEqual([...LAYOUT_KEYS].sort());
    expect(Object.keys(c.frames).sort()).toEqual(FRAMES.map((f) => f.id).sort());
    expect(Object.keys(c.frameCategories).sort()).toEqual(FRAME_CATEGORIES.map((f) => f.id).sort());
    expect(Object.keys(c.filters).sort()).toEqual(FILTERS.map((f) => f.id).sort());
  });
});

describe("언어 주소", () => {
  it("한국어는 접두사 없이, 나머지는 /언어 아래", () => {
    expect(localePath("ko")).toBe("/");
    expect(localePath("ko", "/booth")).toBe("/booth");
    expect(localePath("en")).toBe("/en");
    expect(localePath("ja", "/booth")).toBe("/ja/booth");
  });
  it("주소에서 언어를 떼어 낸다", () => {
    expect(splitLocale("/")).toEqual({ locale: "ko", path: "/" });
    expect(splitLocale("/booth")).toEqual({ locale: "ko", path: "/booth" });
    expect(splitLocale("/zh")).toEqual({ locale: "zh", path: "/" });
    expect(splitLocale("/en/privacy")).toEqual({ locale: "en", path: "/privacy" });
    expect(splitLocale("/ko/booth")).toEqual({ locale: "ko", path: "/ko/booth" });
  });
});

describe("나라 → 언어", () => {
  it("한국·일본·중화권은 각 언어, 나머지는 영어", () => {
    expect(localeForCountry("KR")).toBe("ko");
    expect(localeForCountry("jp")).toBe("ja");
    expect(localeForCountry("TW")).toBe("zh");
    expect(localeForCountry("US")).toBe("en");
    expect(localeForCountry(undefined)).toBe("en");
  });
  it("시간대로 짐작한다", () => {
    expect(localeForTimeZone("Asia/Seoul")).toBe("ko");
    expect(localeForTimeZone("Asia/Tokyo")).toBe("ja");
    expect(localeForTimeZone("Asia/Shanghai")).toBe("zh");
    expect(localeForTimeZone("Europe/Paris")).toBe("en");
    expect(localeForTimeZone("")).toBeNull();
  });
});

/** 인라인 스크립트를 가짜 브라우저에서 돌려 이동할 주소를 받는다 (이동하지 않으면 null). */
function runGeo(o: { tz: string; cookie?: string; ua?: string; path?: string; base?: string }): string | null {
  let to: string | null = null;
  const ctx = {
    document: { cookie: o.cookie ?? "" },
    navigator: { userAgent: o.ua ?? "Mozilla/5.0 Safari" },
    location: { pathname: o.path ?? "/", search: "?a=1", hash: "", replace: (u: string) => (to = u) },
    Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: o.tz }) }) },
  };
  vm.runInNewContext(geoRedirectScript(o.base ?? ""), ctx);
  return to;
}

describe("시간대 기반 이동 스크립트", () => {
  it("한국 시간대면 그대로", () => expect(runGeo({ tz: "Asia/Seoul" })).toBeNull());
  it("다른 나라면 그 언어 주소로 (경로·검색어 유지)", () => {
    expect(runGeo({ tz: "Asia/Tokyo", path: "/booth" })).toBe("/ja/booth?a=1");
    expect(runGeo({ tz: "America/New_York" })).toBe("/en?a=1");
    expect(runGeo({ tz: "Asia/Taipei", path: "/privacy", base: "/SnowCut" })).toBe("/SnowCut/zh/privacy?a=1");
  });
  it("basePath 아래 경로도 처리한다", () => {
    expect(runGeo({ tz: "Asia/Tokyo", path: "/SnowCut/booth", base: "/SnowCut" })).toBe("/SnowCut/ja/booth?a=1");
  });
  it("고른 언어가 있으면 시간대보다 그 언어로, 한국어를 골랐으면 그대로", () => {
    expect(runGeo({ tz: "Asia/Tokyo", cookie: "x=1; lang=ko" })).toBeNull();
    expect(runGeo({ tz: "Asia/Seoul", cookie: "lang=en", path: "/booth" })).toBe("/en/booth?a=1");
    expect(runGeo({ tz: "Asia/Tokyo", cookie: "lang=zh" })).toBe("/zh?a=1");
    expect(runGeo({ tz: "Asia/Tokyo", cookie: "lang=xx" })).toBeNull();
  });
  it("봇이면 옮기지 않는다", () => {
    expect(runGeo({ tz: "Asia/Tokyo", cookie: "lang=en", ua: "Googlebot/2.1" })).toBeNull();
    expect(runGeo({ tz: "America/New_York", ua: "Mediapartners-Google" })).toBeNull();
    expect(runGeo({ tz: "America/New_York", ua: "Mozilla/5.0 (compatible; Googlebot/2.1)" })).toBeNull();
    expect(runGeo({ tz: "America/New_York", ua: "Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)" })).toBeNull();
  });
});

describe("vercel.json 나라별 이동", () => {
  const cfg = JSON.parse(readFileSync("vercel.json", "utf8")) as {
    redirects: {
      source: string;
      destination: string;
      permanent: boolean;
      has: { type: string; key: string; value?: string }[];
      missing: { type: string; key: string; value?: string }[];
    }[];
  };

  /** 규칙을 Vercel처럼 평가: 첫 번째로 맞는 규칙의 목적지 */
  function route(path: string, country: string, opts: { lang?: string; ua?: string } = {}): string | null {
    const ua = opts.ua ?? "Mozilla/5.0 Safari";
    const value = (type: string, key: string) =>
      type === "cookie" ? (key === "lang" ? opts.lang : undefined) : key === "x-vercel-ip-country" ? country : key === "user-agent" ? ua : undefined;
    for (const r of cfg.redirects) {
      if (r.source !== path) continue;
      const groups: Record<string, string> = {};
      const ok = r.has.every((h) => {
        const v = value(h.type, h.key);
        if (v === undefined) return false;
        if (!h.value) return true;
        const m = new RegExp(h.value).exec(v);
        Object.assign(groups, m?.groups);
        return !!m;
      });
      const miss = r.missing.every((m) => {
        const v = value(m.type, m.key);
        return v === undefined || (m.value ? !new RegExp(m.value).test(v) : false);
      });
      if (ok && miss) return r.destination.replace(/:(\w+)/g, (_, k: string) => groups[k]);
    }
    return null;
  }

  it("모든 나라 규칙이 config의 COUNTRY_LOCALE과 같다", () => {
    for (const [country, locale] of Object.entries(COUNTRY_LOCALE) as [string, Locale][]) {
      for (const p of ["/", "/booth", "/privacy"]) {
        expect(route(p, country)).toBe(locale === "ko" ? null : localePath(locale, p));
      }
    }
    expect(route("/booth", "US")).toBe("/en/booth");
    expect(route("/", "FR")).toBe("/en");
  });
  it("고른 언어(쿠키)가 나라보다 우선한다", () => {
    expect(route("/", "JP", { lang: "ko" })).toBeNull();
    expect(route("/booth", "KR", { lang: "en" })).toBe("/en/booth");
    expect(route("/privacy", "US", { lang: "ja" })).toBe("/ja/privacy");
    expect(route("/", "JP", { lang: "zh" })).toBe("/zh");
    expect(route("/", "JP", { lang: "xx" })).toBeNull();
  });
  it("봇 목록이 인라인 스크립트(BOT_PATTERN)와 같다", () => {
    const uas = ["Googlebot/2.1", "Mediapartners-Google", "Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)", "GPTBot/1.0", "ChatGPT-User/1.0", "PerplexityBot", "facebookexternalhit/1.1", "kakaotalk-scrap/1.0", "Yeti/1.1"];
    for (const ua of uas) {
      expect(new RegExp(BOT_PATTERN, "i").test(ua)).toBe(true);
      expect(route("/", "US", { ua })).toBeNull();
    }
  });
  it("임시 이동이고, 봇이면 옮기지 않는다", () => {
    expect(cfg.redirects.every((r) => r.permanent === false)).toBe(true);
    expect(route("/", "US", { ua: "Mozilla/5.0 (compatible; bingbot/2.0)" })).toBeNull();
    expect(route("/", "US", { ua: "GPTBot/1.0" })).toBeNull();
  });
});
