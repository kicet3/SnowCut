import type { Messages } from "../ko";

/** 시작 화면(레이아웃 · 타이머 고르기) 문구 */
const start: Messages["start"] = {
  tagline: "Pick a layout and get ready to pose",
  character: {
    title: "Custom characters",
    count: (n: number, layout: string) => `${n} ${n === 1 ? "character" : "characters"} · ${layout}`,
    hint: "Upload an image and remove the background",
  },
  timer: "Timer",
  seconds: (n: number) => `${n}s`,
  start: "Start shooting",
};

export default start;
