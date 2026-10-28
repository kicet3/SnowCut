import type { Messages } from "../ko";

/** 관리자 모드 · 다운로드/인쇄 전 광고 창 */
const admin: Messages["admin"] = {
  title: "管理员模式",
  password: "密码",
  passwordHint: (length: number) => `请输入${length}位密码。`,
  confirm: "确认",
  checking: "正在确认…",
  wrong: "密码不正确。",
  notConfigured: "尚未设置密码。请添加环境变量 ADMIN_PASSWORD（8位）后重新构建。",
  ads: "显示广告",
  adsNote: "仅对此设备（浏览器）生效。关闭后，从下次打开页面起不再显示广告。",
  on: "开",
  off: "关",
  logout: "退出登录",
  close: "关闭",
  adBreak: {
    label: "广告",
    close: "关闭",
  },
};

export default admin;
