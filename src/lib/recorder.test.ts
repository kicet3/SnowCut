import { describe, expect, it } from "vitest";
import { pickVideoType, videoExtension } from "./recorder";

describe("녹화 형식", () => {
  it("Safari처럼 MP4를 지원하면 MP4를 고른다", () => {
    expect(pickVideoType((t) => t.startsWith("video/mp4"))).toBe("video/mp4;codecs=avc1");
  });
  it("MP4가 없으면 WebM", () => {
    expect(pickVideoType((t) => t === "video/webm")).toBe("video/webm");
  });
  it("아무것도 없으면 null", () => {
    expect(pickVideoType(() => false)).toBeNull();
  });
  it("확장자", () => {
    expect(videoExtension("video/mp4;codecs=avc1")).toBe("mp4");
    expect(videoExtension("video/webm;codecs=vp9")).toBe("webm");
  });
});
