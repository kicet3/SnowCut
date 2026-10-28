import { describe, expect, it } from "vitest";
import { adsTxt, parseAdsSetting } from "./ads";

describe("ads.txt", () => {
  it("ca-pub 값에서 pub 아이디를 쓴다", () => {
    expect(adsTxt("ca-pub-1234567890123456")).toBe("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n");
  });
  it("애드센스 값이 없으면 비워 둔다", () => expect(adsTxt("")).toBe(""));
});

describe("광고 켜기/끄기", () => {
  it("기본은 꺼짐이고 'on'일 때만 켜진다", () => {
    expect(parseAdsSetting(null)).toBe(false);
    expect(parseAdsSetting(undefined)).toBe(false);
    expect(parseAdsSetting("off")).toBe(false);
    expect(parseAdsSetting("yes")).toBe(false);
    expect(parseAdsSetting("on")).toBe(true);
  });
});
