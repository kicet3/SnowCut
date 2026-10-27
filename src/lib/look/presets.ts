/**
 * 색 필터 정의. 셰이더에 넘길 값만 계산하는 순수 함수라서 브라우저 없이 테스트한다.
 *
 * 필터 수치는 CSSgram(https://github.com/una/CSSgram)과 instagram.css(MIT)의 CSS 근사치를 바탕으로 했다.
 */

/** W3C Compositing 블렌드 모드. 숫자는 셰이더의 분기 번호와 같다. */
export const BLEND = { normal: 0, multiply: 1, screen: 2, overlay: 3, softLight: 4, darken: 5, lighten: 6 } as const;
export type BlendMode = keyof typeof BLEND;

export type ColorOp =
  | ["brightness", number]
  | ["contrast", number]
  | ["saturate", number]
  | ["sepia", number]
  | ["grayscale", number]
  | ["hueRotate", number];

export interface Overlay {
  /** 0..255 */
  color: [number, number, number];
  alpha: number;
  mode: BlendMode;
}

export type FilterId =
  | "original"
  | "soft"
  | "vivid"
  | "lovely"
  | "sunny"
  | "fresh"
  | "film"
  | "retro"
  | "mood"
  | "mono"
  | "ink";

export interface FilterDef {
  id: FilterId;
  name: string;
  /** 오버레이를 먼저 섞은 뒤 ops를 왼쪽부터 적용한다 (CSSgram 구조와 같은 순서). */
  overlays: Overlay[];
  ops: ColorOp[];
  vignette?: number;
  grain?: number;
  /** 버튼에 쓰는 대표 색 */
  chip: string;
}

export const FILTERS: FilterDef[] = [
  { id: "original", name: "원본", overlays: [], ops: [], chip: "#c9b8b1" },
  {
    id: "soft",
    name: "화사",
    overlays: [{ color: [240, 149, 128], alpha: 0.2, mode: "softLight" }],
    ops: [["brightness", 1.12], ["contrast", 0.88], ["saturate", 0.9]],
    chip: "#f7c9bd",
  },
  {
    id: "vivid",
    name: "선명",
    overlays: [{ color: [127, 187, 227], alpha: 0.2, mode: "overlay" }],
    ops: [["contrast", 1.2], ["saturate", 1.35]],
    chip: "#4fa3e0",
  },
  {
    id: "lovely",
    name: "러블리",
    overlays: [{ color: [243, 106, 188], alpha: 0.3, mode: "screen" }],
    ops: [["contrast", 1.1], ["brightness", 1.1], ["saturate", 1.3]],
    chip: "#f36abc",
  },
  {
    id: "sunny",
    name: "햇살",
    overlays: [{ color: [230, 193, 61], alpha: 0.1, mode: "lighten" }],
    ops: [["sepia", 0.25], ["contrast", 1.1], ["brightness", 1.1]],
    chip: "#e6c13d",
  },
  {
    id: "fresh",
    name: "청량",
    // 하늘색 소프트 라이트만 쓴다. hue-rotate는 피부색이 틀어져서 쓰지 않는다.
    overlays: [{ color: [127, 187, 227], alpha: 0.35, mode: "softLight" }],
    ops: [["contrast", 1.05], ["brightness", 1.05], ["saturate", 0.92]],
    chip: "#9fd3f0",
  },
  {
    id: "film",
    name: "필름",
    overlays: [{ color: [239, 205, 173], alpha: 0.5, mode: "softLight" }],
    ops: [["sepia", 0.22], ["brightness", 1.1], ["contrast", 0.85], ["saturate", 0.75]],
    vignette: 0.15,
    grain: 0.035,
    chip: "#d8b48c",
  },
  {
    id: "retro",
    name: "레트로",
    overlays: [{ color: [125, 105, 24], alpha: 0.2, mode: "multiply" }],
    ops: [["sepia", 0.5], ["contrast", 1.25], ["brightness", 1.15], ["saturate", 0.9], ["hueRotate", -2]],
    vignette: 0.35,
    grain: 0.03,
    chip: "#9a7b3c",
  },
  {
    id: "mood",
    name: "무드",
    overlays: [
      { color: [69, 41, 12], alpha: 0.4, mode: "lighten" },
      { color: [125, 105, 24], alpha: 0.5, mode: "softLight" },
    ],
    ops: [["saturate", 0.66], ["brightness", 1.05]],
    chip: "#6b5a3a",
  },
  {
    id: "mono",
    name: "흑백",
    overlays: [
      { color: [160, 160, 160], alpha: 1, mode: "softLight" },
      { color: [56, 56, 56], alpha: 1, mode: "lighten" },
    ],
    ops: [["grayscale", 1], ["contrast", 1.1], ["brightness", 1.1]],
    chip: "#9a9a9a",
  },
  {
    id: "ink",
    name: "진한흑백",
    overlays: [],
    ops: [["sepia", 0.3], ["contrast", 1.1], ["brightness", 1.1], ["grayscale", 1]],
    grain: 0.04,
    chip: "#3a3a3a",
  },
];

