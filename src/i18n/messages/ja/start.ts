import type { Messages } from "../ko";

/** 시작 화면(레이아웃 · 타이머 고르기) 문구 */
const start: Messages["start"] = {
  tagline: "レイアウトを選んで、ポーズの準備をしよう",
  character: {
    title: "カスタムキャラクター",
    count: (n: number, layout: string) => `キャラクター${n}個 · ${layout}`,
    hint: "画像をアップして切り抜き",
  },
  timer: "タイマー",
  seconds: (n: number) => `${n}秒`,
  start: "撮影スタート",
};

export default start;
