import type { Messages } from "../ko";

/** 촬영 화면 (카메라 미리보기 · 카운트다운 · 썸네일) */
const capture: Messages["capture"] = {
  back: "← Back to start",
  backToResult: "← Back to result",
  done: "Done",
  progress: (current: number, total: number) => `${current} / ${total}`,
  cameraSelect: "Camera",
  recording: "Recording",
  preparing: "Getting camera ready…",
  fileMode: {
    title: "Live camera isn't available",
    body: "Tap the button to open the iPad camera. Take one photo at a time.",
    fine: "To shoot live, open the site over HTTPS and allow camera access.",
  },
  slot: (n: number) => `Shot ${n}`,
  shoot: {
    stop: "Stop",
    file: (n: number) => `Take shot ${n}`,
    start: "Start shooting",
    remaining: (n: number) => (n === 1 ? "Take the last shot" : `Take ${n} more shots`),
  },
  errors: {
    shotFailed: "Couldn't take the photo.",
    fileFailed: "Couldn't load the photo. Please take it again.",
  },
  /** useCamera에 넘기는 문구 */
  camera: {
    name: (n: number) => `Camera ${n}`,
    frozen: "The camera feed is frozen. Please wait a moment and tap again.",
  },
};

export default capture;
