import { LAYOUTS, captionRect, formatDate, photoRects, type LayoutKey, type Rect } from "./frame";
import { drawCharacters, type Character } from "./character";
import { frameDesign, type FrameContext, type FrameId } from "./frames";

/** 촬영본. 좌우 반전·축소까지 끝난 캔버스다. */
export type Shot = HTMLCanvasElement;

export type Drawable = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

function sourceSize(src: Drawable): { w: number; h: number } {
  if (src instanceof HTMLVideoElement) return { w: src.videoWidth, h: src.videoHeight };
  if (src instanceof HTMLImageElement) return { w: src.naturalWidth, h: src.naturalHeight };
  return { w: src.width, h: src.height };
}

/** 칸을 가득 채우도록 확대한 뒤 가운데를 잘라 그린다 (CSS object-fit: cover와 같은 결과). */
export function drawCover(ctx: CanvasRenderingContext2D, src: Drawable, r: Rect): void {
  const { w, h } = sourceSize(src);
  if (!w || !h) return;
  const s = Math.max(r.w / w, r.h / h);
  const dw = w * s;
  const dh = h * s;
  ctx.drawImage(src, r.x + (r.w - dw) / 2, r.y + (r.h - dh) / 2, dw, dh);
}

/** 촬영본은 가장 큰 칸보다 크게 들고 있을 필요가 없어서 긴 변 1600px로 줄여 둔다. iPad WebKit의 캔버스 메모리 상한 대비. */
const SHOT_MAX = 1600;

/** drawCover가 원본에서 실제로 보여 주는 영역 (원본 픽셀) */
export function coverCrop(w: number, h: number, r: { w: number; h: number }): Rect {
  const s = Math.max(r.w / w, r.h / h);
  const cw = r.w / s;
  const ch = r.h / s;
  return { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch };
}

/** crop을 주면 그 영역만 쓴다 (카메라 화면의 검은 띠를 뺀 영역). */
export function toShot(src: Drawable, mirror: boolean, crop?: Rect | null): Shot {
  const size = sourceSize(src);
  const r = crop ?? { x: 0, y: 0, w: size.w, h: size.h };
  const { w, h } = r;
  const s = Math.min(1, SHOT_MAX / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * s);
  c.height = Math.round(h * s);
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  if (mirror) {
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, c.width, c.height);
  return c;
}

export function freeShot(shot: Shot | null | undefined): void {
  if (shot) {
    shot.width = 0;
    shot.height = 0;
  }
}

/** 사진 파일(카메라 앱으로 찍은 것)을 촬영본으로 바꾼다. EXIF 방향은 브라우저가 반영해서 그린다. */
export async function shotFromFile(file: File): Promise<Shot> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return toShot(img, false);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, r: Rect, radius: number): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(r.x, r.y, r.w, r.h, radius);
  else ctx.rect(r.x, r.y, r.w, r.h);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

export interface CompositeOptions {
  layout: LayoutKey;
  frame: FrameId;
  shots: (Shot | null)[];
  caption: string;
  date: Date | null;
  /** CSS font-family 값 */
  titleFont: string;
  dateFont: string;
  /**
   * 칸에 그리기 직전에 촬영본을 바꾼다 (보정·필터). 칸 크기(r)를 받아 칸에 보이는 부분만 처리해 돌려주면
   * 프레임·문구에는 영향이 없다. 돌려준 이미지는 바로 그려지므로 같은 작업 안에서만 유효해도 된다.
   */
  process?: (shot: Shot, index: number, cell: Rect) => Drawable;
  /** 1보다 작으면 축소 렌더 (프레임 고르기 썸네일). 좌표는 그대로 두고 캔버스만 줄인다. */
  scale?: number;
  /** 프레임 장식 위에 얹는 커스텀 캐릭터 (문구는 그 위에 쓴다) */
  characters?: Character[];
}

const MONO = 'ui-monospace, Menlo, "Courier New", monospace';
const SERIF = 'Georgia, "Nanum Myeongjo", "AppleMyungjo", serif';

export function drawLayoutPreview(canvas: HTMLCanvasElement, key: LayoutKey, paper: string, cell: string): void {
  const { width, height } = LAYOUTS[key].canvas;
  // 미리보기 높이를 약 216px로 맞춘다 (가로형은 폭 기준).
  const scale = width > height ? 0.06 * 1.5 : 0.06;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = cell;
  for (const r of photoRects(key)) {
    roundRect(ctx, { x: r.x * scale, y: r.y * scale, w: r.w * scale, h: r.h * scale }, 2);
    ctx.fill();
  }
}

