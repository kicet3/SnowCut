import type { Messages } from "../ko";

/** 꾸미기 · 저장 · 인쇄 화면 문구 */
const result: Messages["result"] = {
  steps: { frame: "フレーム", filter: "フィルター", text: "オプション", save: "保存" },
  photoAlt: "完成した4カット写真",
  rendering: "写真を作成中…",
  renderFailed: "写真を作成できませんでした。設定を変更すると、もう一度作成します。",
  decorate: "デコる",
  stepsLabel: "ステップ",
  layoutsLabel: "レイアウト",
  frameCategoriesLabel: "フレームの種類",
  filterNote: "フィルターは写真部分だけに適用されます。",
  options: {
    showDate: "日付を表示",
    characters: "カスタムキャラクター",
    characterCount: (n: number) => `${n}個`,
    noCharacters: "なし",
    editCharacters: "キャラクターの位置・サイズを変更",
    addCharacters: "キャラクターを追加",
    retake: "撮り直し",
    retakeShot: (n: number) => `${n}枚目を撮り直す`,
  },
  savePhoto: "写真を保存",
  downloadPhoto: "ファイルでダウンロード",
  print: {
    title: "プリンターで印刷（Canon SELPHY CP1500）",
    countLabel: "印刷部数",
    decrease: "部数を減らす",
    increase: "部数を増やす",
    count: (n: number) => `${n}部`,
    pages: (n: number) => `（用紙${n}枚）`,
    print: "印刷",
    printFile: "印刷用画像",
    // "印刷画面でプリンター <b>SELPHY CP1500</b>、用紙 <b>はがき(100×148mm)</b>、<b>フチなし</b>を選んでください。"
    guide: {
      beforePrinter: "印刷画面でプリンターは",
      printer: "SELPHY CP1500",
      beforePaper: "、用紙は",
      paper: "はがき（100×148mm）",
      beforeBorderless: "、",
      borderless: "フチなし",
      after: "を選んでください。",
    },
    twoPerSheet: "1枚に2つずつ印刷されるので、中央の目印に沿って切ってください。",
  },
  video: {
    title: "撮影動画",
    save: "動画を保存",
    download: "動画をダウンロード",
  },
  // "iPadでは写真を保存 → 共有シートの <b>画像を保存</b> を選ぶと写真アプリに入ります。..."
  iosNote: {
    before: "iPadでは「写真を保存」→ 共有シートの",
    action: "画像を保存",
    after: "を選ぶと写真アプリに保存されます。写真を長押ししても保存できます。",
  },
  prev: "前へ",
  next: "次へ",
  newShoot: "新しく撮る",
  /** 저장 · 다운로드 결과 (src/lib/saveImage.ts) */
  save: {
    shared: {
      image: "共有シートで「画像を保存」を選んだ場合は、写真アプリに保存されました。",
      video: "共有シートで「ビデオを保存」を選んだ場合は、写真アプリに保存されました。",
    },
    shareFailed: {
      image: "共有シートを開けませんでした。もう一度押すか、写真を長押しして写真アプリに保存できます。",
      video: "共有シートを開けませんでした。もう一度押すか、「ファイルでダウンロード」を押してください。",
    },
    longPress: "写真を長押しすると写真アプリに保存できます。",
    downloadedIOS: "ダウンロードしました。ファイルアプリのダウンロードフォルダで確認できます。",
    downloadStarted: "ダウンロードを開始しました。",
  },
};

export default result;
