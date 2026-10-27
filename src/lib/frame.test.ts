import { describe, expect, it } from "vitest";
import { LAYOUTS, LAYOUT_KEYS, captionRect, compatibleLayouts, fileNameFor, formatDate, photoRects, type Rect } from "./frame";

const inside = (outer: Rect, r: Rect) => r.x >= outer.x && r.y >= outer.y && r.x + r.w <= outer.x + outer.w && r.y + r.h <= outer.y + outer.h;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe.each(LAYOUT_KEYS)("%s 레이아웃", (key) => {
  const { width, height } = LAYOUTS[key].canvas;
  const canvas = { x: 0, y: 0, w: width, h: height };
  const rects = photoRects(key);

  it("사진 칸이 장수만큼 있고 캔버스 안에 있다", () => {
    expect(rects).toHaveLength(LAYOUTS[key].count);
    for (const r of rects) expect(inside(canvas, r)).toBe(true);
    expect(inside(canvas, captionRect(key))).toBe(true);
  });

  it("칸끼리, 그리고 문구 영역과 겹치지 않는다", () => {
    for (let i = 0; i < rects.length; i++) {
      expect(overlaps(rects[i], captionRect(key))).toBe(false);
      for (let j = i + 1; j < rects.length; j++) expect(overlaps(rects[i], rects[j])).toBe(false);
    }
  });

  it("칸이 너무 납작하거나 길쭉하지 않다 (카메라 4:3에서 잘라 쓸 수 있게)", () => {
    for (const r of rects) {
      expect(r.w / r.h).toBeGreaterThan(0.5);
      expect(r.w / r.h).toBeLessThan(2);
    }
  });

  it("날짜 칸이 글자를 넣을 만큼 크다", () => {
    const cap = captionRect(key);
    expect(Math.min(cap.w, cap.h)).toBeGreaterThan(200);
  });
});

describe("날짜 표기", () => {
  const d = new Date(2026, 0, 5, 9, 7, 3);
  it("사진 하단 날짜", () => expect(formatDate(d)).toBe("2026.01.05"));
  it("저장 파일 이름", () => expect(fileNameFor(d)).toBe("snowcut-20260105-090703.jpg"));
  it("영상 파일 이름", () => expect(fileNameFor(d, "mp4")).toBe("snowcut-20260105-090703.mp4"));
});

describe("레이아웃 바꾸기", () => {
  it("찍은 장수가 같은 레이아웃끼리만 바꿀 수 있다", () => {
    expect(compatibleLayouts("strip")).toEqual(expect.arrayContaining(["strip", "grid", "wide", "hero"]));
    expect(compatibleLayouts("grid6")).toEqual(["grid6"]);
    expect(compatibleLayouts("strip3")).toEqual(["strip3"]);
  });
});
