import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ADMIN_HASH_PREFIX, createTapCounter, hashAdminPassword, inAdminCorner, isInteractiveTarget, isValidPasswordLength, verifyAdminPassword } from "./admin";

const nodeHash = (pw: string) => createHash("sha256").update(ADMIN_HASH_PREFIX + pw).digest("hex");

describe("관리자 비밀번호", () => {
  it("브라우저 해시가 빌드(next.config.ts)의 node 해시와 같다", async () => {
    expect(await hashAdminPassword("ab12cd34")).toBe(nodeHash("ab12cd34"));
    expect(await hashAdminPassword("비밀번호여덟자리")).toBe(nodeHash("비밀번호여덟자리"));
  });
  it("맞는 8자리 비밀번호만 통과한다", async () => {
    const hash = nodeHash("12345678");
    expect(await verifyAdminPassword("12345678", hash)).toBe(true);
    expect(await verifyAdminPassword("12345679", hash)).toBe(false);
    expect(await verifyAdminPassword("1234567", hash)).toBe(false);
  });
  it("비밀번호가 설정되지 않았으면 아무것도 통과하지 않는다", async () => {
    expect(await verifyAdminPassword("12345678", "")).toBe(false);
  });
  it("8자리인지 센다", () => {
    expect(isValidPasswordLength("abcdefgh")).toBe(true);
    expect(isValidPasswordLength("abcdefg")).toBe(false);
    expect(isValidPasswordLength("abcdefghi")).toBe(false);
  });
});

describe("숨은 버튼", () => {
  it("오른쪽 위 영역만 센다", () => {
    expect(inAdminCorner(390, 10, 400)).toBe(true);
    expect(inAdminCorner(300, 10, 400)).toBe(false);
    expect(inAdminCorner(390, 100, 400)).toBe(false);
  });
  it("3초 안에 5번 누르면 열린다", () => {
    const c = createTapCounter();
    const results = [0, 300, 600, 900, 1200].map((t) => c.tap(t, true));
    expect(results).toEqual([false, false, false, false, true]);
    // 연 뒤에는 처음부터 다시 센다
    expect(c.tap(1300, true)).toBe(false);
  });
  it("느리게 누르거나 다른 곳을 누르면 처음부터 센다", () => {
    const slow = createTapCounter();
    expect([0, 1000, 2000, 3000, 4000].map((t) => slow.tap(t, true))).toEqual([false, false, false, false, false]);
    const c = createTapCounter();
    [0, 100, 200, 300].forEach((t) => c.tap(t, true));
    c.tap(400, false);
    expect(c.tap(500, true)).toBe(false);
  });
  it("링크·버튼 위를 누른 것은 세지 않는다", () => {
    const at = (hit: boolean) => ({ closest: (sel: string) => (hit && sel.includes("a") ? {} : null) });
    expect(isInteractiveTarget(at(true))).toBe(true);
    expect(isInteractiveTarget(at(false))).toBe(false);
    expect(isInteractiveTarget(null)).toBe(false);
    expect(isInteractiveTarget({})).toBe(false);
  });
});
