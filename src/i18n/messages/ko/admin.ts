/** 관리자 모드(오른쪽 위 숨은 영역 5번) · 다운로드/인쇄 전 광고 창 */
const admin = {
  title: "관리자 모드",
  password: "비밀번호",
  passwordHint: (length: number) => `${length}자리 비밀번호를 입력하세요.`,
  confirm: "확인",
  checking: "확인 중…",
  wrong: "비밀번호가 맞지 않습니다.",
  notConfigured: "비밀번호가 설정되지 않았습니다. 배포 환경 변수 ADMIN_PASSWORD(8자리)를 넣고 다시 빌드하세요.",
  ads: "광고 표시",
  adsNote: "이 기기(브라우저)에만 적용됩니다. 끄면 다음에 페이지를 열 때부터 광고가 나오지 않습니다.",
  on: "켜짐",
  off: "꺼짐",
  logout: "로그아웃",
  close: "닫기",
  adBreak: {
    label: "광고",
    close: "닫기",
  },
};

export default admin;
