import type { Messages } from "../ko";

/** 커스텀 캐릭터 편집 창 (업로드 · 누끼 · 배치) */
const editor: Messages["editor"] = {
  title: "カスタムキャラクター",
  done: "完了",
  cutout: {
    hint: "残したいキャラクター（被写体）の上をタップして点を打ってください。何か所もタップするほど正確になります。",
    hintNoServer: "切り抜きサーバーが設定されていないため、背景を消せません。背景が透明なPNGならそのまま使えます。",
    points: (n: number) => `打った点：${n}個`,
    undoPoint: "最後の点を消す",
    busy: "切り抜き中…",
    run: "切り抜く",
    keepOriginal: "背景ごと使う",
    cancel: "キャンセル",
  },
  layout: "基本レイアウト",
  characters: {
    label: "キャラクター",
    hintPick: "タップで選択、ドラッグで移動",
    hintEmpty: "画像をアップしてはじめよう",
    item: (id: number) => `キャラクター ${id}`,
    upload: "画像をアップ",
  },
  size: "サイズ",
  rotation: "回転",
  outline: "白フチ（ステッカー）",
  flip: "左右反転",
  bringFront: "最前面へ",
  remove: "削除",
  errors: {
    upload: "画像を開けませんでした。JPG・PNGファイルか確認してください。",
    allTransparent: "画像がすべて透明です。",
    unknown: "切り抜きできませんでした。もう一度お試しください。",
    notConfigured: "切り抜きサーバーが設定されていません。",
    noPoints: "キャラクターの上を1回以上タップしてください。",
    network: "切り抜きサーバーに接続できませんでした。サーバーが起動しているか確認してください。",
    tooLarge: "画像が大きすぎます。もっと小さい画像でお試しください。",
    server: "切り抜きサーバーでエラーが発生しました。しばらくしてからもう一度お試しください。",
    status: (status: number) => `切り抜きできませんでした (${status})。`,
    notImage: "切り抜きサーバーから画像以外の応答が返されました。",
    prepare: "画像を準備できませんでした。",
    notRemoved: "背景を消せませんでした。キャラクターの別の場所もタップして、もう一度お試しください。",
    noSubject: "被写体が見つかりませんでした。キャラクターの上をもう一度タップしてください。",
  },
};

export default editor;
