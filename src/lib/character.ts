import type { Rect } from "./frame";

/**
 * 커스텀 캐릭터: 업로드한 이미지에서 배경을 지운 스티커를 프레임 위에 얹는다.
 * 위치·크기는 캔버스 비율로 들고 있어서 장수가 같은 다른 레이아웃으로 바꿔도 비슷한 자리에 남는다.
 */
export interface Character {
  id: number;
  /** 배경을 지우고 투명한 여백을 잘라 낸 이미지 */
  image: HTMLCanvasElement;
  /** 중심 위치 (캔버스 폭·높이에 대한 비율, 0~1) */
  x: number;
  y: number;
  /** 폭 (캔버스 짧은 변에 대한 비율) */
  size: number;
  /** 회전 (도) */
  rotation: number;
  flip: boolean;
  /** 흰 테두리를 둘러 스티커처럼 보이게 한다 */
  outline: boolean;
}

/** 히트 테스트·배치 계산에 필요한 값만 (DOM 없이 테스트할 수 있게) */
export type Placement = Pick<Character, "x" | "y" | "size" | "rotation"> & { aspect: number };

export const SIZE_MIN = 0.1;
export const SIZE_MAX = 1.6;
/** 업로드 이미지는 긴 변 이만큼으로 줄여서 다룬다 (누끼 서버 전송량·캔버스 메모리 대비). */
export const UPLOAD_MAX = 1600;

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 각도를 -180 이상 180 미만으로 */
export function normalizeDeg(d: number): number {
  return ((((d + 180) % 360) + 360) % 360) - 180;
}

export function placementOf(c: Character): Placement {
  return { x: c.x, y: c.y, size: c.size, rotation: c.rotation, aspect: c.image.width / Math.max(1, c.image.height) };
}

/** 캔버스(W×H) 위에서 캐릭터의 중심과 회전 전 크기 (px) */
export function characterBox(p: Placement, W: number, H: number): { cx: number; cy: number; w: number; h: number } {
  const w = p.size * Math.min(W, H);
  return { cx: p.x * W, cy: p.y * H, w, h: w / p.aspect };
}

/** (px, py)를 덮는 맨 위 캐릭터의 순번. 없으면 -1. 뒤에 있는 것이 위에 그려진다. */
export function hitTest(list: Placement[], W: number, H: number, px: number, py: number, slop = 0): number {
  for (let i = list.length - 1; i >= 0; i--) {
    const { cx, cy, w, h } = characterBox(list[i], W, H);
    const a = (-list[i].rotation * Math.PI) / 180;
    const dx = px - cx;
    const dy = py - cy;
    // 캐릭터 기준 좌표로 되돌려서 회전 전 사각형과 비교한다.
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(lx) <= w / 2 + slop && Math.abs(ly) <= h / 2 + slop) return i;
  }
  return -1;
}

/** 알파가 threshold보다 큰 픽셀을 모두 담는 사각형. 전부 투명하면 null. */
export function alphaBounds(data: ArrayLike<number>, w: number, h: number, threshold = 8): Rect | null {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > threshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** 화면에서 누른 위치(이미지 비율 0~1)를 서버에 보낼 이미지 픽셀 좌표로 바꾼다. */
export function toImagePoints(points: { x: number; y: number }[], w: number, h: number): [number, number][] {
  return points.map((p) => [clamp(Math.round(p.x * w), 0, w - 1), clamp(Math.round(p.y * h), 0, h - 1)]);
}

// ---------- DOM ----------

/** 업로드한 파일을 긴 변 UPLOAD_MAX 이하 캔버스로 읽는다. EXIF 방향은 브라우저가 반영한다. */
export async function loadUpload(file: Blob): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const s = Math.min(1, UPLOAD_MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * s));
    c.height = Math.max(1, Math.round(img.naturalHeight * s));
    c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 알파가 255보다 확실히 낮은 픽셀이 하나라도 있는지 */
export function hasAlpha(data: ArrayLike<number>): boolean {
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true;
  return false;
}

/** 캔버스에 투명한 부분이 있는지 (누끼가 실제로 됐는지 확인용) */
export function hasTransparency(c: HTMLCanvasElement): boolean {
  const ctx = c.getContext("2d", { willReadFrequently: true });
  return !!ctx && hasAlpha(ctx.getImageData(0, 0, c.width, c.height).data);
}

/** 투명한 여백을 잘라 낸 새 캔버스. 전부 투명하면 null. */
export function trimTransparent(src: HTMLCanvasElement): HTMLCanvasElement | null {
  const ctx = src.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const b = alphaBounds(ctx.getImageData(0, 0, src.width, src.height).data, src.width, src.height);
  if (!b) return null;
  const c = document.createElement("canvas");
  c.width = b.w;
  c.height = b.h;
  c.getContext("2d")?.drawImage(src, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
  return c;
}

export function freeCharacter(c: Character): void {
  const o = outlines.get(c.image);
  if (o) {
    o.canvas.width = 0;
    o.canvas.height = 0;
  }
  outlines.delete(c.image);
  c.image.width = 0;
  c.image.height = 0;
}

// 테두리 이미지는 캐릭터마다 한 번만 만든다.
const outlines = new WeakMap<HTMLCanvasElement, { canvas: HTMLCanvasElement; pad: number }>();

/** 이미지 둘레에 흰 테두리를 두른 캔버스. 테두리 두께만큼(pad) 사방이 커진다. */
function outlined(image: HTMLCanvasElement): { canvas: HTMLCanvasElement; pad: number } {
  const hit = outlines.get(image);
  if (hit) return hit;
  const pad = Math.max(2, Math.round(Math.max(image.width, image.height) * 0.025));
  const c = document.createElement("canvas");
  c.width = image.width + pad * 2;
  c.height = image.height + pad * 2;
  const ctx = c.getContext("2d");
  if (ctx) {
    // 원 둘레로 여러 번 찍어서 실루엣을 두껍게 만든 뒤 흰색으로 채운다.
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      ctx.drawImage(image, pad + Math.cos(a) * pad, pad + Math.sin(a) * pad);
    }
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(image, pad, pad);
  }
  const out = { canvas: c, pad };
  outlines.set(image, out);
  return out;
}

/** 캔버스 좌표계(W×H, 이미 축소 변환이 걸려 있어도 된다)에 캐릭터들을 그린다. */
export function drawCharacters(ctx: CanvasRenderingContext2D, W: number, H: number, list: Character[], scale = 1): void {
  for (const c of list) {
    if (!c.image.width || !c.image.height) continue;
    const { cx, cy, w, h } = characterBox(placementOf(c), W, H);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((c.rotation * Math.PI) / 180);
    if (c.flip) ctx.scale(-1, 1);
    ctx.shadowColor = "rgba(0,0,0,.22)";
    ctx.shadowBlur = w * 0.04 * scale;
    ctx.shadowOffsetY = w * 0.015 * scale;
    if (c.outline) {
      const o = outlined(c.image);
      const k = w / c.image.width;
      const pw = o.pad * k;
      ctx.drawImage(o.canvas, -w / 2 - pw, -h / 2 - pw, w + pw * 2, h + pw * 2);
    } else {
      ctx.drawImage(c.image, -w / 2, -h / 2, w, h);
    }
    ctx.restore();
  }
}
