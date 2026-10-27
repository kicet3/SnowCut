import { describe, expect, it } from "vitest";
import { alphaBounds, characterBox, hasAlpha, hitTest, normalizeDeg, toImagePoints, type Placement } from "./character";

/** w×h RGBA 버퍼에서 주어진 칸만 불투명하게 */
function rgba(w: number, h: number, opaque: [number, number][]): Uint8ClampedArray {
  const d = new Uint8ClampedArray(w * h * 4);
  for (const [x, y] of opaque) d[(y * w + x) * 4 + 3] = 255;
  return d;
}

describe("투명 여백 자르기", () => {
  it("불투명한 픽셀을 모두 담는 가장 작은 사각형", () => {
    expect(alphaBounds(rgba(10, 8, [[2, 3], [6, 5], [4, 1]]), 10, 8)).toEqual({ x: 2, y: 1, w: 5, h: 5 });
  });
  it("투명한 픽셀이 있는지 (서버가 원본을 그대로 돌려준 경우를 가려낸다)", () => {
    const opaque = new Uint8ClampedArray(4 * 4).fill(255);
    expect(hasAlpha(opaque)).toBe(false);
    opaque[7] = 0;
    expect(hasAlpha(opaque)).toBe(true);
  });
  it("전부 투명하면 null", () => {
    expect(alphaBounds(rgba(4, 4, []), 4, 4)).toBeNull();
  });
  it("거의 투명한 가장자리(안티에일리어싱 잔여)는 무시한다", () => {
    const d = rgba(5, 5, [[2, 2]]);
    d[(0 * 5 + 0) * 4 + 3] = 3;
    expect(alphaBounds(d, 5, 5)).toEqual({ x: 2, y: 2, w: 1, h: 1 });
  });
});

describe("캐릭터 배치", () => {
  const p: Placement = { x: 0.5, y: 0.5, size: 0.5, rotation: 0, aspect: 2 };
  it("크기는 캔버스 짧은 변 기준", () => {
    expect(characterBox(p, 1200, 3600)).toEqual({ cx: 600, cy: 1800, w: 600, h: 300 });
    expect(characterBox(p, 3600, 1200)).toEqual({ cx: 1800, cy: 600, w: 600, h: 300 });
  });
  it("회전을 반영해서 누른 위치를 판정한다", () => {
    // 600×300 가로 사각형. 90° 돌리면 세로로 서므로 위아래 250px 지점이 안쪽이 된다.
    expect(hitTest([p], 1200, 3600, 600, 1800 + 250)).toBe(-1);
    expect(hitTest([{ ...p, rotation: 90 }], 1200, 3600, 600, 1800 + 250)).toBe(0);
    expect(hitTest([{ ...p, rotation: 90 }], 1200, 3600, 600 + 250, 1800)).toBe(-1);
  });
  it("겹치면 나중에 그린(위에 있는) 캐릭터를 고른다", () => {
    expect(hitTest([p, { ...p, size: 0.2 }], 1200, 3600, 600, 1800)).toBe(1);
    expect(hitTest([p, { ...p, size: 0.2 }], 1200, 3600, 600 + 250, 1800)).toBe(0);
  });
  it("손가락용 여유(slop)만큼 바깥도 잡힌다", () => {
    expect(hitTest([p], 1200, 3600, 600 + 310, 1800)).toBe(-1);
    expect(hitTest([p], 1200, 3600, 600 + 310, 1800, 20)).toBe(0);
  });
  it("각도는 -180 이상 180 미만으로 맞춘다", () => {
    expect(normalizeDeg(190)).toBe(-170);
    expect(normalizeDeg(-190)).toBe(170);
    expect(normalizeDeg(180)).toBe(-180);
    expect(normalizeDeg(45)).toBe(45);
  });
});

describe("누끼 서버에 보낼 좌표", () => {
  it("비율 좌표를 정수 픽셀로 바꾸고 이미지 안으로 제한한다", () => {
    expect(toImagePoints([{ x: 0.5, y: 0.25 }, { x: 1, y: 0 }], 800, 600)).toEqual([
      [400, 150],
      [799, 0],
    ]);
  });
});
