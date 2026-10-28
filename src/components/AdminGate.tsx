"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import {
  ADMIN_PASSWORD_HASH,
  ADMIN_PASSWORD_LENGTH,
  adminSessionActive,
  createTapCounter,
  inAdminCorner,
  isInteractiveTarget,
  isValidPasswordLength,
  setAdminSession,
  verifyAdminPassword,
} from "@/lib/admin";
import { setAdsEnabled } from "@/lib/ads";
import { useAdsEnabled } from "@/lib/useAds";

/**
 * 관리자 모드. 화면 오른쪽 위 구석의 빈 곳을 3초 안에 5번 누르면 열린다.
 * 버튼 요소를 두지 않고 window에서 누른 좌표만 세므로, 그 자리에 있는 다른 버튼(언어 선택 등)의 클릭을 막지 않는다.
 * 상단 바(.home-bar, .brand-bar)는 오른쪽 끝 여백을 넓게 두어 구석에 버튼 없는 자리가 남게 했다.
 */
export function AdminGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const counter = createTapCounter();
    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      // 구석이라도 링크·버튼·언어 선택 위를 누른 것은 세지 않는다 (그 요소가 원래 동작을 하므로 처음부터 다시 센다).
      const inCorner = inAdminCorner(e.clientX, e.clientY, window.innerWidth) && !isInteractiveTarget(e.target);
      if (counter.tap(performance.now(), inCorner)) setOpen(true);
    };
    window.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    return () => window.removeEventListener("pointerdown", onDown, { capture: true });
  }, []);

  return open ? <AdminDialog onClose={() => setOpen(false)} /> : null;
}

function AdminDialog({ onClose }: { onClose: () => void }) {
  const { m } = useI18n();
  const t = m.admin;
  const configured = !!ADMIN_PASSWORD_HASH;
  const [authed, setAuthed] = useState(() => adminSessionActive());
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const ads = useAdsEnabled();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!authed && configured) inputRef.current?.focus();
  }, [authed, configured]);

  const valid = isValidPasswordLength(password);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || checking) return;
    setChecking(true);
    setError("");
    let ok = false;
    try {
      ok = await verifyAdminPassword(password);
    } catch {}
    setChecking(false);
    setPassword("");
    if (ok) {
      setAdminSession(true);
      setAuthed(true);
    } else {
      setError(t.wrong);
      inputRef.current?.focus();
    }
  };

  const logout = () => {
    setAdminSession(false);
    setAuthed(false);
  };

  return (
    <div
      className="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-title"
      // 카드 바깥(어두운 배경)을 누르면 닫는다.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-card">
        <h2 id="admin-title">{t.title}</h2>
        {!configured ? (
          <p className="admin-error" role="alert">
            {t.notConfigured}
          </p>
        ) : !authed ? (
          <form className="admin-form" onSubmit={onSubmit}>
            <label htmlFor="admin-password">{t.password}</label>
            <input
              ref={inputRef}
              id="admin-password"
              type="password"
              autoComplete="off"
              maxLength={ADMIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              aria-invalid={!!error}
              aria-describedby="admin-password-hint"
            />
            <p id="admin-password-hint" className={error ? "admin-error" : "admin-note"} role={error ? "alert" : undefined}>
              {error || t.passwordHint(ADMIN_PASSWORD_LENGTH)}
            </p>
            <button type="submit" className="cta" disabled={!valid || checking}>
              {checking ? t.checking : t.confirm}
            </button>
          </form>
        ) : (
          <div className="admin-panel">
            <label className="admin-toggle">
              <span>{t.ads}</span>
              <b>{ads ? t.on : t.off}</b>
              <input type="checkbox" role="switch" checked={ads} onChange={(e) => setAdsEnabled(e.target.checked)} />
            </label>
            <p className="admin-note">{t.adsNote}</p>
            <button type="button" className="btn-ghost small" onClick={logout}>
              {t.logout}
            </button>
          </div>
        )}
        <button type="button" className="btn-outline" onClick={onClose}>
          {t.close}
        </button>
      </div>
    </div>
  );
}
