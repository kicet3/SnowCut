import type { Messages } from "../ko";

/** 여러 화면에서 같이 쓰는 문구 */
const common: Messages["common"] = {
  language: "Language",
  comingSoon: "This feature is coming soon.",
  soonBadge: "Soon",
  shoot: "Take photos",
  startShooting: "Start shooting",
  privacy: "Privacy Policy",
  backHome: "Home",
  adLabel: "Ad",
  adPlaceholder: (position: string) => `Ad slot (${position})`,
};

export default common;
