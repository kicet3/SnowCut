import type { Messages } from "../ko";

/** 여러 화면에서 같이 쓰는 문구 */
const common: Messages["common"] = {
  language: "言語",
  comingSoon: "準備中の機能です。",
  soonBadge: "準備中",
  shoot: "撮影する",
  startShooting: "撮影をはじめる",
  privacy: "プライバシーポリシー",
  backHome: "トップへ",
  adLabel: "広告",
  adPlaceholder: (position: string) => `広告枠 (${position})`,
};

export default common;
