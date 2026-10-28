"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { ADSENSE_CLIENT, AD_SLOTS, loadAdsense, type AdPosition } from "@/lib/ads";
import { useAdsActive } from "@/lib/useAds";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * 반응형 디스플레이 광고. 관리자 모드에서 광고를 켰을 때만 그린다 (꺼져 있으면 아무것도 보이지 않는다).
 * position(메인 페이지 자리) 대신 slot으로 광고 단위를 직접 줄 수 있다. 광고 단위가 없으면 개발 중에만 자리 표시를 보여 준다.
 */
export function AdSlot({ position, slot: slotProp, className }: { position?: AdPosition; slot?: string; className?: string }) {
  const ref = useRef<HTMLModElement>(null);
  const slot = slotProp ?? (position ? AD_SLOTS[position] : "");
  const active = useAdsActive();
  const { m } = useI18n();

  useEffect(() => {
    const ins = ref.current;
    // 개발 모드에서 effect가 두 번 돌아도 같은 자리에 광고를 두 번 요청하지 않는다.
    if (!active || !slot || !ins || ins.dataset.adsbygoogleStatus || ins.dataset.pushed) return;
    loadAdsense();
    ins.dataset.pushed = "1";
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [active, slot]);

  if (!active) return null;
  if (!slot) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div className={`ad-slot placeholder${className ? " " + className : ""}`} aria-hidden>
        {m.common.adPlaceholder(position ?? "slot")}
      </div>
    );
  }
  return (
    <aside className={`ad-slot${className ? " " + className : ""}`} aria-label={m.common.adLabel}>
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

/** 광고가 켜져 있으면 애드센스 스크립트를 넣는다 (자동 광고용). 메인 페이지에서 쓴다. */
export function AdsenseLoader() {
  const active = useAdsActive();
  useEffect(() => {
    if (active) loadAdsense();
  }, [active]);
  return null;
}
