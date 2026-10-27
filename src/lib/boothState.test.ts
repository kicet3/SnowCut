import { describe, expect, it } from "vitest";
import { initialState, reducer, type Action, type BoothState } from "./boothState";
import type { Shot } from "./canvas";

// 리듀서는 캔버스 내용을 보지 않으므로 식별 가능한 객체면 충분하다.
const shot = (name: string) => ({ name }) as unknown as Shot;
const run = (state: BoothState, ...actions: Action[]) => actions.reduce(reducer, state);

const completed = () =>
  run(
    initialState,
    { type: "start" },
    { type: "shot", index: 0, shot: shot("a") },
    { type: "shot", index: 1, shot: shot("b") },
    { type: "shot", index: 2, shot: shot("c") },
    { type: "shot", index: 3, shot: shot("d") },
    { type: "complete" },
  );

describe("boothState", () => {
  it("네 장을 다 찍어야 결과 화면으로 간다", () => {
    const partial = run(initialState, { type: "start" }, { type: "shot", index: 0, shot: shot("a") }, { type: "complete" });
    expect(partial.screen).toBe("capture");
    const done = completed();
    expect(done.screen).toBe("result");
    expect(done.capturedAt.getTime()).toBeGreaterThan(0);
  });

  it("이미 찬 칸은 덮어쓰지 않는다", () => {
    const s = run(initialState, { type: "start" }, { type: "shot", index: 0, shot: shot("a") }, { type: "shot", index: 0, shot: shot("x") });
    expect(s.shots[0]).toEqual(shot("a"));
  });

  it("다시 찍기를 취소하면 원래 사진으로 결과 화면에 돌아간다", () => {
    const retaking = reducer(completed(), { type: "retake", index: 2 });
    expect(retaking.screen).toBe("capture");
    expect(retaking.shots[2]).toBeNull();
    const back = reducer(retaking, { type: "back" });
    expect(back.screen).toBe("result");
    expect(back.shots[2]).toEqual(shot("c"));
    expect(back.pendingRetake).toBeNull();
  });

  it("다시 찍은 직후 뒤로 가기는 사진을 지우지 않고 결과로 간다", () => {
    const s = run(completed(), { type: "retake", index: 1 }, { type: "shot", index: 1, shot: shot("b2") }, { type: "back" });
    expect(s.screen).toBe("result");
    expect(s.shots.every(Boolean)).toBe(true);
    expect(s.shots[1]).toEqual(shot("b2"));
  });

  it("촬영 중 처음으로 가면 사진을 비운다", () => {
    const s = run(initialState, { type: "start" }, { type: "shot", index: 0, shot: shot("a") }, { type: "back" });
    expect(s.screen).toBe("start");
    expect(s.shots.every((x) => x === null)).toBe(true);
  });

  it("사진이 바뀔 때마다 revision이 올라간다", () => {
    const a = reducer(initialState, { type: "start" });
    const b = reducer(a, { type: "shot", index: 0, shot: shot("a") });
    expect(b.revision).toBeGreaterThan(a.revision);
  });

  it("필터를 바꿀 수 있다", () => {
    expect(reducer(initialState, { type: "filter", filter: "mono" }).filter).toBe("mono");
  });

  it("영상은 같은 촬영 회차일 때만 붙고, 새로 찍으면 지워진다", () => {
    const done = completed();
    const video = new Blob(["v"]);
    const withVideo = reducer(done, { type: "video", session: done.session, video });
    expect(withVideo.video).toBe(video);
    expect(reducer(done, { type: "video", session: done.session - 1, video }).video).toBeNull();
    // 한 컷 다시 찍기는 영상을 지우지 않는다
    expect(reducer(withVideo, { type: "retake", index: 0 }).video).toBe(video);
    const fresh = reducer(withVideo, { type: "reset" });
    expect(fresh.video).toBeNull();
    expect(reducer(fresh, { type: "video", session: done.session, video }).video).toBeNull();
  });

  it("레이아웃을 고르면 그 장수만큼 찍는다", () => {
    const s = run(initialState, { type: "layout", layout: "grid6" }, { type: "start" });
    expect(s.shots).toHaveLength(6);
    expect(run(initialState, { type: "layout", layout: "strip3" }, { type: "start" }).shots).toHaveLength(3);
  });

  it("다 찍은 뒤에는 장수가 같은 레이아웃으로만 바뀐다", () => {
    const done = completed();
    expect(reducer(done, { type: "layout", layout: "hero" }).layout).toBe("hero");
    expect(reducer(done, { type: "layout", layout: "grid6" }).layout).toBe(done.layout);
  });
});
