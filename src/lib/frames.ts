import type { Rect } from "./frame";

/**
 * 프레임 디자인. 이미지 파일 없이 Canvas 2D로 그린다 (브랜드 로고·캐릭터 없이 장르에서 흔한 무늬만 쓴다).
 * 크기는 u(= 캔버스 짧은 변 / 1200) 단위라서 스트립·가로 4컷(u=1)과 4×6 레이아웃(u=2)에서 같은 비율로 보인다.
 * 무늬의 위치는 고정 시드 난수라서 미리보기 썸네일과 저장본이 같다.
 */

export type FrameCategory = "basic" | "pattern" | "mood" | "season";

export const FRAME_CATEGORIES: { id: FrameCategory; name: string }[] = [
  { id: "basic", name: "베이직" },
  { id: "pattern", name: "패턴" },
  { id: "mood", name: "감성" },
  { id: "season", name: "시즌" },
];

export interface FrameContext {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  u: number;
  cells: Rect[];
  cap: Rect;
  /** 썸네일 축소 배율. shadowBlur는 변환을 따르지 않아서 직접 곱한다. */
  scale: number;
}

interface CellStyle {
  radius: number;
  stroke?: { width: number; color: string };
  shadow?: { blur: number; y: number; color: string };
  /** 아직 사진이 없는 칸 */
  empty: string;
}

interface TextStyle {
  color: string;
  dateColor: string;
  font?: "display" | "mono" | "serif";
  /** 글자 뒤 외곽선 */
  stroke?: string;
  glow?: string;
  /** 문구 영역 뒤 둥근 판 */
  backdrop?: string;
  /** 기울기(도) */
  tilt?: number;
  /** 날짜 앞에 붙이는 말 */
  datePrefix?: string;
  /** 문구 칸 위쪽에 장식이 있으면 글자를 이만큼(u) 아래에서 배치 */
  captionTop?: number;
}

export interface FrameDesign {
  id: string;
  name: string;
  category: FrameCategory;
  /** 선택 칩의 대표 색 (CSS background) */
  chip: string;
  cell: CellStyle;
  text: TextStyle;
  background: (f: FrameContext) => void;
  /** 사진 위에 얹는 장식 */
  over?: (f: FrameContext) => void;
}

// ---------- 도구 ----------

/** 시드 고정 난수 (mulberry32) */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fill(ctx: CanvasRenderingContext2D, color: string | CanvasGradient | CanvasPattern, W: number, H: number) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

function vertical(ctx: CanvasRenderingContext2D, H: number, stops: string[]): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}

function diagonal(ctx: CanvasRenderingContext2D, W: number, H: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, W, H);
  for (const [at, c] of stops) g.addColorStop(at, c);
  return g;
}

function insideAny(x: number, y: number, rects: Rect[], pad = 0): boolean {
  return rects.some((r) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad);
}

export function heartPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.35);
  ctx.bezierCurveTo(cx - s * 0.6, cy - s * 0.05, cx - s * 0.3, cy - s * 0.55, cx, cy - s * 0.2);
  ctx.bezierCurveTo(cx + s * 0.3, cy - s * 0.55, cx + s * 0.6, cy - s * 0.05, cx, cy + s * 0.35);
  ctx.closePath();
}

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, r = R * 0.45): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
}

/** 네 갈래 반짝이 */
function sparklePath(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  const t = s * 0.16;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.quadraticCurveTo(cx + t, cy - t, cx + s, cy);
  ctx.quadraticCurveTo(cx + t, cy + t, cx, cy + s);
  ctx.quadraticCurveTo(cx - t, cy + t, cx - s, cy);
  ctx.quadraticCurveTo(cx - t, cy - t, cx, cy - s);
  ctx.closePath();
}

