import type { Messages } from "../ko";

/** 커스텀 캐릭터 편집 창 (업로드 · 누끼 · 배치) */
const editor: Messages["editor"] = {
  title: "Custom characters",
  done: "Done",
  cutout: {
    hint: "Tap the character (subject) you want to keep to mark points. The more spots you tap, the more accurate the cutout.",
    hintNoServer: "No background-removal server is set up, so the background can't be removed. PNGs with a transparent background work as is.",
    points: (n: number) => `${n} ${n === 1 ? "point" : "points"} marked`,
    undoPoint: "Undo last point",
    busy: "Removing background…",
    run: "Remove background",
    keepOriginal: "Keep background",
    cancel: "Cancel",
  },
  layout: "Default layout",
  characters: {
    label: "Characters",
    hintPick: "Tap to select, drag to move",
    hintEmpty: "Upload an image to start",
    item: (id: number) => `Character ${id}`,
    upload: "Upload image",
  },
  size: "Size",
  rotation: "Rotation",
  outline: "White outline (sticker)",
  flip: "Flip horizontally",
  bringFront: "Bring to front",
  remove: "Delete",
  errors: {
    upload: "Couldn't open the image. Please check that it's a JPG or PNG file.",
    allTransparent: "The image is completely transparent.",
    unknown: "Couldn't remove the background. Please try again.",
    notConfigured: "No background-removal server is set up.",
    noPoints: "Tap the character at least once.",
    network: "Couldn't connect to the background-removal server. Check that it's running.",
    tooLarge: "The image is too large. Please use a smaller one.",
    server: "The background-removal server hit an error. Please try again shortly.",
    status: (status: number) => `Couldn't remove the background (${status}).`,
    notImage: "The background-removal server didn't return an image.",
    prepare: "Couldn't prepare the image.",
    notRemoved: "Couldn't remove the background. Tap other spots on the character and try again.",
    noSubject: "Couldn't find the subject. Tap the character again.",
  },
};

export default editor;
