import type { Messages } from "../ko";

/** 꾸미기 · 저장 · 인쇄 화면 문구 */
const result: Messages["result"] = {
  steps: { frame: "Frame", filter: "Filter", text: "Options", save: "Save" },
  photoAlt: "Finished photo strip",
  rendering: "Making your photo strip…",
  renderFailed: "Couldn't make your photo strip. Change a setting to try again.",
  decorate: "Decorate",
  stepsLabel: "Steps",
  layoutsLabel: "Layouts",
  frameCategoriesLabel: "Frame categories",
  filterNote: "Filters apply only to the photos, not the frame.",
  options: {
    caption: "Caption",
    captionPlaceholder: "Text under the photos (leave empty for none)",
    showDate: "Show date",
    characters: "Custom characters",
    characterCount: (n: number) => `${n}`,
    noCharacters: "None",
    editCharacters: "Move or resize characters",
    addCharacters: "Add characters",
    retake: "Retake",
    retakeShot: (n: number) => `Retake shot ${n}`,
  },
  savePhoto: "Save photo",
  downloadPhoto: "Download file",
  print: {
    title: "Print on postcard paper",
    countLabel: "Print quantity",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    count: (n: number) => `${n} ${n === 1 ? "copy" : "copies"}`,
    pages: (n: number) => `(${n} ${n === 1 ? "sheet" : "sheets"})`,
    print: "Print",
    printFile: "Print-ready image",
    // 인쇄 안내: "In the print dialog, choose <b>Postcard (100×148 mm)</b> as the paper size and <b>Borderless</b>."
    guide: {
      beforePaper: "In the print dialog, choose ",
      paper: "Postcard (100×148 mm)",
      beforeBorderless: " as the paper size and ",
      borderless: "Borderless",
      after: ".",
    },
    printerNote: "The creator prints with a Canon SELPHY CP1500. With a regular printer, choose “With margins” and use glossy postcard-size photo paper.",
    /** 인쇄 방식 고르기 */
    mode: { label: "Print style", borderless: "Canon SELPHY CP1500", margin: "With margins (regular printer)" },
    /** 여백 포함 인쇄 안내 */
    marginGuide: "In the print dialog, choose Postcard (100×148 mm) paper, Margins: None, and Scale: 100% (default). A white border around the photo keeps regular printers from cutting off the edges.",
    /** 테두리 없는 인쇄(SELPHY CP1500) Windows 설정 안내 */
    windowsTip: "On Windows, choose Canon SELPHY CP1500 as the printer and, under More settings, set Margins to None and Scale to Default. The photo sits inside the edge the printer trims off.",
    twoPerSheet: " Each sheet holds two strips, so cut along the center mark.",
  },
  video: {
    title: "Session video",
    save: "Save video",
    download: "Download video",
  },
  // 저장 안내: "On iPad, tap Save photo → choose <b>Save Image</b> in the share sheet ..."
  iosNote: {
    before: "On iPad, tap Save photo → choose ",
    action: "Save Image",
    after: " in the share sheet to add it to Photos. You can also long-press the photo to save it.",
  },
  prev: "Back",
  next: "Next",
  newShoot: "Shoot again",
  /** 저장 · 다운로드 결과 (src/lib/saveImage.ts) */
  save: {
    shared: {
      image: "If you chose Save Image in the share sheet, it's in your Photos.",
      video: "If you chose Save Video in the share sheet, it's in your Photos.",
    },
    shareFailed: {
      image: "Couldn't open the share sheet. Tap again, or long-press the photo to save it to Photos.",
      video: "Couldn't open the share sheet. Tap again, or use Download video.",
    },
    longPress: "Long-press the photo to save it to Photos.",
    downloadedIOS: "Downloaded. You'll find it in the Downloads folder of the Files app.",
    downloadStarted: "Download started.",
  },
};

export default result;
