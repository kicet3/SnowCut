import type { Messages } from "../ko";

/** 개인정보처리방침 */
const privacy: Messages["privacy"] = {
  title: "Privacy Policy",
  photosTitle: "Photos and videos",
  photos:
    "Photos and videos you take are processed only inside your device's browser. They are never sent to or stored on a server, and unsaved photos are gone when you close the page. Your selected camera and language are remembered only in your browser (localStorage and cookies) so you don't have to choose them again next time.",
  characterTitle: "Custom character images",
  character:
    "When you tap 'Remove background' in Custom characters, only the character image you uploaded and the points you tapped are sent to a background-removal server, which returns the image with the background removed. Your photos and videos are never sent, and the returned character image is used only in your browser and disappears when you close the page.",
  adsTitle: "Ads and cookies",
  ads: "The main page shows Google AdSense ads. Third-party vendors, including Google, may use cookies to serve ads based on your visits to this and other websites. No ads are shown on the shooting screens.",
  /** [앞, 링크1, 가운데, 링크2, 뒤] */
  adsLinks: [
    "You can turn off personalized ads in ",
    "Google Ad Settings",
    ", and learn how Google uses data in ",
    "Google's advertising policies",
    ".",
  ],
};

export default privacy;
