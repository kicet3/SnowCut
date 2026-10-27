import { describe, expect, it } from "vitest";
import { coverCrop } from "./canvas";

describe("칸에 보이는 영역", () => {
  it("가로로 긴 사진은 좌우를 잘라 칸 비율에 맞춘다", () => {
    const c = coverCrop(1600, 900, { w: 1000, h: 1000 });
    expect(c).toEqual({ x: 350, y: 0, w: 900, h: 900 });
  });
  it("세로로 긴 사진은 위아래를 잘라 가운데를 쓴다", () => {
    const c = coverCrop(900, 1600, { w: 1440, h: 1000 });
    expect(c.x).toBe(0);
    expect(c.w).toBe(900);
    expect(c.h).toBeCloseTo(625);
    expect(c.y).toBeCloseTo((1600 - 625) / 2);
  });
});
