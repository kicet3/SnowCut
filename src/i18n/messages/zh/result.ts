import type { Messages } from "../ko";

/** 꾸미기 · 저장 · 인쇄 화면 문구 */
const result: Messages["result"] = {
  steps: { frame: "相框", filter: "滤镜", text: "选项", save: "保存" },
  photoAlt: "完成的四格照片",
  rendering: "正在生成照片…",
  renderFailed: "照片生成失败。更改设置后会重新尝试。",
  decorate: "装饰",
  stepsLabel: "步骤",
  layoutsLabel: "布局",
  frameCategoriesLabel: "相框类别",
  filterNote: "滤镜只作用于照片格。",
  options: {
    showDate: "显示日期",
    characters: "自定义角色",
    characterCount: (n: number) => `${n} 个`,
    noCharacters: "无",
    editCharacters: "调整角色位置 · 大小",
    addCharacters: "添加角色",
    retake: "重拍",
    retakeShot: (n: number) => `重拍第 ${n} 张`,
  },
  savePhoto: "保存照片",
  downloadPhoto: "下载为文件",
  print: {
    title: "打印（佳能 SELPHY CP1500）",
    countLabel: "打印份数",
    decrease: "减少份数",
    increase: "增加份数",
    count: (n: number) => `${n} 份`,
    pages: (n: number) => `（${n} 张纸）`,
    print: "打印",
    printFile: "打印用图片",
    // 인쇄 안내: "인쇄 창에서 프린터 <b>SELPHY CP1500</b>, 용지 <b>엽서(100×148mm)</b>, <b>테두리 없음</b>을 고르세요."
    guide: {
      beforePrinter: "请在打印窗口中将打印机设为 ",
      printer: "SELPHY CP1500",
      beforePaper: "，纸张设为",
      paper: "明信片（100×148mm）",
      beforeBorderless: "，并选择",
      borderless: "无边框",
      after: "。",
    },
    twoPerSheet: "一张纸会印出两条，请沿中间的标记裁开。",
  },
  video: {
    title: "拍摄视频",
    save: "保存视频",
    download: "下载视频",
  },
  // 저장 안내: "iPad에서는 사진 저장 → 공유 시트의 <b>이미지 저장</b>을 고르면 사진 앱에 들어가요. ..."
  iosNote: {
    before: "在 iPad 上，点击“保存照片”，再在分享面板中选择",
    action: "“存储图像”",
    after: "，即可存入“照片”App。长按照片也能保存。",
  },
  prev: "上一步",
  next: "下一步",
  newShoot: "再拍一组",
  /** 저장 · 다운로드 결과 (src/lib/saveImage.ts) */
  save: {
    shared: {
      image: "如果你在分享面板中选择了“存储图像”，照片已保存到“照片”App。",
      video: "如果你在分享面板中选择了“存储视频”，视频已保存到“照片”App。",
    },
    shareFailed: {
      image: "无法打开分享面板。请再点一次，或长按照片保存到“照片”App。",
      video: "无法打开分享面板。请再点一次，或点击“下载为文件”。",
    },
    longPress: "长按照片即可保存到“照片”App。",
    downloadedIOS: "已下载。可在“文件”App 的“下载”文件夹中查看。",
    downloadStarted: "已开始下载。",
  },
};

export default result;
