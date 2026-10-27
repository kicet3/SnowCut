import { describe, expect, it } from "vitest";
import { DEFAULT_FRAME, FRAMES, FRAME_CATEGORIES, frameDesign, seeded } from "./frames";

describe("프레임 목록", () => {
  it("id가 겹치지 않고 모든 종류에 프레임이 있다", () => {
    expect(new Set(FRAMES.map((f) => f.id)).size).toBe(FRAMES.length);
    for (const c of FRAME_CATEGORIES) expect(FRAMES.some((f) => f.category === c.id)).toBe(true);
    expect(FRAMES.length).toBeGreaterThanOrEqual(18);
  });

  it("없는 id는 기본 프레임으로", () => {
    expect(frameDesign("없는-프레임").id).toBe(FRAMES[0].id);
    expect(frameDesign(DEFAULT_FRAME).id).toBe(DEFAULT_FRAME);
  });

  it("무늬 위치는 시드가 같으면 같다 (썸네일과 저장본이 같은 모양)", () => {
    const a = seeded(3);
    const b = seeded(3);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });
});
