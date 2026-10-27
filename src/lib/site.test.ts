import { describe, expect, it } from "vitest";
import { MESSAGES } from "../i18n/messages";
import { absoluteUrl, homeJsonLd, jsonLdScript, languageAlternates, llmsTxt, localeUrl } from "./site";

describe("사이트 주소", () => {
  it("루트는 끝 / 없이, 나머지는 경로를 붙인다", () => {
    expect(absoluteUrl("/")).toBe("https://snowcut.vercel.app");
    expect(absoluteUrl("/booth")).toBe("https://snowcut.vercel.app/booth");
    expect(localeUrl("ja", "/booth")).toBe("https://snowcut.vercel.app/ja/booth");
  });
  it("hreflang 표에 모든 언어와 x-default(영어)가 있다", () => {
    expect(languageAlternates("/privacy")).toEqual({
      ko: "https://snowcut.vercel.app/privacy",
      en: "https://snowcut.vercel.app/en/privacy",
      ja: "https://snowcut.vercel.app/ja/privacy",
      "zh-Hans": "https://snowcut.vercel.app/zh/privacy",
      "x-default": "https://snowcut.vercel.app/en/privacy",
    });
  });
});

describe("구조화 데이터", () => {
  const ld = homeJsonLd("en", MESSAGES.en) as { "@graph": Record<string, unknown>[] };
  it("사이트·웹앱·FAQ·사용법을 한 그래프로", () => {
    expect(ld["@graph"].map((g) => g["@type"])).toEqual(["WebSite", "WebApplication", "FAQPage", "HowTo"]);
  });
  it("FAQ는 화면의 질문과 같다", () => {
    const faq = ld["@graph"][2] as { mainEntity: { name: string }[] };
    expect(faq.mainEntity.map((q) => q.name)).toEqual(MESSAGES.en.home.faq.items.map((f) => f.q));
  });
  it("꺼진 커스텀 캐릭터는 기능 목록에 넣지 않는다", () => {
    const app = ld["@graph"][1] as { featureList: string[] };
    expect(app.featureList.some((f) => f.startsWith(MESSAGES.en.home.features.character.title))).toBe(false);
  });
  it("</script>로 빠져나가지 못하게 <를 이스케이프한다", () => {
    expect(jsonLdScript({ a: "</script><x>" })).not.toContain("<");
  });
});

describe("llms.txt", () => {
  it("모든 언어의 주소와 FAQ를 싣는다", () => {
    const txt = llmsTxt(MESSAGES.en, MESSAGES);
    expect(txt.startsWith("# SnowCut")).toBe(true);
    for (const u of ["https://snowcut.vercel.app/booth", "https://snowcut.vercel.app/en/booth", "https://snowcut.vercel.app/ja", "https://snowcut.vercel.app/zh/privacy"]) {
      expect(txt).toContain(u);
    }
    for (const f of MESSAGES.en.home.faq.items) expect(txt).toContain(f.q);
  });
});
