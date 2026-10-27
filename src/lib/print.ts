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

/** 완성 사진(합성 결과 이미지)으로 인쇄용 시트를 그린다. */
export function drawPrintSheet(
  sheet: HTMLCanvasElement,
  composite: HTMLImageElement | HTMLCanvasElement,
  layout: LayoutKey,
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
  if (plan.copies === 1) {
    drawCover(ctx, src, { x: 0, y: 0, w: SHEET.w, h: SHEET.h });
  } else {
    const half = SHEET.w / 2;
    drawCover(ctx, src, { x: 0, y: 0, w: half, h: SHEET.h });
    drawCover(ctx, src, { x: half, y: 0, w: SHEET.w - half, h: SHEET.h });
    // 자르는 자리 표시 (위아래 끝에만 짧게)
    ctx.fillStyle = "rgba(128,128,128,0.7)";
    const mark = SHEET.h * 0.012;
    ctx.fillRect(half - 2, 0, 4, mark);
    ctx.fillRect(half - 2, SHEET.h - mark, 4, mark);
  }
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
