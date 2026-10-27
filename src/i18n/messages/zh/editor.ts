import type { Messages } from "../ko";

/** 커스텀 캐릭터 편집 창 (업로드 · 누끼 · 배치) */
const editor: Messages["editor"] = {
  title: "自定义角色",
  done: "完成",
  cutout: {
    hint: "请点击要保留的角色（主体）来标记点。标记越多，抠图越准确。",
    hintNoServer: "未配置抠图服务器，无法去除背景。如果是透明背景的 PNG，可以直接使用。",
    points: (n: number) => `已标记 ${n} 个点`,
    undoPoint: "撤销最后一个点",
    busy: "正在抠图…",
    run: "抠图",
    keepOriginal: "保留背景",
    cancel: "取消",
  },
  layout: "默认布局",
  characters: {
    label: "角色",
    hintPick: "点击选择，拖动移动",
    hintEmpty: "上传图片开始吧",
    item: (id: number) => `角色 ${id}`,
    upload: "上传图片",
  },
  size: "大小",
  rotation: "旋转",
  outline: "白色描边（贴纸）",
  flip: "左右翻转",
  bringFront: "置于顶层",
  remove: "删除",
  errors: {
    upload: "无法打开图片，请确认是否为 JPG 或 PNG 文件。",
    allTransparent: "图片完全是透明的。",
    unknown: "抠图失败，请重试。",
    notConfigured: "未配置抠图服务器。",
    noPoints: "请在角色上至少点击一次。",
    network: "无法连接抠图服务器，请确认服务器是否已开启。",
    tooLarge: "图片太大了，请换一张小一点的图片。",
    server: "抠图服务器出错了，请稍后再试。",
    status: (status: number) => `抠图失败（${status}）。`,
    notImage: "抠图服务器返回的不是图片。",
    prepare: "图片准备失败。",
    notRemoved: "背景去除失败。请在角色的其他位置再点几下后重试。",
    noSubject: "未找到主体，请重新在角色上点击。",
  },
};

export default editor;
