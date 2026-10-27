import { drawCover } from "./canvas";
import { LAYOUTS, type LayoutKey } from "./frame";

/**
 * 캐논 SELPHY CP1500 엽서 용지(테두리 없음 100×148mm)에 맞춘 인쇄용 시트.
 * 600dpi 기준 2362×3496px. 2×6인치 스트립과 6×2인치 가로 스트립은 포토부스처럼 한 장에 두 줄 넣고 가운데를 자른다.
 */
export const PAPER_MM = { w: 100, h: 148 };
const DPI = 600;
export const SHEET = { w: Math.round((PAPER_MM.w / 25.4) * DPI), h: Math.round((PAPER_MM.h / 25.4) * DPI) };

export interface SheetPlan {
  /** 한 장에 넣는 장수 */
  copies: 1 | 2;
  /** 가로 사진을 세워서 넣는다 */
  rotate: boolean;
}

export function sheetPlan(layout: LayoutKey): SheetPlan {
  const { width, height } = LAYOUTS[layout].canvas;
  if (width > height) return { copies: 2, rotate: true };
  // 폭이 높이의 절반보다 좁으면 스트립 (2×6인치)
  if (width * 2 < height) return { copies: 2, rotate: false };
  return { copies: 1, rotate: false };
}

/**
 * 테두리 없는 인쇄에서 프린터가 잘라 내는 가장자리에 대비한 여유 (mm).
 * SELPHY CP1500은 테두리 없이 인쇄할 때 그림을 조금 키워 가장자리를 잘라 낸다 (특히 Windows 드라이버).
 * 사진은 이만큼 안쪽에 두고, 바깥은 가장자리 색을 늘여 채운다.
 */
export const PRINT_BLEED_MM = 3;

/** 시트 안쪽 내용 영역 (px). 비율을 지키며 사방에 bleedMm 이상 여유를 둔다. */
export function contentRect(bleedMm: number): { x: number; y: number; w: number; h: number } {
  if (bleedMm <= 0) return { x: 0, y: 0, w: SHEET.w, h: SHEET.h };
  const s = Math.min((PAPER_MM.w - bleedMm * 2) / PAPER_MM.w, (PAPER_MM.h - bleedMm * 2) / PAPER_MM.h);
  const w = Math.round(SHEET.w * s);
  const h = Math.round(SHEET.h * s);
  const x = Math.floor((SHEET.w - w) / 2);
  const y = Math.floor((SHEET.h - h) / 2);
  return { x, y, w, h };
}

/**
 * 내용 영역 바깥(위아래 by, 좌우 bx px)을 내용의 맨 바깥 한 줄(대개 프레임 바탕색)을 늘여 채운다.
 * 뒤집어 채우면 가장자리 가까운 글자(날짜)가 거꾸로 비칠 수 있어 한 줄만 늘인다.
 */
