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
  /** 카메라는 열렸지만 화면이 오지 않을 때 (USB 카메라 등) */
  stalled: {
    title: "No picture from the camera",
    body: "The camera is connected but isn't sending a picture. Turn on the camera's webcam (UVC) mode and reconnect the cable, or pick another camera above.",
    retry: "Reconnect",
  },
  fileMode: {
    title: "Live camera isn't available",
    body: "Tap the button to open the iPad camera. Take one photo at a time.",
    fine: "To shoot live, open the site over HTTPS and allow camera access.",
    /** 카메라 권한이 거부됐을 때 */
    denied: "Camera access is turned off. Allow the camera in the site settings (left of the address bar) and in your device settings (for example, iPad Settings → Chrome → Camera), then reload.",
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
