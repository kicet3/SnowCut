"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, AD_SLOTS, type AdPosition } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** 메인 페이지 전용 반응형 디스플레이 광고. 애드센스 값이 없으면 개발 중에만 자리 표시를 보여 준다. */
export function AdSlot({ position }: { position: AdPosition }) {
  const ref = useRef<HTMLModElement>(null);
  const slot = AD_SLOTS[position];

  useEffect(() => {
    const ins = ref.current;
    // 개발 모드에서 effect가 두 번 돌아도 같은 자리에 광고를 두 번 요청하지 않는다.
    if (!ADSENSE_CLIENT || !slot || !ins || ins.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [slot]);

  if (!ADSENSE_CLIENT || !slot) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div className="ad-slot placeholder" aria-hidden>
        광고 자리 ({position})
      </div>
    );
  }
  return (
    <aside className="ad-slot" aria-label="광고">
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
