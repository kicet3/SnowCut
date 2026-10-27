import { describe, expect, it } from "vitest";
import { LAYOUT_KEYS } from "./frame";
import { PAPER_MM, SHEET, contentRect, marginFit, pagesFor, printCounts, sheetPlan } from "./print";

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

describe("여백 포함 인쇄", () => {
  it("모든 변에 여백 이상을 남기고 용지 크기를 넘지 않는다", () => {
    const f = marginFit(6);
    expect(f.padX).toBeGreaterThanOrEqual(6);
    expect(f.padY).toBeGreaterThanOrEqual(6);
    expect(f.w + f.padX * 2).toBeCloseTo(PAPER_MM.w, 5);
    expect(f.h + f.padY * 2).toBeCloseTo(PAPER_MM.h, 5);
    // 시트 비율 유지
    expect(f.w / f.h).toBeCloseTo(PAPER_MM.w / PAPER_MM.h, 3);
  });
});

describe("테두리 없는 인쇄 여유", () => {
  it("사방에 여유 이상을 남기고 시트 비율을 지킨다", () => {
    const r = contentRect(3);
    const px = SHEET.w / PAPER_MM.w; // 1mm당 px
    expect(r.x).toBeGreaterThanOrEqual(Math.floor(3 * px) - 1);
    expect(r.y).toBeGreaterThanOrEqual(Math.floor(3 * px) - 1);
    expect(r.x * 2 + r.w).toBeLessThanOrEqual(SHEET.w);
    expect(r.y * 2 + r.h).toBeLessThanOrEqual(SHEET.h);
    expect(r.w / r.h).toBeCloseTo(SHEET.w / SHEET.h, 2);
  });

  it("여유가 0이면 시트 전체", () => {
    expect(contentRect(0)).toEqual({ x: 0, y: 0, w: SHEET.w, h: SHEET.h });
  });
});