function extendEdges(ctx: CanvasRenderingContext2D, sheet: HTMLCanvasElement, bx: number, by: number): void {
  const W = sheet.width;
  const H = sheet.height;
  const line = document.createElement("canvas");
  const lc = line.getContext("2d");
  if (!lc) return;
  const stretch = (sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => {
    line.width = sw;
    line.height = sh;
    lc.drawImage(sheet, sx, sy, sw, sh, 0, 0, sw, sh);
    ctx.drawImage(line, 0, 0, sw, sh, dx, dy, dw, dh);
  };
  // 위아래를 먼저 채우고, 좌우는 채워진 위아래까지 포함한 세로줄을 늘여 모서리도 채운다.
  if (by > 0) {
    stretch(bx, by, W - 2 * bx, 1, bx, 0, W - 2 * bx, by);
    stretch(bx, H - by - 1, W - 2 * bx, 1, bx, H - by, W - 2 * bx, by);
  }
  if (bx > 0) {
    stretch(bx, 0, 1, H, 0, 0, bx, H);
    stretch(W - bx - 1, 0, 1, H, W - bx, 0, bx, H);
  }
  line.width = 0;
  line.height = 0;
}

/**
 * 완성 사진(합성 결과 이미지)으로 인쇄용 시트를 그린다.
 * bleedMm을 주면 사진을 그만큼 안쪽에 두고 바깥을 가장자리 색으로 채운다 (테두리 없는 인쇄용).
 */
export function drawPrintSheet(
  sheet: HTMLCanvasElement,
  composite: HTMLImageElement | HTMLCanvasElement,
  layout: LayoutKey,
  bleedMm = 0,
): void {
  const cw = composite instanceof HTMLImageElement ? composite.naturalWidth : composite.width;
  const ch = composite instanceof HTMLImageElement ? composite.naturalHeight : composite.height;
  sheet.width = SHEET.w;
  sheet.height = SHEET.h;
  const ctx = sheet.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SHEET.w, SHEET.h);
  ctx.imageSmoothingQuality = "high";

  const plan = sheetPlan(layout);
  let src: HTMLImageElement | HTMLCanvasElement = composite;
  if (plan.rotate) {
    // 가로 스트립을 시계 방향으로 세운다.
    const r = document.createElement("canvas");
    r.width = ch;
    r.height = cw;
    const rc = r.getContext("2d");
    if (!rc) throw new Error("canvas unavailable");
    rc.translate(r.width, 0);
    rc.rotate(Math.PI / 2);
    rc.drawImage(composite, 0, 0);
    src = r;
  }

  // 용지 비율(100:148)이 사진(2:3)과 조금 달라서 가장자리를 1% 남짓 잘라 꽉 채운다 (프레임 여백 안쪽).
  const r = contentRect(bleedMm);
  if (plan.copies === 1) {
    drawCover(ctx, src, r);
  } else {
    const half = Math.round(r.w / 2);
    drawCover(ctx, src, { x: r.x, y: r.y, w: half, h: r.h });
    drawCover(ctx, src, { x: r.x + half, y: r.y, w: r.w - half, h: r.h });
    // 자르는 자리 표시 (위아래 끝에만 짧게). 여유 영역으로 늘어나 용지 끝까지 닿는다.
    ctx.fillStyle = "rgba(128,128,128,0.7)";
    const mark = SHEET.h * 0.012;
    const cx = r.x + half;
    ctx.fillRect(cx - 2, r.y, 4, mark);
    ctx.fillRect(cx - 2, r.y + r.h - mark, 4, mark);
  }
  extendEdges(ctx, sheet, r.x, r.y);
  if (src instanceof HTMLCanvasElement && src !== composite) {
    src.width = 0;
    src.height = 0;
  }
}

export const MAX_PRINT_PAGES = 10;

/** 인쇄 수량(사진 개수) 선택지. 한 장에 두 개 들어가는 레이아웃은 2의 배수. */
export function printCounts(layout: LayoutKey): number[] {
  const per = sheetPlan(layout).copies;
  return Array.from({ length: MAX_PRINT_PAGES }, (_, i) => (i + 1) * per);
}

/** 사진 개수 → 인쇄할 용지 장수 */
export function pagesFor(layout: LayoutKey, count: number): number {
  const per = sheetPlan(layout).copies;
  return Math.min(MAX_PRINT_PAGES, Math.max(1, Math.ceil(count / per)));
}

/**
 * 인쇄 방식. borderless: 용지 끝까지 꽉 채움 (SELPHY 등 테두리 없는 인쇄를 지원하는 프린터),
 * margin: 둘레에 흰 여백을 두고 가운데에 놓음 (일반 프린터는 가장자리 몇 mm를 찍지 못해 잘린다).
 */
export type PrintMode = "borderless" | "margin";

/** 일반 프린터가 찍지 못하는 가장자리보다 넉넉한 여백 (mm) */
export const PRINT_MARGIN_MM = 6;

/** 여백 안에 시트 비율 그대로 넣었을 때 이미지 크기와 위아래·좌우 여백 (mm). 합은 용지 크기와 같다. */
export function marginFit(margin = PRINT_MARGIN_MM): { w: number; h: number; padX: number; padY: number } {
  const s = Math.min((PAPER_MM.w - margin * 2) / PAPER_MM.w, (PAPER_MM.h - margin * 2) / PAPER_MM.h);
  const w = Math.round(PAPER_MM.w * s * 100) / 100;
  const h = Math.round(PAPER_MM.h * s * 100) / 100;
  return { w, h, padX: (PAPER_MM.w - w) / 2, padY: (PAPER_MM.h - h) / 2 };
}
