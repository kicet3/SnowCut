import type { Messages } from "../ko";

/** 개인정보처리방침 */
const privacy: Messages["privacy"] = {
  title: "隐私政策",
  photosTitle: "照片和视频",
  photos:
    "拍摄的照片和视频只在你所用设备的浏览器内处理，不会发送到服务器或在服务器上保存。关闭页面后，未保存的照片将会消失。你选择的摄像头和语言仅记录在浏览器中（localStorage · Cookie），方便下次访问时无需重新选择。",
  characterTitle: "自定义角色图片",
  character:
    "在自定义角色中点击“抠图”时，只会把上传的角色图片和你点选的位置发送到背景移除服务器，并取回去除背景后的图片。拍摄的照片和视频不会被发送；取回的角色图片只在浏览器内使用，关闭页面后即消失。",
  adsTitle: "广告和 Cookie",
  ads: "首页会展示 Google AdSense 广告。Google 等第三方供应商可能会使用 Cookie，根据你访问本站或其他网站的记录投放广告。拍摄页面不展示广告。",
  /** [앞, 링크1, 가운데, 링크2, 뒤] */
  adsLinks: ["你可以在 ", "Google 广告设置", " 中关闭个性化广告，并可在 ", "Google 广告政策", " 中了解 Google 如何使用数据。"],
};

export default privacy;
