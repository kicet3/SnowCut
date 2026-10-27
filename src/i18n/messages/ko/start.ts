/** 시작 화면(레이아웃 · 타이머 고르기) 문구 */
const start = {
  tagline: "레이아웃을 고르고 포즈를 준비하세요",
  character: {
    title: "커스텀 캐릭터",
    count: (n: number, layout: string) => `캐릭터 ${n}개 · ${layout}`,
    hint: "이미지를 올려 누끼 따기",
  },
  timer: "타이머",
  seconds: (n: number) => `${n}초`,
  start: "촬영 시작",
};

export default start;
