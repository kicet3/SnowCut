import type { Messages } from "../ko";

/** 촬영 화면 (카메라 미리보기 · 카운트다운 · 썸네일) */
const capture: Messages["capture"] = {
  back: "← 返回开始页",
  backToResult: "← 返回结果",
  done: "拍摄完成",
  progress: (current: number, total: number) => `${current} / ${total}`,
  cameraSelect: "摄像头",
  recording: "录制中",
  preparing: "正在准备摄像头…",
  fileMode: {
    title: "无法使用实时摄像头",
    body: "点击按钮会打开 iPad 相机，请逐张拍摄。",
    fine: "在 HTTPS 地址下允许摄像头权限，即可实时拍摄。",
  },
  slot: (n: number) => `第 ${n} 格`,
  shoot: {
    stop: "停止",
    file: (n: number) => `拍摄第 ${n} 张`,
    start: "开始拍摄",
    remaining: (n: number) => `拍摄剩余 ${n} 张`,
  },
  errors: {
    shotFailed: "拍摄失败。",
    fileFailed: "无法载入照片，请重新拍摄。",
  },
  /** useCamera에 넘기는 문구 */
  camera: {
    name: (n: number) => `摄像头 ${n}`,
    frozen: "摄像头画面卡住了，请稍后再点一次。",
  },
};

export default capture;
