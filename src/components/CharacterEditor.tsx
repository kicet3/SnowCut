"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { BG_REMOVER_URL, BgRemoverError, removeBackground } from "@/lib/bgRemover";
import { drawComposite, type Shot } from "@/lib/canvas";
import {
  SIZE_MAX,
  SIZE_MIN,
  characterBox,
  clamp,
  freeCharacter,
  hitTest,
  loadUpload,
  normalizeDeg,
  placementOf,
  toImagePoints,
  hasTransparency,
  trimTransparent,
  type Character,
} from "@/lib/character";
import { CAPTION, LAYOUTS, type LayoutKey } from "@/lib/frame";
import type { FrameId } from "@/lib/frames";
import { filterShot } from "@/lib/look/apply";
import type { FilterId } from "@/lib/look/presets";

interface Props {
  layout: LayoutKey;
  /** 여기서 바꿀 수 있는 레이아웃 (촬영 전에는 전부, 찍은 뒤에는 장수가 같은 것만) */
  layouts: LayoutKey[];
  frame: FrameId;
  /** 미리보기에 넣을 촬영본 (촬영 전이면 빈 칸) */
  shots: (Shot | null)[];
  /** 결과 화면에서 열면 실제 합성과 같게 필터·날짜까지 보여 준다 */
  filter?: FilterId;
  date?: Date | null;
  characters: Character[];
  onLayout: (layout: LayoutKey) => void;
  onChange: (characters: Character[]) => void;
  onClose: () => void;
}

/** 누끼 따기 단계: 업로드한 원본과 피사체 위를 누른 점들 (원본 비율 0~1) */
interface Cutout {
  source: HTMLCanvasElement;
  points: { x: number; y: number }[];
  busy: boolean;
  error: string;
}

/** 미리보기 캔버스의 긴 변 (px). 화면 크기와 상관없이 이 해상도로 그리고 CSS로 맞춘다. */
const PREVIEW_LONG = 960;

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function freeCanvas(c: HTMLCanvasElement | null | undefined) {
  if (c) {
    c.width = 0;
    c.height = 0;
  }
}

/** 무대(stage) 안에 비율을 지키며 꽉 차는 크기(px). 캔버스는 CSS만으로는 양쪽 상한을 함께 지키기 어렵다. */
function useFit(stage: RefObject<HTMLDivElement | null>, aspect: number) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      const { width: bw, height: bh } = el.getBoundingClientRect();
      if (!bw || !bh) return;
      const width = Math.min(bw, bh * aspect);
      setSize({ width: Math.floor(width), height: Math.floor(width / aspect) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stage, aspect]);
  return size ?? undefined;
}

/** 캐릭터 목록의 작은 썸네일 */
function CharacterThumb({ image }: { image: HTMLCanvasElement }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !image.width) return;
    const s = 96 / Math.max(image.width, image.height);
    c.width = Math.round(image.width * s);
    c.height = Math.round(image.height * s);
    c.getContext("2d")?.drawImage(image, 0, 0, c.width, c.height);
  }, [image]);
  return <canvas ref={ref} aria-hidden />;
}

/** 누끼 따기: 원본을 보여 주고 누른 자리에 점을 찍는다. */
function CutoutStage(props: { cutout: Cutout; stage: RefObject<HTMLDivElement | null>; onPoint: (p: { x: number; y: number }) => void }) {
  const { cutout, stage, onPoint } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  const { source } = cutout;
  const size = useFit(stage, source.width / source.height);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const s = Math.min(1, PREVIEW_LONG / Math.max(source.width, source.height));
    c.width = Math.round(source.width * s);
    c.height = Math.round(source.height * s);
    c.getContext("2d")?.drawImage(source, 0, 0, c.width, c.height);
  }, [source]);
  return (
    <div className="cutout-stage" style={size}>
      <canvas
        ref={ref}
        onClick={(e) => {
          if (cutout.busy) return;
          const r = e.currentTarget.getBoundingClientRect();
          onPoint({ x: clamp((e.clientX - r.left) / r.width, 0, 1), y: clamp((e.clientY - r.top) / r.height, 0, 1) });
        }}
      />
      {cutout.points.map((p, i) => (
        <i key={i} className="cutout-dot" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} />
      ))}
      {cutout.busy && <div className="cutout-busy">누끼 따는 중…</div>}
    </div>
  );
}

type Gesture =
  | { kind: "drag"; id: number; dx: number; dy: number }
  | { kind: "pinch"; id: number; dist: number; angle: number; size: number; rotation: number };

