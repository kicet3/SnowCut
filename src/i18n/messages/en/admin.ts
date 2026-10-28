import type { Messages } from "../ko";

/** 관리자 모드 · 다운로드/인쇄 전 광고 창 */
const admin: Messages["admin"] = {
  title: "Admin mode",
  password: "Password",
  passwordHint: (length: number) => `Enter the ${length}-character password.`,
  confirm: "Confirm",
  checking: "Checking…",
  wrong: "Incorrect password.",
  notConfigured: "No password is set. Add the ADMIN_PASSWORD (8 characters) environment variable and rebuild.",
  ads: "Show ads",
  adsNote: "Applies to this device (browser) only. When turned off, ads stop from the next page load.",
  on: "On",
  off: "Off",
  logout: "Log out",
  close: "Close",
  adBreak: {
    label: "Ad",
    close: "Close",
  },
};

export default admin;
