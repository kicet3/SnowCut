import { describe, expect, it } from "vitest";
import { adsTxt } from "./ads";

describe("ads.txt", () => {
  it("ca-pub 값에서 pub 아이디를 쓴다", () => {
    expect(adsTxt("ca-pub-1234567890123456")).toBe("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n");
  });
  it("애드센스 값이 없으면 비워 둔다", () => expect(adsTxt("")).toBe(""));
});
