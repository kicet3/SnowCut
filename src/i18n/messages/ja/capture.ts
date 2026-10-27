import type { Messages } from "../ko";

/** 촬영 화면 (카메라 미리보기 · 카운트다운 · 썸네일) */
const capture: Messages["capture"] = {
  back: "← 最初に戻る",
  backToResult: "← 結果に戻る",
  done: "撮影完了",
  progress: (current: number, total: number) => `${current} / ${total}`,
  cameraSelect: "カメラ",
  recording: "録画中",
  preparing: "カメラを準備中…",
  fileMode: {
    title: "リアルタイムカメラを使えません",
    body: "ボタンを押すとiPadのカメラが開きます。1枚ずつ撮影してください。",
    fine: "HTTPSのURLでカメラへのアクセスを許可すると、リアルタイムで撮影できます。",
  },
  slot: (n: number) => `${n}枚目`,
  shoot: {
    stop: "停止",
    file: (n: number) => `${n}枚目を撮る`,
    start: "撮影スタート",
    remaining: (n: number) => `残り${n}枚を撮影`,
  },
  errors: {
    shotFailed: "撮影できませんでした。",
    fileFailed: "写真を読み込めませんでした。もう一度撮影してください。",
  },
  /** useCamera에 넘기는 문구 */
  camera: {
    name: (n: number) => `カメラ ${n}`,
    frozen: "カメラの映像が止まっています。少し待ってからもう一度押してください。",
  },
};

export default capture;
