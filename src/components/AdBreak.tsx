"use client";

import { useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { AD_SLOT_INTERSTITIAL, loadAdsense } from "@/lib/ads";
import { AdSlot } from "./AdSlot";

/**
 * 다운로드·인쇄 전에 띄우는 광고 창. 광고를 켰고 광고 단위(NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL)가 있을 때만 쓴다.
 * 계속 버튼의 클릭 안에서 원래 동작을 실행해야 iOS에서 공유·인쇄가 막히지 않는다.
 * 애드센스 정책(정해진 시간 동안 광고를 보여 준 뒤에야 콘텐츠를 주는 방식 금지) 때문에 계속·닫기 버튼은 처음부터 눌린다.
 */
export function AdBreak({ action, onContinue, onClose }: { action: string; onContinue: () => void; onClose: () => void }) {
  const { m } = useI18n();
  const t = m.admin.adBreak;

  useEffect(() => {
    loadAdsense();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ad-break" role="dialog" aria-modal="true" aria-labelledby="ad-break-label">
      <div className="ad-break-card">
        <div className="ad-break-head">
          <span id="ad-break-label" className="ad-break-badge">
            {t.label}
          </span>
          <button type="button" className="btn-ghost small" onClick={onClose}>
            {t.close}
          </button>
        </div>
        <AdSlot slot={AD_SLOT_INTERSTITIAL} className="ad-break-slot" />
        <div className="ad-break-foot">
          <button type="button" className="cta" onClick={onContinue}>
            {action}
          </button>
        </div>
      </div>
    </div>
  );
}
