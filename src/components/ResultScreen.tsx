"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { canvasToJpeg, drawComposite, drawCover, type Shot } from "@/lib/canvas";
import type { Character } from "@/lib/character";
import { CAPTION_MAX, LAYOUTS, compatibleLayouts, fileNameFor, photoAspect, type LayoutKey } from "@/lib/frame";
import { FRAMES, FRAME_CATEGORIES, frameDesign, type FrameCategory, type FrameId } from "@/lib/frames";
import { useI18n } from "@/i18n/I18nProvider";
import { filterShot } from "@/lib/look/apply";
import { FILTERS, type FilterId } from "@/lib/look/presets";
import { PRINT_BLEED_MM, drawPrintSheet, marginFit, pagesFor, printCounts, sheetPlan, type PrintMode } from "@/lib/print";
import { videoExtension } from "@/lib/recorder";
import { downloadBlob, downloadImage, saveImage, type SaveOutcome } from "@/lib/saveImage";
import { CHARACTER_ENABLED } from "@/lib/site";
import { AD_SLOT_INTERSTITIAL } from "@/lib/ads";
import { useAdsActive } from "@/lib/useAds";
import { AdBreak } from "./AdBreak";
import { ShotThumb } from "./ShotThumb";

interface Props {
  layout: LayoutKey;
  frame: FrameId;
  showDate: boolean;
  /** 사진 아래 문구 */
  caption: string;
  shots: (Shot | null)[];
  /** 촬영본이 바뀔 때마다 증가하는 값 */
  revision: number;
  capturedAt: Date;
  filter: FilterId;
  /** 촬영하는 동안 녹화한 영상 (녹화를 못 했으면 null) */
  video: Blob | null;
  /** 프레임 위에 얹는 커스텀 캐릭터 */
  characters: Character[];
  onCharacters: () => void;
  onLayout: (layout: LayoutKey) => void;
  onFrame: (frame: FrameId) => void;
  onFilter: (filter: FilterId) => void;
  onShowDate: (show: boolean) => void;
  onCaption: (caption: string) => void;
  onRetake: (index: number) => void;
  onNew: () => void;
  /** 꾸미기 단계. 다시 찍고 돌아와도 이어지도록 Booth가 들고 있다. */
  step: ResultStep;
  onStep: (step: ResultStep) => void;
}

interface Rendered {
  blob: Blob;
  url: string;
  /** 이 이미지를 그릴 때의 설정. 지금 설정과 다르면 아직 다시 그리는 중이다. */
  key: string;
}

export type ResultStep = "frame" | "filter" | "text" | "save";
const STEPS: ResultStep[] = ["frame", "filter", "text", "save"];

const NO_STATUS: SaveOutcome = { kind: "none", message: "" };
/** 고른 인쇄 방식 (테두리 없음 / 여백 포함) */
const PRINT_MODE_KEY = "snowcut.printMode";

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** 내 사진이 들어간 프레임 축소 미리보기 */
function FrameCard(props: {
  frame: FrameId;
  name: string;
  layout: LayoutKey;
  shots: (Shot | null)[];
  revision: number;
  date: Date | null;
  caption: string;
  characters: Character[];
  selected: boolean;
  onPick: () => void;
}) {
  const { frame, name, layout, shots, revision, date, caption, characters, selected, onPick } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  const time = date?.getTime() ?? 0;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // 카드 폭(약 100px)의 2배 해상도로 그린다. 가로형은 높이 기준.
    const { width, height } = LAYOUTS[layout].canvas;
    const scale = width > height ? 220 / height : 220 / width;
    try {
      drawComposite(canvas, {
        layout,
        frame,
        shots,
        caption,
        date: time ? new Date(time) : null,
        titleFont: cssVar("--font-print"),
        dateFont: cssVar("--font-body"),
        scale,
        characters,
      });
    } catch {}
    // shots는 revision이 바뀔 때만 달라진다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, layout, revision, time, caption, characters]);
  return (
    <button type="button" className="pick-card" data-frame={frame} aria-pressed={selected} onClick={onPick}>
      <span
        className="pick-thumb"
        style={{ aspectRatio: `${LAYOUTS[layout].canvas.width} / ${LAYOUTS[layout].canvas.height}` }}
      >
        <canvas ref={ref} aria-hidden />
      </span>
      <span className="pick-name">{name}</span>
    </button>
  );
}

