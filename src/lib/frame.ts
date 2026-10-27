/** 결과 사진의 배치. 좌표는 600dpi 인쇄 기준 픽셀이다. */

export type LayoutKey = "strip" | "grid" | "strip3" | "grid6" | "wide" | "hero";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LayoutSpec {
  title: string;
  paper: string;
  canvas: { width: number; height: number };
  /** 찍는 장수 */
  count: number;
  /** 사진 칸 (촬영 순서대로) */
  cells: Rect[];
  /** 문구와 날짜가 들어가는 영역 */
  caption: Rect;
}

/** 세로로 n칸 쌓은 스트립. 아래에 날짜 */
function column(W: number, H: number, n: number, m: number, g: number, footer: number): Pick<LayoutSpec, "cells" | "caption"> {
  const w = W - m * 2;
  const h = Math.floor((H - m - footer - g * (n - 1)) / n);
  const cells = Array.from({ length: n }, (_, i) => ({ x: m, y: m + i * (h + g), w, h }));
  const top = m + n * h + (n - 1) * g;
  return { cells, caption: { x: m, y: top, w, h: H - top - m / 2 } };
}

/** cols × rows 격자. 아래에 문구 */
function matrix(W: number, H: number, cols: number, rows: number, m: number, g: number, footer: number) {
  const w = Math.floor((W - m * 2 - g * (cols - 1)) / cols);
  const h = Math.floor((H - m - footer - g * (rows - 1)) / rows);
  const cells = Array.from({ length: cols * rows }, (_, i) => ({
    x: m + (i % cols) * (w + g),
    y: m + Math.floor(i / cols) * (h + g),
    w,
    h,
  }));
  const top = m + rows * h + (rows - 1) * g;
  return { cells, caption: { x: m, y: top, w: cols * w + (cols - 1) * g, h: H - top - m / 2 } };
}

/** 가로로 4칸 늘어놓고 오른쪽에 문구 */
function row(W: number, H: number, n: number, m: number, g: number, side: number) {
  const w = Math.floor((W - m * 2 - side - g * (n - 1)) / n);
  const h = H - m * 2;
  const cells = Array.from({ length: n }, (_, i) => ({ x: m + i * (w + g), y: m, w, h }));
  const left = m + n * w + (n - 1) * g;
  return { cells, caption: { x: left + g / 2, y: m, w: W - left - g / 2 - m / 2, h } };
}

/** 위에 큰 1컷, 아래에 작은 3컷 */
function hero(W: number, H: number, m: number, g: number, footer: number) {
  const w = W - m * 2;
  const sw = Math.floor((w - g * 2) / 3);
  const sh = Math.round(sw * 0.8);
  const bh = H - m - footer - g - sh;
  const cells = [
    { x: m, y: m, w, h: bh },
    ...[0, 1, 2].map((i) => ({ x: m + i * (sw + g), y: m + bh + g, w: sw, h: sh })),
  ];
  const top = m + bh + g + sh;
  return { cells, caption: { x: m, y: top, w, h: H - top - m / 2 } };
}

export const LAYOUTS: Record<LayoutKey, LayoutSpec> = {
  strip: { title: "세로 4컷", paper: "2×6인치", canvas: { width: 1200, height: 3600 }, count: 4, ...column(1200, 3600, 4, 60, 40, 420) },
  grid: { title: "2×2 그리드", paper: "4×6인치", canvas: { width: 2400, height: 3600 }, count: 4, ...matrix(2400, 3600, 2, 2, 80, 40, 520) },
  strip3: { title: "세로 3컷", paper: "2×6인치", canvas: { width: 1200, height: 3600 }, count: 3, ...column(1200, 3600, 3, 60, 40, 260) },
  grid6: { title: "2×3 6컷", paper: "4×6인치", canvas: { width: 2400, height: 3600 }, count: 6, ...matrix(2400, 3600, 2, 3, 80, 30, 480) },
  wide: { title: "가로 4컷", paper: "6×2인치", canvas: { width: 3600, height: 1200 }, count: 4, ...row(3600, 1200, 4, 60, 40, 640) },
  hero: { title: "큰 1컷 + 3컷", paper: "4×6인치", canvas: { width: 2400, height: 3600 }, count: 4, ...hero(2400, 3600, 80, 40, 520) },
};

export const LAYOUT_KEYS = Object.keys(LAYOUTS) as LayoutKey[];

/** 결과 화면에서 바꿀 수 있는 레이아웃 (찍은 장수가 같은 것) */
export function compatibleLayouts(key: LayoutKey): LayoutKey[] {
  return LAYOUT_KEYS.filter((k) => LAYOUTS[k].count === LAYOUTS[key].count);
}

/** 촬영 순서대로 정렬된 사진 칸. */
export function photoRects(key: LayoutKey): Rect[] {
  return LAYOUTS[key].cells;
}

/** 하단(가로 4컷은 오른쪽) 문구와 날짜가 들어가는 영역. */
export function captionRect(key: LayoutKey): Rect {
  return LAYOUTS[key].caption;
}

/** index번째 칸의 가로/세로 비율. 카메라 미리보기도 이 비율로 잘라 보여준다. */
export function photoAspect(key: LayoutKey, index = 0): number {
  const cells = LAYOUTS[key].cells;
  const r = cells[Math.min(Math.max(0, index), cells.length - 1)];
  return r.w / r.h;
}

export const TIMERS = [3, 5, 10] as const;
/** 사진 아래(가로 4컷은 오른쪽)에 넣을 수 있는 문구의 최대 글자 수. 문구는 결과 화면에서 입력한다 (기본은 비어 있음). */
export const CAPTION_MAX = 24;

const pad = (n: number) => String(n).padStart(2, "0");

export function formatDate(d: Date): string {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export function fileNameFor(d: Date, ext = "jpg"): string {
  return `snowcut-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.${ext}`;
}
