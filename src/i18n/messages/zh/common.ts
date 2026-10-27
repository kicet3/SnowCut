import type { Messages } from "../ko";

/** 여러 화면에서 같이 쓰는 문구 */
const common: Messages["common"] = {
  language: "语言",
  comingSoon: "该功能即将上线。",
  soonBadge: "即将上线",
  shoot: "去拍摄",
  startShooting: "开始拍摄",
  privacy: "隐私政策",
  backHome: "返回首页",
  adLabel: "广告",
  adPlaceholder: (position: string) => `广告位（${position}）`,
};

export default common;
