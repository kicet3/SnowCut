"use client";

import { useEffect, useRef } from "react";
import { drawComposite, type Shot } from "@/lib/canvas";
import { LAYOUTS, type LayoutKey } from "@/lib/frame";
import type { FrameId } from "@/lib/frames";

// 메인 페이지 전시용 견본 사진. 실제 사진 대신 파스텔 배경에 사람 실루엣을 그린다.
const SAMPLE_BG = [
  ["#ffd3e0", "#ffadc6"],
  ["#d6e8ff", "#a9c4ff"],
  ["#d9f5e6", "#9fdcc0"],
  ["#efe1ff", "#c9adff"],
  ["#fff0c9", "#ffd27a"],
  ["#ffe0d1", "#ffb59a"],
];

let samples: Shot[] | null = null;

function sampleShots(): Shot[] {
  if (samples) return samples;
  samples = SAMPLE_BG.map(([a, b], i) => {
    const c = document.createElement("canvas");
    c.width = 480;
    c.height = 480;
    const ctx = c.getContext("2d");
    if (!ctx) return c;
    const g = ctx.createLinearGradient(0, 0, 480, 480);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 480, 480);
    // 한 명 또는 두 명. 컷마다 위치를 조금씩 바꿔 포즈가 달라 보이게 한다.
    const people = i % 2 ? [150, 330] : [240];
    ctx.fillStyle = "rgba(255,255,255,.88)";
    for (const [k, x0] of people.entries()) {
      const x = x0 + (i % 3) * 12 - 12;
      const head = 210 + ((i + k) % 2) * 16;
      ctx.beginPath();
      ctx.arc(x, head, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, head + 210, 112, 140, 0, Math.PI, 0);
      ctx.fill();
    }
    return c;
  });
  return samples;
}

interface Props {
  frame: FrameId;
  layout: LayoutKey;
  /** 화면에 보일 너비(px). 캔버스는 기기 배율만큼 크게 그린다. */
  width: number;
  /** 견본 사진을 채운다. 끄면 빈 칸으로 보여 준다. */
  photos?: boolean;
  caption?: string;
  className?: string;
}

export function FramePreview({ frame, layout, width, photos = true, caption = "SnowCut", className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { canvas } = LAYOUTS[layout];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      const font = getComputedStyle(document.documentElement).getPropertyValue("--font-print").trim();
      const scale = (width * Math.min(window.devicePixelRatio || 1, 2)) / canvas.width;
      drawComposite(el, {
        layout,
        frame,
        shots: photos ? sampleShots() : [],
        caption,
        date: new Date(),
        titleFont: font,
        dateFont: font,
        scale,
      });
    };
    draw();
    // 글꼴이 늦게 오면 문구만 다시 그린다.
    document.fonts?.ready.then(draw);
    return () => {
      cancelled = true;
    };
  }, [frame, layout, width, photos, caption, canvas.width]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width, aspectRatio: `${canvas.width} / ${canvas.height}` }}
      aria-hidden
    />
  );
}
