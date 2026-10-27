import { describe, expect, it } from "vitest";
import { coverTransform, findContentRect, similarRect } from "./letterbox";

/** w×h 화면에서 rect 안만 밝게(회색 잡음 포함) 칠한 RGBA */
function frame(w: number, h: number, rect: { x: number; y: number; w: number; h: number } | null, bg = 0) {
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const inside = rect && x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
      const v = inside ? 80 + ((x * 7 + y * 13) % 120) : bg;
      px[i] = px[i + 1] = px[i + 2] = v;
      px[i + 3] = 255;
    }
  return px;
}

describe("검은 띠 찾기", () => {
  it("위아래 띠(16:9 화면을 4:3 틀에 넣음)를 잘라 낸다", () => {
    // 240×180 안에 240×135 화면, 위아래 22~23줄씩 검은 띠
    const r = findContentRect(frame(240, 180, { x: 0, y: 22, w: 240, h: 135 }), 240, 180);
    expect(r).toEqual({ x: 0, y: 23, w: 240, h: 133 });
  });

  it("양옆 띠(3:2 화면을 16:9 틀에 넣음)를 잘라 낸다", () => {
    const r = findContentRect(frame(240, 135, { x: 19, y: 0, w: 202, h: 135 }), 240, 135);
    expect(r).toEqual({ x: 20, y: 0, w: 200, h: 135 });
  });

  it("아래쪽 얇은 검은 줄만 있어도 잘라 낸다", () => {
    const r = findContentRect(frame(240, 136, { x: 0, y: 0, w: 240, h: 134 }), 240, 136);
    expect(r).toEqual({ x: 0, y: 0, w: 240, h: 133 });
  });

  it("띠가 없으면 null", () => {
    expect(findContentRect(frame(240, 135, { x: 0, y: 0, w: 240, h: 135 }), 240, 135)).toBeNull();
  });

  it("장면 전체가 어두우면 자르지 않는다", () => {
    expect(findContentRect(frame(240, 135, null), 240, 135)).toBeNull();
  });

  it("밝은 부분이 작은 어두운 장면은 띠로 보지 않는다", () => {
    expect(findContentRect(frame(240, 135, { x: 100, y: 40, w: 40, h: 40 }), 240, 135)).toBeNull();
  });

  it("가장자리 몇 점의 잡음은 무시한다", () => {
    const px = frame(240, 180, { x: 0, y: 22, w: 240, h: 135 });
    // 위 띠 안에 밝은 점 두 개
    for (const x of [10, 200]) px[(5 * 240 + x) * 4] = px[(5 * 240 + x) * 4 + 1] = px[(5 * 240 + x) * 4 + 2] = 255;
    expect(findContentRect(px, 240, 180)?.y).toBe(23);
  });

  it("비슷한 영역 비교", () => {
    const a = { x: 0, y: 180, w: 1920, h: 1080 };
    expect(similarRect(a, { x: 0, y: 186, w: 1920, h: 1075 }, 1920, 1440)).toBe(true);
    expect(similarRect(a, { x: 0, y: 240, w: 1920, h: 960 }, 1920, 1440)).toBe(false);
    expect(similarRect(null, null, 1920, 1440)).toBe(true);
    expect(similarRect(a, null, 1920, 1440)).toBe(false);
  });
});

describe("미리보기 확대", () => {
  it("위아래 띠가 있으면 띠가 안 보이도록 키운다", () => {
    // 1920×1440 안의 1920×1080 화면을 1440×1000 미리보기에
    const t = coverTransform({ w: 1440, h: 1000 }, { w: 1920, h: 1440 }, { x: 0, y: 180, w: 1920, h: 1080 }, true);
    expect(t).toBe("translate(0px, 0px) scale(1.235) scaleX(-1)");
  });

  it("한쪽에만 띠가 있으면 화면 가운데로 옮긴다 (반전 고려)", () => {
    // 오른쪽 200px가 검은 띠: 실제 화면 가운데는 원본 가운데보다 100px 왼쪽
    const t = coverTransform({ w: 1000, h: 500 }, { w: 2000, h: 1000 }, { x: 0, y: 0, w: 1800, h: 1000 }, true);
    // s0 = 0.5, z = max(1, 1000/900, 500/500) = 1.111, ux = -50 → 반전이라 tx = -55.556
    expect(t).toBe("translate(-55.556px, 0px) scale(1.111) scaleX(-1)");
    expect(coverTransform({ w: 1000, h: 500 }, { w: 2000, h: 1000 }, { x: 0, y: 0, w: 1800, h: 1000 }, false)).toBe(
      "translate(55.556px, 0px) scale(1.111)",
    );
  });

  it("띠가 없으면 반전만", () => {
    expect(coverTransform({ w: 100, h: 100 }, { w: 200, h: 200 }, null, true)).toBe("scaleX(-1)");
    expect(coverTransform({ w: 100, h: 100 }, { w: 200, h: 200 }, null, false)).toBe("none");
  });
});
