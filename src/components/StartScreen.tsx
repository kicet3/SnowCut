"use client";

import { useEffect, useRef } from "react";
import { drawLayoutPreview } from "@/lib/canvas";
import { LAYOUTS, LAYOUT_KEYS, TIMERS, type LayoutKey } from "@/lib/frame";

interface Props {
  layout: LayoutKey;
  timer: number;
  onLayout: (layout: LayoutKey) => void;
  onTimer: (seconds: number) => void;
  onStart: () => void;
  /** 올려 둔 커스텀 캐릭터 수 */
  characterCount: number;
  onCharacters: () => void;
}

function LayoutPreview({ layout }: { layout: LayoutKey }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawLayoutPreview(ref.current, layout, "#f4ece6", "#c9b8b1");
  }, [layout]);
  return <canvas ref={ref} />;
}

export function StartScreen({ layout, timer, onLayout, onTimer, onStart, characterCount, onCharacters }: Props) {
  return (
    <section id="start" className="screen scroll">
      <div>
        <h1 className="logo">
          Snow<span>Cut</span>
        </h1>
        <p className="tagline">레이아웃을 고르고 포즈를 준비하세요</p>
      </div>

      <div className="choices">
        {LAYOUT_KEYS.map((key) => {
          const spec = LAYOUTS[key];
          return (
            <button
              key={key}
              type="button"
              className="layout-card"
              data-layout={key}
              aria-pressed={layout === key}
              onClick={() => onLayout(key)}
            >
              <LayoutPreview layout={key} />
              <b>{spec.title}</b>
              <small>
                {spec.canvas.width}×{spec.canvas.height}px · {spec.paper}
              </small>
            </button>
          );
        })}
        <button
          type="button"
          className="layout-card character-card"
          aria-pressed={characterCount > 0}
          onClick={onCharacters}
        >
          <span className="character-art" aria-hidden>
            <i />
            <i />
            <i />
            <i />
            <em>★</em>
          </span>
          <b>커스텀 캐릭터</b>
          <small>{characterCount ? `캐릭터 ${characterCount}개 · ${LAYOUTS[layout].title}` : "이미지를 올려 누끼 따기"}</small>
        </button>
      </div>

      <div className="field-label">
        <span className="eyebrow">타이머</span>
        <div className="seg">
          {TIMERS.map((t) => (
            <button key={t} type="button" data-timer={t} aria-pressed={timer === t} onClick={() => onTimer(t)}>
              {t}초
            </button>
          ))}
        </div>
      </div>

      <button id="startBtn" className="btn primary big" type="button" onClick={onStart}>
        <span className="dot" />
        촬영 시작
      </button>
    </section>
  );
}
