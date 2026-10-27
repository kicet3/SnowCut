"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { Rect } from "@/lib/frame";
import { edgeProfile, measureVideo } from "@/lib/letterbox";

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  mode: string;
  crop: Rect | null;
  getStream: () => MediaStream | null;
  getLog: () => string[];
}

/**
 * 촬영 화면 진단 창 (주소 끝에 ?debug=camera를 붙였을 때만 보인다).
 * 실제 카메라(USB 카메라 등)에서 연결 과정과 검은 띠 판정 값을 화면으로 확인하려고 둔다.
 */
export function CameraDebug({ videoRef, mode, crop, getStream, getLog }: Props) {
  const [text, setText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = (canvasRef.current ??= document.createElement("canvas"));
    const tick = () => {
      const v = videoRef.current;
      const track = getStream()?.getVideoTracks()[0];
      const st = track?.getSettings();
      let measured = "-";
      let profile = "-";
      if (v && v.videoWidth) {
        try {
          const r = measureVideo(v, canvas);
          measured = r ? `${r.x},${r.y} ${r.w}x${r.h}` : "띠 없음";
          const p = edgeProfile(v, canvas);
          if (p) profile = (["top", "bottom", "left", "right"] as const).map((k) => `${k} ${p[k].join(" ")}`).join("\n");
        } catch (e) {
          measured = `측정 실패: ${String(e)}`;
        }
      }
      setText(
        [
          `mode ${mode} · ${navigator.userAgent.match(/(CriOS|FxiOS|Version)\/[\d.]+/)?.[0] ?? ""} ${/Safari/.test(navigator.userAgent) ? "Safari" : ""}`,
          `video ${v?.videoWidth}x${v?.videoHeight} readyState ${v?.readyState} paused ${v?.paused}`,
          `track ${track ? `${track.label} ${track.readyState} muted=${track.muted}` : "없음"}`,
          `settings ${st ? `${st.width}x${st.height} ${st.frameRate ?? "?"}fps` : "-"}`,
          `적용된 자르기 ${crop ? `${crop.x},${crop.y} ${crop.w}x${crop.h}` : "없음"} / 지금 측정 ${measured}`,
          `가장자리 밝은 점 % (바깥→안쪽 0~18%)\n${profile}`,
          "--- 기록",
          ...getLog(),
        ].join("\n"),
      );
    };
    tick();
    const timer = setInterval(tick, 700);
    return () => clearInterval(timer);
  }, [videoRef, mode, crop, getStream, getLog]);

  return <pre className="camera-debug">{text}</pre>;
}
