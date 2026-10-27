"use client";

import { useEffect, useRef } from "react";
import { drawCover, type Shot } from "@/lib/canvas";

interface Props {
  shot: Shot | null;
  index: number;
  aspect: number;
  highlighted?: boolean;
  onClick?: () => void;
  label: string;
}

/** 촬영본 썸네일. onClick이 있으면 다시 찍기 버튼이 된다. */
export function ShotThumb({ shot, index, aspect, highlighted, onClick, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shot) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCover(ctx, shot, { x: 0, y: 0, w: canvas.width, h: canvas.height });
  }, [shot, aspect]);

  const className = ["thumb", highlighted ? "next" : "", onClick ? "retake" : ""].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={className}
      style={{ aspectRatio: String(aspect) }}
      aria-label={label}
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
    >
      {shot ? <canvas ref={canvasRef} /> : index + 1}
    </button>
  );
}
