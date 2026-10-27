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
  /** 카메라는 열렸지만 화면이 오지 않을 때 (USB 카메라 등) */
  stalled: {
    title: "カメラの映像が届きません",
    body: "カメラは接続されていますが、映像が届いていません。カメラのWebカメラ（UVC）モードをオンにしてケーブルを挿し直すか、上で別のカメラを選んでください。",
    retry: "再接続",
  },
  fileMode: {
    title: "リアルタイムカメラを使えません",
    body: "ボタンを押すとiPadのカメラが開きます。1枚ずつ撮影してください。",
    fine: "HTTPSのURLでカメラへのアクセスを許可すると、リアルタイムで撮影できます。",
    /** 카메라 권한이 거부됐을 때 */
    denied: "カメラへのアクセスがオフになっています。アドレスバー左のサイト設定と、端末の設定（例：iPadの設定 → Chrome → カメラ）でカメラを許可してから再読み込みしてください。",
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
