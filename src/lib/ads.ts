/**
 * 구글 애드센스 설정. 게시자 ID는 기본으로 넣어 두고, 환경 변수로 바꿀 수 있다 (빈 값이면 광고를 끈다).
 *   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000
 *   NEXT_PUBLIC_ADSENSE_SLOT_TOP / _MIDDLE / _BOTTOM = 애드센스에서 만든 디스플레이 광고 단위의 data-ad-slot 값
 *   NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL = 다운로드·인쇄 전에 보여 주는 광고 창의 data-ad-slot 값 (없으면 광고 창을 건너뛴다)
 * 광고를 실제로 보여 줄지는 관리자 모드에서 기기(브라우저)마다 켜고 끈다. 기본은 꺼짐.
 */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-6532893388671562";

export const AD_SLOTS = {
  top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ?? "",
  middle: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MIDDLE ?? "",
  bottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM ?? "",
} as const;

export const AD_SLOT_INTERSTITIAL = process.env.NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL ?? "";

export type AdPosition = keyof typeof AD_SLOTS;

/** ads.txt 한 줄. ca-pub-… 에서 pub-… 부분을 쓴다. */
export function adsTxt(client: string): string {
  const pub = client.replace(/^ca-/, "");
  return pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "";
}

// ---------- 광고 켜기/끄기 (관리자 모드, 기기별) ----------

/** localStorage 키. 값은 "on" | "off", 값이 없으면 꺼짐. */
export const ADS_KEY = "snowcut.ads";
/** 같은 탭 안에서 설정이 바뀐 것을 알리는 이벤트 (다른 탭은 storage 이벤트로 안다) */
const ADS_CHANGE_EVENT = "snowcut:ads-change";

/** 저장된 값을 켜짐/꺼짐으로. "on"일 때만 켜짐이다. */
export function parseAdsSetting(value: string | null | undefined): boolean {
  return value === "on";
}

/** 이 기기에서 광고를 켰는지 (기본 꺼짐) */
export function adsEnabled(): boolean {
  try {
    return parseAdsSetting(localStorage.getItem(ADS_KEY));
  } catch {
    return false;
  }
}

export function setAdsEnabled(on: boolean): void {
  try {
    localStorage.setItem(ADS_KEY, on ? "on" : "off");
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(ADS_CHANGE_EVENT, { detail: on }));
  } catch {}
}

export function subscribeAds(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === ADS_KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(ADS_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ADS_CHANGE_EVENT, onChange);
  };
}

/** 애드센스 스크립트를 한 번만 넣는다. 광고가 켜졌을 때만 부른다. */
export function loadAdsense(): void {
  if (!ADSENSE_CLIENT || typeof document === "undefined") return;
  if (document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}
