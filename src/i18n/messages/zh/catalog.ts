import type { Messages } from "../ko";

/** 레이아웃 · 프레임 · 필터 이름. 키는 src/lib/frame.ts · frames.ts · look/presets.ts의 id와 같다 (catalog.test.ts가 확인). */
const catalog: Messages["catalog"] = {
  layouts: {
    strip: { title: "竖版四格", paper: "2×6英寸" },
    grid: { title: "2×2 网格", paper: "4×6英寸" },
    strip3: { title: "竖版三格", paper: "2×6英寸" },
    grid6: { title: "2×3 六格", paper: "4×6英寸" },
    wide: { title: "横版四格", paper: "6×2英寸" },
    hero: { title: "大图 1 格 + 3 格", paper: "4×6英寸" },
  },
  frameCategories: { basic: "基础", pattern: "图案", mood: "氛围", season: "季节" },
  frames: {
    white: "白色",
    black: "黑色",
    pink: "粉色",
    sky: "天蓝",
    mint: "薄荷绿",
    lavender: "薰衣草紫",
    "checker-pink": "粉色棋盘格",
    "checker-bw": "黑白棋盘格",
    "gingham-pink": "粉色格纹",
    "gingham-blue": "蓝色格纹",
    dots: "波点",
    stripe: "条纹",
    film: "胶片",
    newspaper: "报纸",
    y2k: "Y2K 铬金属",
    night: "星夜",
    pastel: "马卡龙",
    doodle: "涂鸦",
    hearts: "爱心",
    sakura: "樱花",
    xmas: "圣诞",
  },
  filters: {
    original: "原图",
    soft: "亮白",
    vivid: "鲜艳",
    lovely: "甜美",
    sunny: "阳光",
    fresh: "清新",
    film: "胶片",
    retro: "复古",
    mood: "氛围",
    mono: "黑白",
    ink: "浓黑白",
  },
};

export default catalog;