/** 첫 컷에 필터를 입힌 미리보기 */
function FilterCard(props: {
  filter: FilterId;
  name: string;
  shot: Shot | null;
  aspect: number;
  revision: number;
  selected: boolean;
  onPick: () => void;
}) {
  const { filter, name, shot, aspect, revision, selected, onPick } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !shot) return;
    const w = 220;
    const h = Math.round(w / aspect);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cell = { x: 0, y: 0, w, h };
    drawCover(ctx, filterShot(shot, filter, 1, cell), cell);
    // shots는 revision이 바뀔 때만 달라진다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, aspect, revision]);
  return (
    <button type="button" className="pick-card" data-filter={filter} aria-pressed={selected} onClick={onPick}>
      <span className="pick-thumb photo" style={{ aspectRatio: String(aspect) }}>
        <canvas ref={ref} aria-hidden />
      </span>
      <span className="pick-name">{name}</span>
    </button>
  );
}

export function ResultScreen(props: Props) {
  const { layout, frame, showDate, caption, shots, revision, capturedAt, filter, video, characters } = props;
  const { m } = useI18n();
  const t = m.result;
  // 캐릭터는 바꿀 때마다 새 배열이 오므로 배치 값으로 비교한다.
  const characterKey = characters.map((c) => `${c.id}:${c.x},${c.y},${c.size},${c.rotation},${+c.flip},${+c.outline}`).join(";");
  const key = `${layout}|${frame}|${showDate}|${caption}|${revision}|${capturedAt.getTime()}|${filter}|${characterKey}`;
  const [rendered, setRendered] = useState<Rendered | null>(null);
  const [status, setStatus] = useState<SaveOutcome>(NO_STATUS);
  const [saving, setSaving] = useState(false);
  const { step, onStep: setStep } = props;
  const [category, setCategory] = useState<FrameCategory>(() => frameDesign(frame).category);
  // iPad WebKit은 캔버스 메모리 총량에 상한이 있어서 큰 합성 캔버스는 하나만 만들어 재사용한다.
  const compositeRef = useRef<HTMLCanvasElement | null>(null);
  const firstRender = useRef(true);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // 설정을 연달아 바꿀 때 매번 다시 그리지 않도록 잠깐 기다린다.
    const delay = firstRender.current ? 0 : 180;
    firstRender.current = false;

    const timer = setTimeout(async () => {
      const titleFont = cssVar("--font-print");
      const dateFont = cssVar("--font-body");
      // 한글 웹폰트는 글자 범위별로 나뉘어 있어서, 실제로 그릴 글자를 넘겨야 해당 조각을 받아 온다.
      try {
        await Promise.all([
          caption.trim() ? document.fonts.load(`80px ${titleFont}`, caption) : Promise.resolve(),
          document.fonts.load(`600 40px ${dateFont}`, "0123456789."),
        ]);
      } catch {}
      if (cancelled) return;

      let blob: Blob | null = null;
      try {
        compositeRef.current ??= document.createElement("canvas");
        drawComposite(compositeRef.current, {
          layout,
          frame,
          shots,
          caption,
          date: showDate ? capturedAt : null,
          titleFont,
          dateFont,
          // 필터는 사진 칸에 보이는 부분에만 입힌다. 프레임·문구는 그대로.
          process: (shot, i, cell) => filterShot(shot, filter, i + 1, cell),
          characters,
        });
        blob = await canvasToJpeg(compositeRef.current);
      } catch {}
      if (cancelled) return;
      if (!blob) {
        setStatus({ kind: "bad", message: t.renderFailed });
        return;
      }
      const url = URL.createObjectURL(blob);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setRendered({ blob, url, key });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // shots는 revision이 바뀔 때만 달라지므로 key로 충분하다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 화면을 떠날 때 마지막 이미지 URL과 합성 캔버스를 정리한다.
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
      const c = compositeRef.current;
      if (c) {
        c.width = 0;
        c.height = 0;
      }
    };
  }, []);

  const change =
    <T,>(fn: (value: T) => void) =>
    (value: T) => {
      setStatus(NO_STATUS);
      fn(value);
    };

  const onSave = async () => {
    if (!rendered || saving) return;
    setSaving(true);
    try {
      setStatus(await saveImage(rendered.blob, fileNameFor(capturedAt), rendered.url, t.save));
    } finally {
      setSaving(false);
    }
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoName = video ? fileNameFor(capturedAt, videoExtension(video.type)) : "";
  // 영상 주소는 영상 칸이 화면에 있는 동안만 만든다 (StrictMode의 재실행에도 안전하도록 effect 안에서 만들고 정리).
  useEffect(() => {
    const el = videoRef.current;
    if (!video || !el) return;
    const url = URL.createObjectURL(video);
    el.src = url;
    return () => {
      el.removeAttribute("src");
      el.load();
      URL.revokeObjectURL(url);
    };
  }, [video, step]);

  const onSaveVideo = async () => {
    if (!video || saving) return;
    setSaving(true);
    const url = URL.createObjectURL(video);
    try {
      setStatus(await saveImage(video, videoName, url, t.save, "video"));
    } finally {
      setSaving(false);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  };

  const onDownloadVideo = () => {
    if (video) setStatus(downloadBlob(video, videoName, t.save));
  };

  // 인쇄 방식은 기억해 둔다. 기본은 캐논 SELPHY CP1500 기준(테두리 없음).
  const [printMode, setPrintModeState] = useState<PrintMode>(() => {
    try {
      const saved = localStorage.getItem(PRINT_MODE_KEY);
      if (saved === "borderless" || saved === "margin") return saved;
    } catch {}
    return "borderless";
  });
  const setPrintMode = (mode: PrintMode) => {
    setPrintModeState(mode);
    try {
      localStorage.setItem(PRINT_MODE_KEY, mode);
    } catch {}
  };
  // 인쇄용 시트(엽서 100×148mm)는 저장 단계에 있을 때만 만든다. 큰 캔버스라 다 만들면 바로 비운다.
  const [sheet, setSheet] = useState<{ url: string; key: string } | null>(null);
  // 화면에 보이는 완성 사진(rendered)에서 바로 만든다. 합성 캔버스는 다음 설정으로 다시 그리는 중일 수 있어서 쓰지 않는다.
  const renderedUrl = rendered && rendered.key === key ? rendered.url : null;
  useEffect(() => {
    if (step !== "save" || !renderedUrl) return;
    let cancelled = false;
    let url: string | null = null;
    const canvas = document.createElement("canvas");
    (async () => {
      let blob: Blob | null = null;
      try {
        const img = new Image();
        img.src = renderedUrl;
        await img.decode();
        if (cancelled) return;
        // 테두리 없는 인쇄는 프린터가 잘라 내는 가장자리만큼 사진을 안쪽에 둔다. 여백 포함 인쇄는 흰 여백이 대신한다.
        drawPrintSheet(canvas, img, layout, printMode === "borderless" ? PRINT_BLEED_MM : 0);
        blob = await canvasToJpeg(canvas, 0.97);
      } catch {
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
      if (cancelled || !blob) return;
      url = URL.createObjectURL(blob);
      setSheet({ url, key });
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setSheet(null);
    };
    // renderedUrl이 바뀌면 key도 지금 값이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, renderedUrl, printMode]);
  const printReady = !!sheet && sheet.key === key;
  const counts = printCounts(layout);
  // 레이아웃을 바꾸면 단위(1장/2개)가 달라지므로 가장 가까운 선택지로 맞춘다.
  const [printCount, setPrintCount] = useState(counts[0]);
  const count = counts.includes(printCount)
    ? printCount
    : (counts.find((c) => c >= printCount) ?? counts[counts.length - 1]);
  const pages = pagesFor(layout, count);
  const perSheet = sheetPlan(layout).copies;
  const fit = marginFit();
  const sheetStyle: CSSProperties | undefined =
    printMode === "margin"
      ? { width: `${fit.w}mm`, height: `${fit.h}mm`, padding: `${fit.padY}mm ${fit.padX}mm`, boxSizing: "content-box", background: "#fff" }
      : undefined;

  const onPrint = () => {
    if (!printReady) return;
    setStatus(NO_STATUS);
    window.print();
  };

  const onDownloadPrint = () => {
    if (!sheet) return;
    setStatus(downloadImage(fileNameFor(capturedAt).replace(".jpg", "-print.jpg"), sheet.url, t.save));
  };

  const onDownload = () => {
    if (!rendered) return;
    setStatus(downloadImage(fileNameFor(capturedAt), rendered.url, t.save));
  };

  // 광고를 켰으면 다운로드·인쇄 버튼을 누를 때 광고 창을 먼저 띄운다. 같은 결과에서는 한 번만 보여 준다.
  const adsActive = useAdsActive() && !!AD_SLOT_INTERSTITIAL;
  const resultId = capturedAt.getTime();
  const [adSeenFor, setAdSeenFor] = useState<number | null>(null);
  const [adPending, setAdPending] = useState<{ action: string; run: () => void } | null>(null);
  const withAd = (action: string, run: () => void) => () => {
    if (!adsActive || adSeenFor === resultId) {
      run();
      return;
    }
    setAdPending({ action, run });
  };
  const continueAfterAd = () => {
    if (!adPending) return;
    setAdSeenFor(resultId);
    setAdPending(null);
    // 계속 버튼의 클릭 안에서 바로 실행한다 (iOS의 공유·인쇄는 사용자 동작 안에서만 열린다).
    adPending.run();
  };

  const spec = LAYOUTS[layout];
  const aspect = photoAspect(layout);
  const shape =
    spec.canvas.width > spec.canvas.height ? "wide" : spec.canvas.width * 2 < spec.canvas.height ? "tall" : "normal";
  const layouts = compatibleLayouts(layout);
  // 설정을 바꾼 뒤 아직 다시 그리는 중이면 저장을 막는다. 미리보기와 다른 사진이 저장되지 않도록.
  const stale = !rendered || rendered.key !== key;
  const stepIndex = STEPS.indexOf(step);
  const go = (i: number) => {
    setStatus(NO_STATUS);
    setStep(STEPS[Math.max(0, Math.min(STEPS.length - 1, i))]);
  };
  const date = showDate ? capturedAt : null;

  return (
    <section id="result" className="screen">
      <div className="print-wrap">
        {rendered ? (
          // blob: URL 이미지라 next/image 최적화 대상이 아니다. 길게 눌러 저장할 수 있도록 일반 img를 쓴다.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            id="print"
            className="print"
            src={rendered.url}
            alt={t.photoAlt}
            style={{ "--ratio": spec.canvas.width / spec.canvas.height } as CSSProperties}
          />
        ) : (
          <p className="hint">{t.rendering}</p>
        )}
      </div>

      <aside className="kiosk" aria-label={t.decorate}>
        <header className="kiosk-head">
          <h2>{t.decorate}</h2>
          <span className="kiosk-size">
            {m.catalog.layouts[layout].title} · {spec.canvas.width}×{spec.canvas.height}
          </span>
        </header>

        <nav className="steps" role="tablist" aria-label={t.stepsLabel}>
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              role="tab"
              data-step={s}
              aria-selected={step === s}
              className={i < stepIndex ? "done" : ""}
              onClick={() => go(i)}
            >
              <span className="step-no">{i < stepIndex ? "✓" : i + 1}</span>
              {t.steps[s]}
            </button>
          ))}
        </nav>

        <div className="kiosk-body" role="tabpanel">
          {step === "frame" && (
            <>
              {layouts.length > 1 && (
                <div className="seg layouts" role="group" aria-label={t.layoutsLabel}>
                  {layouts.map((k) => (
                    <button
                      key={k}
                      type="button"
                      data-layout={k}
                      aria-pressed={layout === k}
                      onClick={() => change(props.onLayout)(k)}
                    >
                      {m.catalog.layouts[k].title}
                    </button>
                  ))}
                </div>
              )}
              <div className="cats" role="group" aria-label={t.frameCategoriesLabel}>
                {FRAME_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    data-cat={c.id}
                    aria-pressed={category === c.id}
                    onClick={() => setCategory(c.id)}
                  >
                    {m.catalog.frameCategories[c.id]}
                  </button>
                ))}
              </div>
              <div className={`pick-grid ${shape}`}>
                {FRAMES.filter((f) => f.category === category).map((f) => (
                  <FrameCard
                    key={f.id}
                    frame={f.id}
                    name={m.catalog.frames[f.id]}
                    layout={layout}
                    shots={shots}
                    revision={revision}
                    date={date}
                    caption={caption}
                    characters={characters}
                    selected={frame === f.id}
                    onPick={() => change(props.onFrame)(f.id)}
                  />
                ))}
              </div>
            </>
          )}

          {step === "filter" && (
            <>
              <p className="kiosk-note">{t.filterNote}</p>
              <div className="pick-grid photo">
                {FILTERS.map((f) => (
                  <FilterCard
                    key={f.id}
                    filter={f.id}
                    name={m.catalog.filters[f.id]}
                    shot={shots[0]}
                    aspect={aspect}
                    revision={revision}
                    selected={filter === f.id}
                    onPick={() => change(props.onFilter)(f.id)}
                  />
                ))}
              </div>
            </>
          )}

          {step === "text" && (
            <>
              <label className="field" htmlFor="captionInput">
                <span className="field-label-row">
                  <b>{t.options.caption}</b>
                  <small>
                    {caption.length}/{CAPTION_MAX}
                  </small>
                </span>
                <input
                  id="captionInput"
                  className="text-input"
                  type="text"
                  value={caption}
                  maxLength={CAPTION_MAX}
                  placeholder={t.options.captionPlaceholder}
                  enterKeyHint="done"
                  onChange={(e) => change(props.onCaption)(e.target.value)}
                />
              </label>
              <label className="toggle" htmlFor="dateToggle">
                <b>{t.options.showDate}</b>
                <input
                  id="dateToggle"
                  type="checkbox"
                  role="switch"
                  checked={showDate}
                  onChange={(e) => change(props.onShowDate)(e.target.checked)}
                />
              </label>
              <div className="field">
                <span className="field-label-row">
                  <b>{t.options.characters}</b>
                  <small>
                    {!CHARACTER_ENABLED
                      ? m.common.soonBadge
                      : characters.length
                        ? t.options.characterCount(characters.length)
                        : t.options.noCharacters}
                  </small>
                </span>
                {CHARACTER_ENABLED ? (
                  <button type="button" className="btn-outline" onClick={props.onCharacters}>
                    {characters.length ? t.options.editCharacters : t.options.addCharacters}
                  </button>
                ) : (
                  // 준비 중: 누를 수 없게 막아 두고 안내만 한다.
                  <button type="button" className="btn-outline" disabled>
                    {m.common.comingSoon}
                  </button>
                )}
              </div>
              <div className="field">
                <b>{t.options.retake}</b>
                <div className="retakes" id="retakeThumbs">
                  {shots.map((shot, i) => (
                    <ShotThumb
                      key={i}
                      shot={shot}
                      index={i}
                      aspect={photoAspect(layout, i)}
                      label={t.options.retakeShot(i + 1)}
                      onClick={() => props.onRetake(i)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {step === "save" && (
            <div className="actions">
              <button id="saveBtn" className="cta" type="button" disabled={stale || saving} onClick={withAd(t.savePhoto, onSave)}>
                {t.savePhoto}
              </button>
              <button id="downloadBtn" className="btn-outline" type="button" disabled={stale} onClick={withAd(t.downloadPhoto, onDownload)}>
                {t.downloadPhoto}
              </button>
              <div className="print-box">
                <b>{t.print.title}</b>
                <div className="stepper" role="group" aria-label={t.print.countLabel}>
                  <button
                    type="button"
                    aria-label={t.print.decrease}
                    disabled={count === counts[0]}
                    onClick={() => setPrintCount(counts[Math.max(0, counts.indexOf(count) - 1)])}
                  >
                    −
                  </button>
                  <output id="printCount">
                    {t.print.count(count)} <small>{t.print.pages(pages)}</small>
                  </output>
                  <button
                    type="button"
                    aria-label={t.print.increase}
                    disabled={count === counts[counts.length - 1]}
                    onClick={() => setPrintCount(counts[Math.min(counts.length - 1, counts.indexOf(count) + 1)])}
                  >
                    +
                  </button>
                </div>
                <div className="clip-actions">
                  <button id="printBtn" className="btn-outline" type="button" disabled={!printReady} onClick={withAd(t.print.print, onPrint)}>
                    {t.print.print}
                  </button>
                  <button
                    id="printFileBtn"
                    className="btn-outline"
                    type="button"
                    disabled={!printReady}
                    onClick={withAd(t.print.printFile, onDownloadPrint)}
                  >
                    {t.print.printFile}
                  </button>
                </div>
                <div className="seg print-mode" role="group" aria-label={t.print.mode.label}>
                  {(["borderless", "margin"] as const).map((mode) => (
                    <button key={mode} type="button" aria-pressed={printMode === mode} onClick={() => setPrintMode(mode)}>
                      {t.print.mode[mode]}
                    </button>
                  ))}
                </div>
                <p className="kiosk-note">
                  {printMode === "margin" ? (
                    t.print.marginGuide
                  ) : (
                    <>
                      {t.print.guide.beforePaper}
                      <b>{t.print.guide.paper}</b>
                      {t.print.guide.beforeBorderless}
                      <b>{t.print.guide.borderless}</b>
                      {t.print.guide.after}
                    </>
                  )}
                  {perSheet === 2 && t.print.twoPerSheet}
                </p>
                {printMode === "borderless" && <p className="kiosk-note">{t.print.windowsTip}</p>}
                <p className="kiosk-note">{t.print.printerNote}</p>
              </div>
              <p className={`status${status.kind === "none" ? "" : " " + status.kind}`} role="status">
                {status.message}
              </p>
              {video && (
                <div className="clip" id="clip">
                  <b>{t.video.title}</b>
                  <video ref={videoRef} controls playsInline muted loop preload="metadata" />
                  <div className="clip-actions">
                    <button
                      id="saveVideoBtn"
                      className="btn-outline"
                      type="button"
                      disabled={saving}
                      onClick={withAd(t.video.save, onSaveVideo)}
                    >
                      {t.video.save}
                    </button>
                    <button id="downloadVideoBtn" className="btn-outline" type="button" onClick={withAd(t.video.download, onDownloadVideo)}>
                      {t.video.download}
                    </button>
                  </div>
                </div>
              )}
              <p className="kiosk-note">
                {t.iosNote.before}
                <b>{t.iosNote.action}</b>
                {t.iosNote.after}
              </p>
            </div>
          )}
        </div>

        <footer className="kiosk-foot">
          <div className="dots" aria-hidden>
            {STEPS.map((s, i) => (
              <i key={s} className={i === stepIndex ? "on" : ""} />
            ))}
          </div>
          <div className="kiosk-nav">
            {stepIndex > 0 ? (
              <button type="button" className="btn-ghost" onClick={() => go(stepIndex - 1)}>
                {t.prev}
              </button>
            ) : (
              <span />
            )}
            {step === "save" ? (
              <button id="newBtn" type="button" className="cta" onClick={props.onNew}>
                {t.newShoot}
              </button>
            ) : (
              <button id="nextBtn" type="button" className="cta" onClick={() => go(stepIndex + 1)}>
                {t.next}
              </button>
            )}
          </div>
        </footer>
      </aside>

      {adPending && <AdBreak action={adPending.action} onContinue={continueAfterAd} onClose={() => setAdPending(null)} />}

      {sheet && (
        // 인쇄할 때만 보이는 엽서 크기 시트 (globals.css의 @media print)
        <div id="print-sheet" aria-hidden>
          {Array.from({ length: pages }, (_, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={sheet.url} alt="" style={sheetStyle} />
          ))}
        </div>
      )}
    </section>
  );
}