export const DEFAULT_FILTER: FilterId = "original";

export function filterDef(id: FilterId): FilterDef {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0];
}

/** 3×4 행렬(행 우선, 각 행 끝은 오프셋). c' = M·c + o */
export type Affine = number[];

export const IDENTITY: Affine = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];

function linear(m: number[], offset = 0): Affine {
  return [m[0], m[1], m[2], offset, m[3], m[4], m[5], offset, m[6], m[7], m[8], offset];
}

/** W3C Filter Effects 1의 필터 함수 행렬 */
export function opMatrix([op, a]: ColorOp): Affine {
  switch (op) {
    case "brightness":
      return linear([a, 0, 0, 0, a, 0, 0, 0, a]);
    case "contrast":
      return linear([a, 0, 0, 0, a, 0, 0, 0, a], 0.5 - 0.5 * a);
    case "saturate":
      return linear([
        0.213 + 0.787 * a, 0.715 - 0.715 * a, 0.072 - 0.072 * a,
        0.213 - 0.213 * a, 0.715 + 0.285 * a, 0.072 - 0.072 * a,
        0.213 - 0.213 * a, 0.715 - 0.715 * a, 0.072 + 0.928 * a,
      ]);
    case "sepia": {
      const t = 1 - Math.min(1, a);
      return linear([
        0.393 + 0.607 * t, 0.769 - 0.769 * t, 0.189 - 0.189 * t,
        0.349 - 0.349 * t, 0.686 + 0.314 * t, 0.168 - 0.168 * t,
        0.272 - 0.272 * t, 0.534 - 0.534 * t, 0.131 + 0.869 * t,
      ]);
    }
    case "grayscale": {
      const t = 1 - Math.min(1, a);
      return linear([
        0.2126 + 0.7874 * t, 0.7152 - 0.7152 * t, 0.0722 - 0.0722 * t,
        0.2126 - 0.2126 * t, 0.7152 + 0.2848 * t, 0.0722 - 0.0722 * t,
        0.2126 - 0.2126 * t, 0.7152 - 0.7152 * t, 0.0722 + 0.9278 * t,
      ]);
    }
    case "hueRotate": {
      const r = (a * Math.PI) / 180;
      const c = Math.cos(r);
      const s = Math.sin(r);
      return linear([
        0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
        0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
        0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
      ]);
    }
  }
}

/** b를 먼저, 그다음 a를 적용하는 행렬 (a∘b) */
export function compose(a: Affine, b: Affine): Affine {
  const out: number[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out.push(a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c]);
    }
    out.push(a[r * 4] * b[3] + a[r * 4 + 1] * b[7] + a[r * 4 + 2] * b[11] + a[r * 4 + 3]);
  }
  return out;
}

/** 필터 함수 목록을 행렬 하나로 합친다. CSS는 단계마다 0..1로 자르지만 차이가 작아서 한 번에 계산한다. */
export function filterMatrix(ops: ColorOp[]): Affine {
  return ops.reduce<Affine>((acc, op) => compose(opMatrix(op), acc), IDENTITY);
}

export function applyAffine(m: Affine, [r, g, b]: [number, number, number]): [number, number, number] {
  return [
    m[0] * r + m[1] * g + m[2] * b + m[3],
    m[4] * r + m[5] * g + m[6] * b + m[7],
    m[8] * r + m[9] * g + m[10] * b + m[11],
  ];
}

export function isIdentityFilter(f: FilterDef): boolean {
  return !f.overlays.length && !f.ops.length && !f.vignette && !f.grain;
}
