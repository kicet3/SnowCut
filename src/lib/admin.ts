/**
 * 관리자 모드 비밀번호 확인. 정적 사이트라 서버가 없어서, 빌드할 때 next.config.ts가
 * ADMIN_PASSWORD(8자리)를 SHA-256 해시로 바꿔 NEXT_PUBLIC_ADMIN_PASSWORD_HASH에 넣는다 (평문은 번들에 들어가지 않는다).
 * 브라우저는 입력한 값을 같은 방식으로 해시해서 비교한다.
 */
export const ADMIN_HASH_PREFIX = "snowcut-admin:";
export const ADMIN_PASSWORD_LENGTH = 8;
export const ADMIN_PASSWORD_HASH = process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH ?? "";

/** 이 탭에서 로그인한 상태를 기억하는 sessionStorage 키 (값은 그때의 해시라서 비밀번호가 바뀌면 다시 묻는다) */
const SESSION_KEY = "snowcut.admin";

/** 비밀번호 글자 수 (이모지 등 서로게이트 쌍도 한 글자로 센다) */
export function passwordLength(password: string): number {
  return [...password].length;
}

export function isValidPasswordLength(password: string): boolean {
  return passwordLength(password) === ADMIN_PASSWORD_LENGTH;
}

/** sha256("snowcut-admin:" + 비밀번호)의 16진수 문자열 */
export async function hashAdminPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(ADMIN_HASH_PREFIX + password);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 비밀번호가 맞는지. 빌드에 비밀번호가 설정되지 않았거나 8자리가 아니면 항상 false. */
export async function verifyAdminPassword(password: string, expected: string = ADMIN_PASSWORD_HASH): Promise<boolean> {
  if (!expected || !isValidPasswordLength(password)) return false;
  return (await hashAdminPassword(password)) === expected.toLowerCase();
}

export function adminSessionActive(expected: string = ADMIN_PASSWORD_HASH): boolean {
  if (!expected) return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === expected;
  } catch {
    return false;
  }
}

export function setAdminSession(active: boolean, expected: string = ADMIN_PASSWORD_HASH): void {
  try {
    if (active && expected) sessionStorage.setItem(SESSION_KEY, expected);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

/** 오른쪽 위 숨은 영역(px)과 여는 데 필요한 연속 클릭 수·시간 */
export const ADMIN_TAP_AREA = 64;
export const ADMIN_TAP_COUNT = 5;
export const ADMIN_TAP_WINDOW_MS = 3000;

/** 화면 크기와 누른 좌표로 오른쪽 위 숨은 영역인지 */
export function inAdminCorner(x: number, y: number, viewportWidth: number, area: number = ADMIN_TAP_AREA): boolean {
  return x >= viewportWidth - area && y <= area;
}

/** 누르면 다른 동작을 하는 요소. 숨은 구석에 있어도 이 위를 누른 것은 세지 않는다. */
export const ADMIN_TAP_IGNORE_SELECTOR = "a, button, select, input, textarea, label, summary, [role='button'], [role='link'], [contenteditable]";

/** 누른 대상이 링크·버튼 같은 상호작용 요소(또는 그 안)인지 */
export function isInteractiveTarget(target: unknown): boolean {
  const el = target as { closest?: (selector: string) => unknown } | null;
  return typeof el?.closest === "function" && el.closest(ADMIN_TAP_IGNORE_SELECTOR) != null;
}

/**
 * 연속 클릭 세기. 숨은 영역 밖을 누르면 처음부터 다시 센다.
 * 3초 안에 5번이 모이면 true를 돌려주고 다시 0부터 센다.
 */
export function createTapCounter(count: number = ADMIN_TAP_COUNT, windowMs: number = ADMIN_TAP_WINDOW_MS) {
  let taps: number[] = [];
  return {
    tap(now: number, inCorner: boolean): boolean {
      if (!inCorner) {
        taps = [];
        return false;
      }
      taps = taps.filter((t) => now - t < windowMs);
      taps.push(now);
      if (taps.length < count) return false;
      taps = [];
      return true;
    },
  };
}
