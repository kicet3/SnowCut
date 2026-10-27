"use client";

import { useEffect, useRef } from "react";
import { drawLayoutPreview } from "@/lib/canvas";
import { useI18n } from "@/i18n/I18nProvider";
import { LAYOUTS, LAYOUT_KEYS, TIMERS, type LayoutKey } from "@/lib/frame";
import { CHARACTER_ENABLED } from "@/lib/site";

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
  const { m } = useI18n();
  const layouts = m.catalog.layouts;
  return (
    <section id="start" className="screen scroll">
      <div>
        <h1 className="logo">
          Snow<span>Cut</span>
        </h1>
        <p className="tagline">{m.start.tagline}</p>
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
              <b>{layouts[key].title}</b>
              <small>
                {spec.canvas.width}×{spec.canvas.height}px · {layouts[key].paper}
              </small>
            </button>
          );
        })}
        <button
          type="button"
          className="layout-card character-card"
          aria-pressed={CHARACTER_ENABLED ? characterCount > 0 : undefined}
          disabled={!CHARACTER_ENABLED}
          onClick={CHARACTER_ENABLED ? onCharacters : undefined}
        >
          {!CHARACTER_ENABLED && <span className="soon-badge">{m.common.soonBadge}</span>}
          <span className="character-art" aria-hidden>
            <i />
            <i />
            <i />
            <i />
            <em>★</em>
          </span>
          <b>{m.start.character.title}</b>
          <small>
            {!CHARACTER_ENABLED
              ? m.common.comingSoon
              : characterCount
                ? m.start.character.count(characterCount, layouts[layout].title)
                : m.start.character.hint}
          </small>
        </button>
      </div>

      <div className="field-label">
        <span className="eyebrow">{m.start.timer}</span>
        <div className="seg">
          {TIMERS.map((t) => (
            <button key={t} type="button" data-timer={t} aria-pressed={timer === t} onClick={() => onTimer(t)}>
              {m.start.seconds(t)}
            </button>
          ))}
        </div>
      </div>

      <button id="startBtn" className="btn primary big" type="button" onClick={onStart}>
        <span className="dot" />
        {m.start.start}
      </button>
    </section>
  );
}
