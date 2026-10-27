import { describe, expect, it } from "vitest";
import { LAYOUT_KEYS } from "./frame";
import { PAPER_MM, SHEET, pagesFor, printCounts, sheetPlan } from "./print";

describe("SELPHY 엽서 인쇄", () => {
  it("시트는 100×148mm를 600dpi로 그린 크기다", () => {
    expect(SHEET.w / SHEET.h).toBeCloseTo(PAPER_MM.w / PAPER_MM.h, 3);
    expect(SHEET).toEqual({ w: 2362, h: 3496 });
  });

  it("스트립은 두 줄, 가로 스트립은 세워서 두 줄, 4×6은 한 장", () => {
    expect(sheetPlan("strip")).toEqual({ copies: 2, rotate: false });
    expect(sheetPlan("strip3")).toEqual({ copies: 2, rotate: false });
    expect(sheetPlan("wide")).toEqual({ copies: 2, rotate: true });
    for (const k of ["grid", "grid6", "hero"] as const) expect(sheetPlan(k)).toEqual({ copies: 1, rotate: false });
    expect(LAYOUT_KEYS).toHaveLength(6);
  });

  it("수량은 스트립·가로 4컷은 2의 배수, 나머지는 1장 단위", () => {
    expect(printCounts("strip").slice(0, 3)).toEqual([2, 4, 6]);
    expect(printCounts("wide").slice(0, 3)).toEqual([2, 4, 6]);
    expect(printCounts("grid").slice(0, 3)).toEqual([1, 2, 3]);
    expect(pagesFor("strip3", 6)).toBe(3);
    expect(pagesFor("hero", 2)).toBe(2);
  });
});