function flower(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, rot: number, petal: string, core: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i++) {
    ctx.rotate((Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.55, s * 0.32, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function snowflake(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string, w: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -s);
    ctx.moveTo(0, -s * 0.55);
    ctx.lineTo(s * 0.22, -s * 0.75);
    ctx.moveTo(0, -s * 0.55);
    ctx.lineTo(-s * 0.22, -s * 0.75);
    ctx.stroke();
  }
  ctx.restore();
}

function tilePattern(
  ctx: CanvasRenderingContext2D,
  size: number,
  draw: (t: CanvasRenderingContext2D, s: number) => void,
): CanvasPattern | string {
  const c = document.createElement("canvas");
  c.width = c.height = Math.max(2, Math.round(size));
  const t = c.getContext("2d");
  if (!t) return "#ffffff";
  draw(t, c.width);
  return ctx.createPattern(c, "repeat") ?? "#ffffff";
}

/** 패턴 타일은 캔버스 크기 기준이라, 축소 렌더(썸네일)에서도 같은 크기로 보이게 현재 배율을 반영한다. */
function patternScale(ctx: CanvasRenderingContext2D): number {
  const m = ctx.getTransform();
  return Math.hypot(m.a, m.b) || 1;
}

function fillPattern(f: FrameContext, tile: number, draw: (t: CanvasRenderingContext2D, s: number) => void) {
  const { ctx, W, H } = f;
  const k = patternScale(ctx);
  const p = tilePattern(ctx, tile * k, draw);
  ctx.save();
  // 패턴은 변환을 따르므로 배율을 되돌려 타일 픽셀이 화면 픽셀과 맞게 한다.
  if (typeof p !== "string") p.setTransform(new DOMMatrix([1 / k, 0, 0, 1 / k, 0, 0]));
  fill(ctx, p, W, H);
  ctx.restore();
}

// ---------- 디자인 ----------

const solid = (id: string, name: string, bg: string, fg: string, empty = "#d9d9d9"): FrameDesign => ({
  id,
  name,
  category: "basic",
  chip: bg,
  cell: { radius: 16, empty },
  text: { color: fg, dateColor: fg },
  background: ({ ctx, W, H }) => fill(ctx, bg, W, H),
});

const checker = (id: string, name: string, a: string, b: string): FrameDesign => ({
  id,
  name,
  category: "pattern",
  chip: `conic-gradient(${a} 25%, ${b} 0 50%, ${a} 0 75%, ${b} 0)`,
  cell: { radius: 20, stroke: { width: 10, color: "#ffffff" }, empty: "#eeeeee" },
  text: { color: "#111111", dateColor: "#555555", backdrop: "#ffffff" },
  background: (f) =>
    fillPattern(f, 120 * f.u, (t, s) => {
      t.fillStyle = a;
      t.fillRect(0, 0, s, s);
      t.fillStyle = b;
      t.fillRect(0, 0, s / 2, s / 2);
      t.fillRect(s / 2, s / 2, s / 2, s / 2);
    }),
});

const gingham = (id: string, name: string, band: string, ink: string): FrameDesign => ({
  id,
  name,
  category: "pattern",
  chip: `repeating-linear-gradient(90deg, ${band} 0 6px, #fff 6px 12px)`,
  cell: { radius: 12, stroke: { width: 8, color: "#ffffff" }, shadow: { blur: 16, y: 6, color: "rgba(0,0,0,.12)" }, empty: "#eeeeee" },
  text: { color: ink, dateColor: ink, backdrop: "#ffffff" },
  background: (f) =>
    fillPattern(f, 80 * f.u, (t, s) => {
      t.fillStyle = "#ffffff";
      t.fillRect(0, 0, s, s);
      t.fillStyle = band;
      t.fillRect(0, 0, s / 2, s);
      t.fillRect(0, 0, s, s / 2);
    }),
});

export const FRAMES: FrameDesign[] = [
  solid("white", "화이트", "#ffffff", "#1f1f1f"),
  solid("black", "블랙", "#141417", "#f5f5f5", "#383838"),
  solid("pink", "핑크", "#ffccdb", "#1f1f1f"),
  solid("sky", "스카이", "#bddeff", "#1f1f1f"),
  solid("mint", "민트", "#c2f2de", "#1f1f1f"),
  solid("lavender", "라벤더", "#dbcfff", "#1f1f1f"),

  checker("checker-pink", "핑크 체커", "#ffd6e7", "#ffffff"),
  checker("checker-bw", "흑백 체커", "#ffffff", "#111111"),
  gingham("gingham-pink", "핑크 깅엄", "rgba(231,84,128,0.35)", "#c2185b"),
  gingham("gingham-blue", "블루 깅엄", "rgba(70,120,220,0.35)", "#2a4f9e"),
  {
    id: "dots",
    name: "도트",
    category: "pattern",
    chip: "radial-gradient(#fff 30%, #ffe27a 32%) 0 0 / 10px 10px",
    cell: { radius: 24, stroke: { width: 8, color: "#ffffff" }, empty: "#eeeeee" },
    text: { color: "#5b4300", dateColor: "#8a6d1c" },
    background: (f) =>
      fillPattern(f, 70 * f.u, (t, s) => {
        t.fillStyle = "#ffe27a";
        t.fillRect(0, 0, s, s);
        t.fillStyle = "#ffffff";
        for (const [x, y] of [
          [0.25, 0.25],
          [0.75, 0.75],
        ]) {
          t.beginPath();
          t.arc(x * s, y * s, s * 0.11, 0, Math.PI * 2);
          t.fill();
        }
      }),
  },
  {
    id: "stripe",
    name: "스트라이프",
    category: "pattern",
    chip: "repeating-linear-gradient(90deg, #7cc8ff 0 5px, #fff 5px 10px)",
    cell: { radius: 16, stroke: { width: 8, color: "#ffffff" }, empty: "#eeeeee" },
    text: { color: "#1d4f7a", dateColor: "#1d4f7a", backdrop: "#ffffff" },
    background: (f) =>
      fillPattern(f, 80 * f.u, (t, s) => {
        t.fillStyle = "#ffffff";
        t.fillRect(0, 0, s, s);
        t.fillStyle = "#9fd6ff";
        t.fillRect(0, 0, s / 2, s);
      }),
  },

  {
    id: "film",
    name: "필름",
    category: "mood",
    chip: "#111",
    cell: { radius: 0, stroke: { width: 4, color: "#2a2a2a" }, empty: "#2a2a2a" },
    text: { color: "#f2efe6", dateColor: "#e8a33d", font: "mono" },
    background: ({ ctx, W, H, cells }) => {
      fill(ctx, "#111111", W, H);
      // 양옆 여백에 스프로킷 구멍
      const margin = cells[0].x;
      const hw = margin * 0.45;
      const hh = hw * 1.45;
      const step = hh * 1.9;
      ctx.fillStyle = "#f2efe6";
      for (let y = step * 0.4; y + hh < H; y += step) {
        for (const x of [(margin - hw) / 2, W - (margin + hw) / 2]) {
          ctx.beginPath();
          ctx.roundRect(x, y, hw, hh, hw * 0.22);
          ctx.fill();
        }
      }
    },
    over: ({ ctx, u, cells, scale }) => {
      // 칸 사이 간격이 가장 좁은 레이아웃(30px)에도 들어가게 칸 아래 가장자리 안쪽에 쓴다.
      ctx.fillStyle = "#e8a33d";
      ctx.font = `700 ${22 * u}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.shadowColor = "rgba(0,0,0,.6)";
      ctx.shadowBlur = 4 * u * scale;
      cells.forEach((r, i) => ctx.fillText(`${12 + i}${i % 2 ? "" : "A"}  ▶`, r.x + r.w - 10 * u, r.y + r.h - 8 * u));
    },
  },
  {
    id: "newspaper",
    name: "뉴스페이퍼",
    category: "mood",
    chip: "#f3efe4",
    cell: { radius: 0, stroke: { width: 3, color: "#111111" }, empty: "#dcd6c6" },
    text: { color: "#111111", dateColor: "#333333", font: "serif", datePrefix: "VOL.1 · ", captionTop: 76 },
    background: ({ ctx, W, H, u, cap }) => {
      fill(ctx, "#f3efe4", W, H);
      const rnd = seeded(7);
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      for (let i = 0; i < 1400; i++) ctx.fillRect(rnd() * W, rnd() * H, 2 * u, 2 * u);
      // 문구 위 이중 괘선과 제호
      ctx.fillStyle = "#111111";
      ctx.fillRect(cap.x, cap.y + 24 * u, cap.w, 4 * u);
      ctx.fillRect(cap.x, cap.y + 34 * u, cap.w, 1.5 * u);
      ctx.font = `700 ${22 * u}px Georgia, "Nanum Myeongjo", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("THE SNOWCUT TIMES", cap.x + cap.w / 2, cap.y + 44 * u);
    },
  },
  {
    id: "y2k",
    name: "Y2K 크롬",
    category: "mood",
    chip: "linear-gradient(135deg,#e6e9ef,#9aa3b2 35%,#fff 50%,#7d8696 70%,#dfe3ea)",
    cell: { radius: 24, stroke: { width: 10, color: "#ffffff" }, shadow: { blur: 18, y: 4, color: "rgba(80,90,120,.35)" }, empty: "#c9ced8" },
    text: { color: "#3a4150", dateColor: "#3a4150", stroke: "#ffffff" },
    background: ({ ctx, W, H }) => {
      fill(
        ctx,
        diagonal(ctx, W, H, [
          [0, "#e6e9ef"],
          [0.35, "#9aa3b2"],
          [0.5, "#ffffff"],
          [0.7, "#7d8696"],
          [1, "#dfe3ea"],
        ]),
        W,
        H,
      );
    },
    over: ({ ctx, W, H, u, scale }) => {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#b7c4ff";
      ctx.shadowBlur = 20 * u * scale;
      for (const [x, y, s] of [
        [0.08, 0.03, 60],
        [0.93, 0.18, 44],
        [0.06, 0.45, 40],
        [0.95, 0.62, 70],
        [0.1, 0.8, 50],
        [0.9, 0.86, 40],
      ]) {
        sparklePath(ctx, x * W, y * H, s * u);
        ctx.fill();
      }
      ctx.restore();
    },
  },
  {
    id: "night",
    name: "별밤",
    category: "mood",
    chip: "linear-gradient(#0b1033,#2a1b5c)",
    cell: { radius: 16, stroke: { width: 4, color: "rgba(255,230,128,.6)" }, empty: "#2b2f55" },
    text: { color: "#ffe680", dateColor: "#c8c3ff", glow: "#ffe680" },
    background: ({ ctx, W, H, u, cells, scale }) => {
      fill(ctx, vertical(ctx, H, ["#0b1033", "#2a1b5c"]), W, H);
      const rnd = seeded(3);
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 160; i++) {
        ctx.globalAlpha = 0.4 + rnd() * 0.6;
        ctx.beginPath();
        ctx.arc(rnd() * W, rnd() * H, (1 + rnd() * 2.5) * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.fillStyle = "#ffe680";
      ctx.shadowColor = "#ffe680";
      ctx.shadowBlur = 20 * u * scale;
      for (let i = 0; i < 16; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        if (insideAny(x, y, cells, 20 * u)) continue;
        starPath(ctx, x, y, (18 + rnd() * 26) * u);
        ctx.fill();
      }
      ctx.restore();
    },
  },
  {
    id: "pastel",
    name: "파스텔",
    category: "mood",
    chip: "linear-gradient(160deg,#ffd6e8,#e3d5ff,#cdefff)",
    cell: { radius: 32, shadow: { blur: 24, y: 8, color: "rgba(120,90,160,.2)" }, empty: "#ffffff" },
    text: { color: "#6b4fa0", dateColor: "#8f7bb8" },
    background: ({ ctx, W, H }) =>
      fill(
        ctx,
        diagonal(ctx, W * 0.4, H, [
          [0, "#ffd6e8"],
          [0.5, "#e3d5ff"],
          [1, "#cdefff"],
        ]),
        W,
        H,
      ),
  },
  {
    id: "doodle",
    name: "낙서",
    category: "mood",
    chip: "#fffdf5",
    cell: { radius: 18, stroke: { width: 6, color: "#222222" }, empty: "#eeeeee" },
    text: { color: "#222222", dateColor: "#222222", tilt: -3 },
    background: (f) =>
      fillPattern(f, 40 * f.u, (t, s) => {
        t.fillStyle = "#fffdf5";
        t.fillRect(0, 0, s, s);
        t.fillStyle = "#e5dcc8";
        t.beginPath();
        t.arc(s / 2, s / 2, s * 0.06, 0, Math.PI * 2);
        t.fill();
      }),
    over: ({ ctx, u, cells }) => {
      ctx.save();
      ctx.lineWidth = 5 * u;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#222222";
      const at = (i: number, corner: number): [number, number] => {
        const r = cells[i % cells.length];
        return [corner % 2 ? r.x + r.w : r.x, corner < 2 ? r.y : r.y + r.h];
      };
      // 웃는 얼굴
      {
        const [x, y] = at(0, 1);
        ctx.fillStyle = "#ffd84d";
        ctx.beginPath();
        ctx.arc(x - 10 * u, y + 10 * u, 46 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#222222";
        for (const dx of [-16, 16]) {
          ctx.beginPath();
          ctx.arc(x - 10 * u + dx * u, y - 2 * u, 5 * u, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x - 10 * u, y + 14 * u, 22 * u, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
      // 번개
      {
        const [x, y] = at(1, 2);
        ctx.fillStyle = "#7fd3ff";
        ctx.beginPath();
        ctx.moveTo(x + 10 * u, y - 60 * u);
        ctx.lineTo(x - 22 * u, y + 4 * u);
        ctx.lineTo(x + 2 * u, y + 4 * u);
        ctx.lineTo(x - 12 * u, y + 56 * u);
        ctx.lineTo(x + 30 * u, y - 14 * u);
        ctx.lineTo(x + 6 * u, y - 14 * u);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // 하트
      {
        const [x, y] = at(2, 1);
        ctx.fillStyle = "#ff8fab";
        heartPath(ctx, x - 6 * u, y + 6 * u, 90 * u);
        ctx.fill();
        ctx.stroke();
      }
      // 별
      {
        const [x, y] = at(3, 3);
        ctx.fillStyle = "#9be37a";
        starPath(ctx, x - 10 * u, y - 10 * u, 46 * u);
        ctx.fill();
        ctx.stroke();
      }
      // 물결
      {
        const [x, y] = at(3, 0);
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) ctx.lineTo(x + 8 * u + i * 4 * u, y - 18 * u + Math.sin(i / 2.2) * 9 * u);
        ctx.stroke();
      }
      ctx.restore();
    },
  },

  {
    id: "hearts",
    name: "러브 하트",
    category: "season",
    chip: "linear-gradient(#ffd1dc,#ffb3c7)",
    cell: { radius: 28, stroke: { width: 8, color: "#ffffff" }, empty: "#ffe3ec" },
    text: { color: "#ffffff", dateColor: "#ffffff", stroke: "#ff4d85" },
    background: ({ ctx, W, H, u, cells }) => {
      fill(ctx, vertical(ctx, H, ["#ffd1dc", "#ffb3c7"]), W, H);
      const rnd = seeded(1);
      const colors = ["#ff6b9a", "#ffffff", "#ff8fb1"];
      for (let i = 0; i < 70; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        const s = (28 + rnd() * 40) * u;
        const c = colors[Math.floor(rnd() * colors.length)];
        const a = 0.5 + rnd() * 0.4;
        if (insideAny(x, y, cells)) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = c;
        heartPath(ctx, x, y, s);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    over: ({ ctx, u, cells }) => {
      ctx.fillStyle = "#ff4d85";
      const a = cells[0];
      const b = cells[cells.length - 1];
      heartPath(ctx, a.x + a.w - 14 * u, a.y + 10 * u, 96 * u);
      ctx.fill();
      heartPath(ctx, b.x + 14 * u, b.y + b.h - 6 * u, 96 * u);
      ctx.fill();
    },
  },
  {
    id: "sakura",
    name: "벚꽃",
    category: "season",
    chip: "linear-gradient(#fff0f5,#ffd9e6)",
    cell: { radius: 24, stroke: { width: 6, color: "#ffffff" }, empty: "#ffe8ef" },
    text: { color: "#d6336c", dateColor: "#b07a8c" },
    background: ({ ctx, W, H, u, cells }) => {
      fill(ctx, vertical(ctx, H, ["#fff0f5", "#ffd9e6"]), W, H);
      const rnd = seeded(5);
      for (let i = 0; i < 60; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        const s = (20 + rnd() * 26) * u;
        const rot = rnd() * Math.PI;
        const petal = rnd() < 0.5;
        if (insideAny(x, y, cells)) continue;
        if (petal) {
          ctx.fillStyle = "#ffb7c5";
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.3, s * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          flower(ctx, x, y, s, rot, "#ffb7c5", "#ff8fa3");
        }
      }
    },
    over: ({ ctx, u, cells }) => {
      const a = cells[0];
      flower(ctx, a.x + 8 * u, a.y + 8 * u, 60 * u, 0.3, "#ffa3b8", "#ff7092");
      const b = cells[cells.length - 1];
      flower(ctx, b.x + b.w - 8 * u, b.y + b.h - 8 * u, 60 * u, 1.1, "#ffa3b8", "#ff7092");
    },
  },
  {
    id: "xmas",
    name: "크리스마스",
    category: "season",
    chip: "linear-gradient(#1f4d3a,#163a2b)",
    cell: { radius: 16, stroke: { width: 8, color: "#f5e6c8" }, empty: "#2c5e48" },
    text: { color: "#f5e6c8", dateColor: "#ffcdd2" },
    background: ({ ctx, W, H, u, cells }) => {
      fill(ctx, "#1f4d3a", W, H);
      // 위쪽 사탕 지팡이 띠
      const band = cells[0].y * 0.45;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, band);
      ctx.clip();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, band);
      ctx.fillStyle = "#c8102e";
      for (let x = -band; x < W + band; x += 60 * u) {
        ctx.beginPath();
        ctx.moveTo(x, band);
        ctx.lineTo(x + 30 * u, band);
        ctx.lineTo(x + 30 * u + band, 0);
        ctx.lineTo(x + band, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      const rnd = seeded(9);
      for (let i = 0; i < 40; i++) {
        const x = rnd() * W;
        const y = band + rnd() * (H - band);
        const s = (14 + rnd() * 24) * u;
        if (insideAny(x, y, cells, s)) continue;
        snowflake(ctx, x, y, s, "rgba(255,255,255,.8)", 3 * u);
      }
    },
    over: ({ ctx, u, cap }) => {
      // 문구 양쪽 위 호랑가시나무
      for (const x of [cap.x + 40 * u, cap.x + cap.w - 40 * u]) {
        const y = cap.y + 40 * u;
        ctx.fillStyle = "#2e7d32";
        ctx.beginPath();
        ctx.ellipse(x - 22 * u, y, 30 * u, 14 * u, -0.5, 0, Math.PI * 2);
        ctx.ellipse(x + 22 * u, y, 30 * u, 14 * u, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d32f2f";
        for (const [dx, dy] of [
          [0, -8],
          [-10, 6],
          [10, 6],
        ]) {
          ctx.beginPath();
          ctx.arc(x + dx * u, y + dy * u, 9 * u, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },
];

export type FrameId = string;
export const DEFAULT_FRAME: FrameId = "white";

export function frameDesign(id: FrameId): FrameDesign {
  return FRAMES.find((f) => f.id === id) ?? FRAMES[0];
}
