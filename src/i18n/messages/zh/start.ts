import type { Messages } from "../ko";

/** 시작 화면(레이아웃 · 타이머 고르기) 문구 */
const start: Messages["start"] = {
  tagline: "选好布局，准备摆姿势吧",
  character: {
    title: "自定义角色",
    count: (n: number, layout: string) => `${n} 个角色 · ${layout}`,
    hint: "上传图片并抠图",
  },
  timer: "定时器",
  seconds: (n: number) => `${n} 秒`,
  start: "开始拍摄",
};

export default start;
