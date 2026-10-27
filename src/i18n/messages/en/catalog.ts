import type { Messages } from "../ko";

/** 레이아웃 · 프레임 · 필터 이름. 키는 src/lib/frame.ts · frames.ts · look/presets.ts의 id와 같다 (catalog.test.ts가 확인). */
const catalog: Messages["catalog"] = {
  layouts: {
    strip: { title: "Vertical 4", paper: "2×6 in" },
    grid: { title: "2×2 grid", paper: "4×6 in" },
    strip3: { title: "Vertical 3", paper: "2×6 in" },
    grid6: { title: "2×3 six-shot", paper: "4×6 in" },
    wide: { title: "Horizontal 4", paper: "6×2 in" },
    hero: { title: "1 big + 3", paper: "4×6 in" },
  },
  frameCategories: { basic: "Basic", pattern: "Pattern", mood: "Mood", season: "Seasonal" },
  frames: {
    white: "White",
    black: "Black",
    pink: "Pink",
    sky: "Sky",
    mint: "Mint",
    lavender: "Lavender",
    "checker-pink": "Pink checker",
    "checker-bw": "B&W checker",
    "gingham-pink": "Pink gingham",
    "gingham-blue": "Blue gingham",
    dots: "Polka dots",
    stripe: "Stripes",
    film: "Film",
    newspaper: "Newspaper",
    y2k: "Y2K chrome",
    night: "Starry night",
    pastel: "Pastel",
    doodle: "Doodle",
    hearts: "Love hearts",
    sakura: "Cherry blossom",
    xmas: "Christmas",
  },
  filters: {
    original: "Original",
    soft: "Bright",
    vivid: "Vivid",
    lovely: "Lovely",
    sunny: "Sunny",
    fresh: "Fresh",
    film: "Film",
    retro: "Retro",
    mood: "Moody",
    mono: "B&W",
    ink: "Deep B&W",
  },
};

export default catalog;
