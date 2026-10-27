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
    caption: "文字",
    captionPlaceholder: "写真の下に入れる文字（空欄なら入れません）",
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
    title: "はがきサイズ用紙に印刷",
    countLabel: "印刷部数",
    decrease: "部数を減らす",
    increase: "部数を増やす",
    count: (n: number) => `${n}部`,
    pages: (n: number) => `（用紙${n}枚）`,
    print: "印刷",
    printFile: "印刷用画像",
    // 인쇄 안내: "印刷画面で用紙は<b>はがき（100×148mm）</b>、<b>フチなし</b>を選んでください。"
    guide: {
      beforePaper: "印刷画面で用紙は",
      paper: "はがき（100×148mm）",
      beforeBorderless: "、",
      borderless: "フチなし",
      after: "を選んでください。",
    },
    printerNote: "制作者はCanon SELPHY CP1500で印刷しています。一般的なプリンターでは「余白あり」を選び、はがきサイズの光沢紙に印刷してください。",
    /** 인쇄 방식 고르기 */
    mode: { label: "印刷方法", borderless: "Canon SELPHY CP1500", margin: "余白あり（一般のプリンター）" },
    /** 여백 포함 인쇄 안내 */
    marginGuide: "印刷画面で用紙ははがき（100×148mm）、余白はなし、倍率は100%（既定）を選んでください。写真の周りに白い余白を残すので、一般的なプリンターでも端が切れません。",
    /** 테두리 없는 인쇄(SELPHY CP1500) Windows 설정 안내 */
    windowsTip: "Windowsでは、プリンターにCanon SELPHY CP1500を選び、「詳細設定」で余白を「なし」、倍率を「既定」にしてください。写真はプリンターが切り落とす端より内側に配置されています。",
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
