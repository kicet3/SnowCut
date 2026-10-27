/**
 * 구글 애드센스 설정. 빌드할 때 환경 변수로 넣는다 (값이 없으면 광고를 그리지 않는다).
 *   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000
 *   NEXT_PUBLIC_ADSENSE_SLOT_TOP / _MIDDLE / _BOTTOM = 애드센스에서 만든 디스플레이 광고 단위의 data-ad-slot 값
 */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

export const AD_SLOTS = {
  top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ?? "",
  middle: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MIDDLE ?? "",
  bottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM ?? "",
} as const;

export type AdPosition = keyof typeof AD_SLOTS;

/** ads.txt 한 줄. ca-pub-… 에서 pub-… 부분을 쓴다. */
export function adsTxt(client: string): string {
  const pub = client.replace(/^ca-/, "");
  return pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "";
}
