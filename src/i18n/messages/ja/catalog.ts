import type { Messages } from "../ko";

/** 레이아웃 · 프레임 · 필터 이름. 키는 src/lib/frame.ts · frames.ts · look/presets.ts의 id와 같다 (catalog.test.ts가 확인). */
const catalog: Messages["catalog"] = {
  layouts: {
    strip: { title: "縦4カット", paper: "2×6インチ" },
    grid: { title: "2×2グリッド", paper: "4×6インチ" },
    strip3: { title: "縦3カット", paper: "2×6インチ" },
    grid6: { title: "2×3 6カット", paper: "4×6インチ" },
    wide: { title: "横4カット", paper: "6×2インチ" },
    hero: { title: "大1カット＋3カット", paper: "4×6インチ" },
  },
  frameCategories: { basic: "ベーシック", pattern: "パターン", mood: "エモい", season: "シーズン" },
  frames: {
    white: "ホワイト",
    black: "ブラック",
    pink: "ピンク",
    sky: "スカイ",
    mint: "ミント",
    lavender: "ラベンダー",
    "checker-pink": "ピンクチェッカー",
    "checker-bw": "モノクロチェッカー",
    "gingham-pink": "ピンクギンガム",
    "gingham-blue": "ブルーギンガム",
    dots: "ドット",
    stripe: "ストライプ",
    film: "フィルム",
    newspaper: "ニュースペーパー",
    y2k: "Y2Kクローム",
    night: "星空",
    pastel: "パステル",
    doodle: "落書き",
    hearts: "ラブハート",
    sakura: "桜",
    xmas: "クリスマス",
  },
  filters: {
    original: "オリジナル",
    soft: "ふんわり",
    vivid: "くっきり",
    lovely: "ラブリー",
    sunny: "ひだまり",
    fresh: "爽やか",
    film: "フィルム",
    retro: "レトロ",
    mood: "ムード",
    mono: "モノクロ",
    ink: "濃いモノクロ",
  },
};

export default catalog;
