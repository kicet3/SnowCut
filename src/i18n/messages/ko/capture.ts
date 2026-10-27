/** 촬영 화면 (카메라 미리보기 · 카운트다운 · 썸네일) */
const capture = {
  back: "← 처음으로",
  backToResult: "← 결과로 돌아가기",
  done: "촬영 완료",
  progress: (current: number, total: number) => `${current} / ${total}`,
  cameraSelect: "카메라",
  recording: "녹화 중",
  preparing: "카메라 준비 중…",
  fileMode: {
    title: "실시간 카메라를 쓸 수 없어요",
    body: "버튼을 누르면 iPad 카메라가 열립니다. 한 장씩 찍어 주세요.",
    fine: "HTTPS 주소에서 카메라 권한을 허용하면 실시간 촬영이 됩니다.",
  },
  slot: (n: number) => `${n}번 칸`,
  shoot: {
    stop: "중지",
    file: (n: number) => `${n}번째 사진 찍기`,
    start: "촬영 시작",
    remaining: (n: number) => `남은 ${n}장 촬영`,
  },
  errors: {
    shotFailed: "촬영하지 못했어요.",
    fileFailed: "사진을 불러오지 못했어요. 다시 찍어 주세요.",
  },
  /** useCamera에 넘기는 문구 */
  camera: {
    name: (n: number) => `카메라 ${n}`,
    frozen: "카메라 화면이 멈춰 있어요. 잠시 후 다시 눌러 주세요.",
  },
};

export default capture;
