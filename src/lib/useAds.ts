"use client";

import { useSyncExternalStore } from "react";
import { ADSENSE_CLIENT, adsEnabled, subscribeAds } from "./ads";

// React 훅은 클라이언트 전용이라 ads.ts(서버의 메타데이터·ads.txt에서도 씀)와 나눠 둔다.

/** 광고 켜짐 여부 (설정만). 서버 렌더와 첫 화면은 꺼짐으로 그리고, 브라우저에서 저장값을 읽어 바꾼다. */
export function useAdsEnabled(): boolean {
  return useSyncExternalStore(subscribeAds, adsEnabled, () => false);
}

/** 실제로 광고를 보여 줄 수 있는지: 설정이 켜져 있고 게시자 ID가 있을 때 */
export function useAdsActive(): boolean {
  return useAdsEnabled() && !!ADSENSE_CLIENT;
}
