import type { Rect } from "./frame";

/**
 * 카메라 화면 가장자리의 검은 띠(레터박스·필러박스)를 찾아 실제 화면 영역만 돌려준다.
 * USB 카메라(니콘 Zf 등)는 3:2 화면을 16:9 안에 넣어 보내거나, 브라우저가 16:9 화면을 4:3 틀에 넣어
 * 위아래·양옆에 검은 띠가 생길 수 있다. 1080p 영상 아래의 몇 줄짜리 검은 줄도 같이 잘라 낸다.
 */

/** 이 밝기(0~255)보다 밝은 점이 거의 없으면 검은 줄로 본다. */
const DARK = 40;
/** 한 줄에서 이 비율보다 많은 점이 밝으면 화면으로 본다 (잡음 대비). */
const BRIGHT_SHARE = 0.02;
/** 남은 화면이 각 방향으로 이 비율보다 작으면 띠가 아니라 어두운 장면으로 보고 자르지 않는다. */
const MIN_CONTENT = 0.5;

/**
 * RGBA 픽셀(w×h)에서 검은 띠를 뺀 영역. 띠가 없거나 장면 전체가 어두우면 null.
 * 경계의 흐린 줄까지 빼도록 한 칸씩 안쪽으로 들인다.
 */
export function findContentRect(px: Uint8ClampedArray, w: number, h: number): Rect | null {
  const bright = (i: number) => 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2] > DARK;
  const rowLit = (y: number, x0: number, x1: number) => {
    let n = 0;
    for (let x = x0; x < x1; x++) if (bright((y * w + x) * 4)) n++;
    return n > (x1 - x0) * BRIGHT_SHARE;
  };
  const colLit = (x: number, y0: number, y1: number) => {
    let n = 0;
    for (let y = y0; y < y1; y++) if (bright((y * w + x) * 4)) n++;
    return n > (y1 - y0) * BRIGHT_SHARE;
  };

  let top = 0;
  while (top < h && !rowLit(top, 0, w)) top++;
  if (top === h) return null;
  let bottom = h - 1;
  while (bottom > top && !rowLit(bottom, 0, w)) bottom--;
  let left = 0;
  while (left < w && !colLit(left, top, bottom + 1)) left++;
  let right = w - 1;
  while (right > left && !colLit(right, top, bottom + 1)) right--;

  // 띠가 있는 쪽만 한 칸 더 안쪽으로 (축소하면서 생긴 흐린 경계)
  if (top > 0) top++;
  if (bottom < h - 1) bottom--;
  if (left > 0) left++;
  if (right < w - 1) right--;

  const cw = right - left + 1;
  const ch = bottom - top + 1;
  if (cw === w && ch === h) return null;
  if (cw < w * MIN_CONTENT || ch < h * MIN_CONTENT) return null;
  return { x: left, y: top, w: cw, h: ch };
}

/** 두 영역이 원본 크기 대비 tolerance 비율 이내로 같은가 */
export function similarRect(a: Rect | null, b: Rect | null, fullW: number, fullH: number, tolerance = 0.01): boolean {
  if (!a || !b) return a === b;
  const dx = fullW * tolerance;
  const dy = fullH * tolerance;
  return Math.abs(a.x - b.x) <= dx && Math.abs(a.w - b.w) <= dx && Math.abs(a.y - b.y) <= dy && Math.abs(a.h - b.h) <= dy;
}

/** 검사용으로 줄여 그리는 크기 (긴 변) */
const SAMPLE = 240;

/**
 * 비디오 한 장면을 작게 그려 검은 띠를 뺀 영역을 원본 픽셀 단위로 돌려준다.
 * canvas는 매번 새로 만들지 않도록 넘겨받는다.
 */
export function measureVideo(video: HTMLVideoElement, canvas: HTMLCanvasElement): Rect | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;
  const s = SAMPLE / Math.max(vw, vh);
  const w = Math.max(1, Math.round(vw * s));
  const h = Math.max(1, Math.round(vh * s));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, w, h);
  const r = findContentRect(ctx.getImageData(0, 0, w, h).data, w, h);
  if (!r) return null;
  // 원본 좌표로. 잘리는 쪽으로 반올림해 검은 줄이 남지 않게 한다.
  const x0 = Math.ceil((r.x * vw) / w);
  const y0 = Math.ceil((r.y * vh) / h);
  const x1 = Math.floor(((r.x + r.w) * vw) / w);
  const y1 = Math.floor(((r.y + r.h) * vh) / h);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * object-fit: cover로 그려진 비디오 요소에서 crop 영역만 화면을 가득 채우도록 하는 CSS transform.
 * view는 비디오 요소의 크기(CSS 픽셀), video는 원본 크기. 미리보기는 좌우 반전(mirror)해서 보여 준다.
 */
export function coverTransform(
  view: { w: number; h: number },
  video: { w: number; h: number },
  crop: Rect | null,
  mirror: boolean,
): string {
  const flip = mirror ? " scaleX(-1)" : "";
  if (!crop || !view.w || !view.h || !video.w || !video.h) return flip.trim() || "none";
  const s0 = Math.max(view.w / video.w, view.h / video.h);
  const z = Math.max(1, view.w / (crop.w * s0), view.h / (crop.h * s0));
  // 실제 화면 가운데가 원본 가운데에서 얼마나 떨어져 있는지 (요소 좌표, 반전 전)
  const ux = (crop.x + crop.w / 2 - video.w / 2) * s0;
  const uy = (crop.y + crop.h / 2 - video.h / 2) * s0;
  const tx = (mirror ? 1 : -1) * z * ux;
  const ty = -z * uy;
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return `translate(${r(tx)}px, ${r(ty)}px) scale(${r(z)})${flip}`;
}