export function CharacterEditor(props: Props) {
  const { layout, layouts, frame, shots, filter, date, onLayout, onChange, onClose } = props;
  // 끄는 동안(드래그·핀치)에는 여기서만 바꾸고, 손을 떼면 Booth에 알린다.
  const [list, setListState] = useState<Character[]>(props.characters);
  // 렌더가 따라오기 전에 이벤트가 이어져도(빠른 드래그 후 바로 손 떼기) 최신 목록을 쓰도록 ref에도 둔다.
  const listRef = useRef<Character[]>(props.characters);
  const setList = (next: Character[]) => {
    listRef.current = next;
    setListState(next);
  };
  const [selected, setSelected] = useState<number | null>(props.characters.at(-1)?.id ?? null);
  const [cutout, setCutout] = useState<Cutout | null>(null);
  const [uploadError, setUploadError] = useState("");
  const previewRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cutoutRef = useRef<Cutout | null>(null);
  const mountedRef = useRef(true);
  const uploadSeq = useRef(0);
  useEffect(() => {
    cutoutRef.current = cutout;
  }, [cutout]);

  const { width: W, height: H } = LAYOUTS[layout].canvas;
  const current = list.find((c) => c.id === selected) ?? null;
  const previewSize = useFit(stageRef, W / H);

  const commit = (next: Character[]) => {
    setList(next);
    onChange(next);
  };
  const update = (id: number, patch: Partial<Character>, save = true) => {
    const next = listRef.current.map((c) => (c.id === id ? { ...c, ...patch } : c));
    if (save) commit(next);
    else setList(next);
  };

  // 닫힐 때 진행 중인 누끼 요청과 원본을 정리한다.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      freeCanvas(cutoutRef.current?.source);
    };
  }, []);

  // 미리보기: 실제 합성과 같은 함수로 그리고, 고른 캐릭터에 점선 테두리를 덧그린다.
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || cutout) return;
    const scale = PREVIEW_LONG / Math.max(W, H);
    const raf = requestAnimationFrame(() => {
      try {
        drawComposite(canvas, {
          layout,
          frame,
          shots,
          caption: CAPTION,
          date: date ?? null,
          titleFont: cssVar("--font-print"),
          dateFont: cssVar("--font-body"),
          scale,
          characters: list,
          process: filter ? (shot, i, cell) => filterShot(shot, filter, i + 1, cell) : undefined,
        });
      } catch {
        return;
      }
      const sel = list.find((c) => c.id === selected);
      const ctx = canvas.getContext("2d");
      if (!sel || !ctx) return;
      const { cx, cy, w, h } = characterBox(placementOf(sel), W, H);
      ctx.save();
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.translate(cx, cy);
      ctx.rotate((sel.rotation * Math.PI) / 180);
      ctx.lineWidth = 3 / scale;
      ctx.setLineDash([10 / scale, 8 / scale]);
      ctx.strokeStyle = "#ff5c8a";
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    });
    return () => cancelAnimationFrame(raf);
  }, [layout, frame, shots, filter, date, list, selected, cutout, W, H]);

  // ---------- 배치: 끌어서 옮기고, 두 손가락으로 크기·회전 ----------

  const toCanvas = (e: { clientX: number; clientY: number }) => {
    const r = previewRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const startPinch = (id: number) => {
    const c = list.find((x) => x.id === id);
    const [a, b] = [...pointers.current.values()];
    if (!c || !a || !b) return;
    gesture.current = {
      kind: "pinch",
      id,
      dist: Math.hypot(b.x - a.x, b.y - a.y) || 1,
      angle: Math.atan2(b.y - a.y, b.x - a.x),
      size: c.size,
      rotation: c.rotation,
    };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const p = toCanvas(e);
    pointers.current.set(e.pointerId, p);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pointers.current.size === 2 && selected !== null) {
      startPinch(selected);
      return;
    }
    if (pointers.current.size > 1) return;
    // 손가락은 조금 빗나가도 잡히게 여유를 둔다.
    const slop = e.pointerType === "touch" ? Math.min(W, H) * 0.03 : 0;
    const i = hitTest(list.map(placementOf), W, H, p.x, p.y, slop);
    if (i < 0) {
      gesture.current = null;
      return;
    }
    const c = list[i];
    setSelected(c.id);
    gesture.current = { kind: "drag", id: c.id, dx: c.x * W - p.x, dy: c.y * H - p.y };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = toCanvas(e);
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "drag") {
      update(g.id, { x: clamp((p.x + g.dx) / W, 0, 1), y: clamp((p.y + g.dy) / H, 0, 1) }, false);
    } else {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      update(
        g.id,
        {
          size: clamp((g.size * dist) / g.dist, SIZE_MIN, SIZE_MAX),
          rotation: Math.round(normalizeDeg(g.rotation + ((angle - g.angle) * 180) / Math.PI)),
        },
        false,
      );
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (gesture.current) onChange(listRef.current);
    // 두 손가락 중 하나만 떼면 남은 손가락으로 이어서 옮기지 않는다 (튀는 것을 막는다).
    gesture.current = null;
  };

  // 휠로 크기 조절. React의 onWheel은 passive라 페이지 스크롤을 막을 수 없어서 직접 단다.
  const wheelRef = useRef<(e: WheelEvent) => void>(() => {});
  useEffect(() => {
    wheelRef.current = (e) => {
      if (!current) return;
      e.preventDefault();
      update(current.id, { size: clamp(current.size * Math.exp(-e.deltaY * 0.0015), SIZE_MIN, SIZE_MAX) });
    };
  });
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => wheelRef.current(e);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [cutout]);

  // ---------- 추가: 업로드 → 누끼 ----------

  const onFile = async (file: File | undefined) => {
    setUploadError("");
    if (!file) return;
    const seq = ++uploadSeq.current;
    try {
      const source = await loadUpload(file);
      // 읽는 동안 창을 닫았거나 다른 파일을 골랐으면 버린다.
      if (!mountedRef.current || seq !== uploadSeq.current) {
        freeCanvas(source);
        return;
      }
      setCutout((prev) => {
        if (prev) freeCanvas(prev.source);
        return { source, points: [], busy: false, error: "" };
      });
    } catch {
      if (mountedRef.current && seq === uploadSeq.current) setUploadError("이미지를 열지 못했어요. JPG·PNG 파일인지 확인해 주세요.");
    }
  };

  const finishCutout = (image: HTMLCanvasElement) => {
    const prev = listRef.current;
    const id = prev.reduce((m, c) => Math.max(m, c.id), 0) + 1;
    // 짧은 변의 절반 크기로, 사진 칸을 너무 가리지 않게 아래쪽에 둔다.
    const next: Character = { id, image, x: 0.5, y: 0.62, size: 0.5, rotation: 0, flip: false, outline: true };
    commit([...prev, next]);
    setSelected(id);
    if (cutout) freeCanvas(cutout.source);
    setCutout(null);
  };

  const runCutout = async () => {
    if (!cutout || cutout.busy) return;
    const { source, points } = cutout;
    setCutout({ ...cutout, busy: true, error: "" });
    const abort = new AbortController();
    abortRef.current = abort;
    try {
      const png = await toPngBlob(source);
      if (!png) throw new BgRemoverError("이미지를 준비하지 못했어요.");
      const result = await removeBackground(png, toImagePoints(points, source.width, source.height), abort.signal);
      const loaded = await loadUpload(result);
      // 응답을 받은 뒤 그림을 푸는 사이에 취소했으면 결과를 버린다.
      if (abort.signal.aborted) {
        freeCanvas(loaded);
        return;
      }
      // Background-Remover는 처리에 실패해도 원본을 그대로 돌려준다. 투명한 곳이 없으면 실패로 본다.
      if (!hasTransparency(loaded)) {
        freeCanvas(loaded);
        throw new BgRemoverError("배경을 지우지 못했어요. 캐릭터 위를 다른 곳도 눌러서 다시 해 주세요.");
      }
      const trimmed = trimTransparent(loaded);
      freeCanvas(loaded);
      if (!trimmed) throw new BgRemoverError("피사체를 찾지 못했어요. 캐릭터 위를 다시 눌러 주세요.");
      finishCutout(trimmed);
    } catch (e) {
      if (abort.signal.aborted) return;
      const message = e instanceof BgRemoverError ? e.message : "누끼를 따지 못했어요. 다시 해 주세요.";
      setCutout((c) => (c ? { ...c, busy: false, error: message } : c));
    }
  };

  const keepOriginal = () => {
    if (!cutout) return;
    // 이미 배경이 투명한 PNG라면 여백만 잘라 쓴다.
    const trimmed = trimTransparent(cutout.source);
    if (!trimmed) {
      setCutout({ ...cutout, error: "이미지가 전부 투명해요." });
      return;
    }
    finishCutout(trimmed);
  };

  const remove = (id: number) => {
    const target = listRef.current.find((c) => c.id === id);
    const next = listRef.current.filter((c) => c.id !== id);
    commit(next);
    if (target) freeCharacter(target);
    setSelected(next.at(-1)?.id ?? null);
  };

  const bringFront = (id: number) => {
    const target = listRef.current.find((c) => c.id === id);
    if (target) commit([...listRef.current.filter((c) => c.id !== id), target]);
  };

  // Esc로 닫기 (누끼 단계면 그 단계만 취소)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const c = cutoutRef.current;
      if (c) {
        abortRef.current?.abort();
        freeCanvas(c.source);
        setCutout(null);
        return;
      }
      // 끄는 중에 닫으면 그때까지 옮긴 것을 저장한다.
      if (gesture.current) {
        gesture.current = null;
        pointers.current.clear();
        onChange(listRef.current);
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onChange]);

  const cancelCutout = () => {
    abortRef.current?.abort();
    if (cutout) freeCanvas(cutout.source);
    setCutout(null);
  };

  return (
    <div className="char-editor" role="dialog" aria-modal="true" aria-label="커스텀 캐릭터">
      <div className="char-stage" ref={stageRef}>
        {cutout ? (
          <CutoutStage cutout={cutout} stage={stageRef} onPoint={(p) => setCutout({ ...cutout, points: [...cutout.points, p], error: "" })} />
        ) : (
          <canvas
            ref={previewRef}
            className="char-preview"
            style={previewSize}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        )}
      </div>

      <aside className="char-panel">
        <header className="char-head">
          <h2>커스텀 캐릭터</h2>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={cutout?.busy}>
            완료
          </button>
        </header>

        {cutout ? (
          <div className="char-body">
            <p className="kiosk-note">
              {BG_REMOVER_URL
                ? "남길 캐릭터(피사체) 위를 눌러 점을 찍어 주세요. 여러 군데 누를수록 정확해요."
                : "누끼 서버가 설정되지 않아 배경을 지울 수 없어요. 배경이 투명한 PNG라면 그대로 쓸 수 있어요."}
            </p>
            {BG_REMOVER_URL && (
              <div className="char-row">
                <span>찍은 점 {cutout.points.length}개</span>
                <button
                  type="button"
                  className="btn-ghost small"
                  disabled={!cutout.points.length || cutout.busy}
                  onClick={() => setCutout({ ...cutout, points: cutout.points.slice(0, -1) })}
                >
                  마지막 점 지우기
                </button>
              </div>
            )}
            {cutout.error && (
              <p className="char-error" role="alert">
                {cutout.error}
              </p>
            )}
            {BG_REMOVER_URL && (
              <button type="button" className="cta" disabled={!cutout.points.length || cutout.busy} onClick={runCutout}>
                {cutout.busy ? "누끼 따는 중…" : "누끼 따기"}
              </button>
            )}
            <button type="button" className="btn-outline" disabled={cutout.busy} onClick={keepOriginal}>
              배경 그대로 쓰기
            </button>
            <button type="button" className="btn-ghost" onClick={cancelCutout}>
              취소
            </button>
          </div>
        ) : (
          <div className="char-body">
            {layouts.length > 1 && (
              <div className="field">
                <span className="field-label-row">
                  <b>기본 레이아웃</b>
                </span>
                <div className="seg layouts" role="group" aria-label="기본 레이아웃">
                  {layouts.map((k) => (
                    <button key={k} type="button" aria-pressed={layout === k} onClick={() => onLayout(k)}>
                      {LAYOUTS[k].title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="field">
              <span className="field-label-row">
                <b>캐릭터</b>
                <small>{list.length ? "눌러서 고르고, 끌어서 옮겨요" : "이미지를 올려 시작해요"}</small>
              </span>
              <div className="char-list">
                {list.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="char-thumb"
                    aria-pressed={c.id === selected}
                    aria-label={`캐릭터 ${c.id}`}
                    onClick={() => setSelected(c.id)}
                  >
                    <CharacterThumb image={c.image} />
                  </button>
                ))}
                <button type="button" className="char-thumb add" onClick={() => fileRef.current?.click()}>
                  <span aria-hidden>＋</span>
                  <small>이미지 올리기</small>
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  void onFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {uploadError && (
                <p className="char-error" role="alert">
                  {uploadError}
                </p>
              )}
            </div>

            {current && (
              <>
                <label className="field">
                  <span className="field-label-row">
                    <b>크기</b>
                    <small>{Math.round(current.size * 100)}%</small>
                  </span>
                  <input
                    type="range"
                    min={SIZE_MIN}
                    max={SIZE_MAX}
                    step={0.01}
                    value={current.size}
                    onChange={(e) => update(current.id, { size: Number(e.target.value) })}
                  />
                </label>
                <label className="field">
                  <span className="field-label-row">
                    <b>회전</b>
                    <small>{current.rotation}°</small>
                  </span>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={current.rotation}
                    onChange={(e) => update(current.id, { rotation: Number(e.target.value) })}
                  />
                </label>
                <label className="toggle">
                  <span>흰 테두리 (스티커)</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={current.outline}
                    onChange={(e) => update(current.id, { outline: e.target.checked })}
                  />
                </label>
                <div className="char-actions">
                  <button type="button" className="btn-ghost" onClick={() => update(current.id, { flip: !current.flip })}>
                    좌우 반전
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => bringFront(current.id)} disabled={list.at(-1)?.id === current.id}>
                    맨 앞으로
                  </button>
                  <button type="button" className="btn-ghost danger" onClick={() => remove(current.id)}>
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

