import type { Messages } from "../ko";

/** 관리자 모드 · 다운로드/인쇄 전 광고 창 */
const admin: Messages["admin"] = {
  title: "管理者モード",
  password: "パスワード",
  passwordHint: (length: number) => `${length}文字のパスワードを入力してください。`,
  confirm: "確認",
  checking: "確認中…",
  wrong: "パスワードが違います。",
  notConfigured: "パスワードが設定されていません。環境変数 ADMIN_PASSWORD(8文字)を設定して再ビルドしてください。",
  ads: "広告を表示",
  adsNote: "この端末(ブラウザ)だけに適用されます。オフにすると、次にページを開いたときから広告が出なくなります。",
  on: "オン",
  off: "オフ",
  logout: "ログアウト",
  close: "閉じる",
  adBreak: {
    label: "広告",
    close: "閉じる",
  },
};

export default admin;