/** 네 컷을 프레임에 합성한다. 큰 캔버스는 넘겨받은 것을 재사용한다. */
export function drawComposite(canvas: HTMLCanvasElement, o: CompositeOptions): void {
  const { width: W, height: H } = LAYOUTS[o.layout].canvas;
  const design = frameDesign(o.frame);
  const scale = o.scale ?? 1;
  const cw = Math.max(1, Math.round(W * scale));
  const ch = Math.max(1, Math.round(H * scale));
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalAlpha = 1;
  ctx.shadowColor = "transparent";
  ctx.imageSmoothingQuality = "high";

  const cells = photoRects(o.layout);
  const cap = captionRect(o.layout);
  // u: 짧은 변 1200 기준 단위 (스트립·가로 4컷 1, 4×6 2). scale: 썸네일 축소 배율 (그림자 번짐에 반영).
  const f: FrameContext = { ctx, W, H, u: Math.min(W, H) / 1200, cells, cap, scale };
  const u = f.u;
  ctx.save();
  design.background(f);
  ctx.restore();

  const { cell } = design;
  cells.forEach((r, i) => {
    // 그림자는 칸 모양을 한 번 칠하면서 만든다.
    if (cell.shadow) {
      ctx.save();
      ctx.shadowColor = cell.shadow.color;
      ctx.shadowBlur = cell.shadow.blur * u * scale;
      ctx.shadowOffsetY = cell.shadow.y * u * scale;
      ctx.fillStyle = cell.empty;
      roundRect(ctx, r, cell.radius * u);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    roundRect(ctx, r, cell.radius * u);
    ctx.clip();
    ctx.fillStyle = cell.empty;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    const shot = o.shots[i];
    if (shot) drawCover(ctx, o.process ? o.process(shot, i, r) : shot, r);
    ctx.restore();
    if (cell.stroke) {
      // 테두리는 칸 바깥쪽으로 그려 사진을 가리지 않는다.
      const sw = cell.stroke.width * u;
      ctx.save();
      ctx.strokeStyle = cell.stroke.color;
      ctx.lineWidth = sw;
      roundRect(ctx, { x: r.x - sw / 2, y: r.y - sw / 2, w: r.w + sw, h: r.h + sw }, cell.radius ? cell.radius * u + sw / 2 : 0);
      ctx.stroke();
      ctx.restore();
    }
  });

  if (design.over) {
    ctx.save();
    design.over(f);
    ctx.restore();
  }

  if (o.characters?.length) drawCharacters(ctx, W, H, o.characters, scale);

  const t = design.text;
  // 문구가 비어 있으면 아무것도 쓰지 않는다 (날짜만 있으면 날짜만 가운데에).
  const title = o.caption.trim();
  if (!title && !o.date) return;
  // 문구 칸 위쪽을 장식이 쓰는 프레임(신문 제호 등)은 그 아래에서 글자를 배치한다.
  const inset = (t.captionTop ?? 0) * u;
  const area = { ...cap, y: cap.y + inset, h: cap.h - inset };
  const titleSize = Math.min(area.h * 0.32, area.w * (area.h > area.w ? 0.15 : 0.11));
  // 날짜만 쓸 때는 문구 크기와 상관없이 날짜 칸에 맞춘다 (세로 스트립은 날짜 칸이 낮다).
  const dateSize = title ? titleSize * 0.42 : Math.min(area.h * 0.22, area.w * (area.h > area.w ? 0.07 : 0.045));
  const spacing = titleSize * 0.25;
  const total = (title ? titleSize : 0) + (title && o.date ? spacing : 0) + (o.date ? dateSize : 0);
  let y = area.y + (area.h - total) / 2;
  const cx = area.x + area.w / 2;
  const titleFont = t.font === "mono" ? MONO : t.font === "serif" ? SERIF : o.titleFont;
  const dateFont = t.font === "mono" ? MONO : t.font === "serif" ? SERIF : o.dateFont;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `${t.font ? "700 " : ""}${titleSize}px ${titleFont}`;
  const line = title ? fitText(ctx, title, cap.w * 0.9) : "";
  if (t.backdrop) {
    ctx.font = title ? ctx.font : `600 ${dateSize}px ${dateFont}`;
    const textW = title ? ctx.measureText(line).width : ctx.measureText(formatDate(o.date!)).width;
    const pad = title ? titleSize : dateSize;
    const bw = Math.min(cap.w, Math.max(textW + pad * 1.4, cap.w * (title ? 0.6 : 0.4)));
    ctx.fillStyle = t.backdrop;
    roundRect(ctx, { x: cx - bw / 2, y: y - pad * 0.35, w: bw, h: total + pad * 0.7 }, 24 * u);
    ctx.fill();
    ctx.font = `${t.font ? "700 " : ""}${titleSize}px ${titleFont}`;
  }
  if (t.tilt) {
    ctx.translate(cx, y + total / 2);
    ctx.rotate((t.tilt * Math.PI) / 180);
    ctx.translate(-cx, -(y + total / 2));
  }
  if (title) {
    if (t.glow) {
      ctx.shadowColor = t.glow;
      ctx.shadowBlur = 16 * u * scale;
    }
    if (t.stroke) {
      ctx.lineJoin = "round";
      ctx.lineWidth = titleSize * 0.12;
      ctx.strokeStyle = t.stroke;
      ctx.strokeText(line, cx, y);
    }
    ctx.fillStyle = t.color;
    ctx.fillText(line, cx, y);
    y += titleSize + spacing;
  }
  if (o.date) {
    ctx.shadowColor = "transparent";
    ctx.globalAlpha = 0.85;
    ctx.font = `600 ${dateSize}px ${dateFont}`;
    ctx.fillStyle = t.dateColor;
    ctx.fillText((t.datePrefix ?? "") + formatDate(o.date), cx, y);
  }
  ctx.restore();
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.95): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}
