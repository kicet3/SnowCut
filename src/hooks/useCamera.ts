"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toShot, type Shot } from "@/lib/canvas";

/** live: 실시간 카메라 / file: 카메라 앱으로 한 장씩 / pending: 준비 중 */
export type CameraMode = "pending" | "live" | "file";

const SIZE = { width: { ideal: 1920 }, height: { ideal: 1440 } };

/** deviceId가 있으면 그 카메라(예: USB로 연결한 니콘 Zf), 없으면 전면 카메라 */
function constraints(deviceId: string | null): MediaStreamConstraints {
  return {
    video: deviceId ? { deviceId: { exact: deviceId }, ...SIZE } : { facingMode: "user", ...SIZE },
    audio: false,
  };
}

/** 화면에 보이는 카메라 문구 (언어별) */
export interface CameraMessages {
  /** 이름을 알 수 없는 카메라 (1부터 센다) */
  name: (n: number) => string;
  /** 카메라 화면이 멈춰 촬영할 수 없을 때 */
  frozen: string;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}

async function listCameras(text: CameraMessages): Promise<CameraDevice[]> {
  try {
    const all = await navigator.mediaDevices.enumerateDevices();
    return all
      .filter((d) => d.kind === "videoinput" && d.deviceId)
      .map((d, i) => ({ deviceId: d.deviceId, label: d.label || text.name(i + 1) }));
  } catch {
    return [];
  }
}

/**
 * 촬영 화면이 떠 있는 동안 카메라를 켠다. 화면이 사라지면 카메라와 wake lock을 정리한다.
 * getUserMedia를 쓸 수 없으면(HTTP 주소, 권한 거부, 카메라 없음) "file" 모드로 바뀐다.
 * deviceId로 고른 카메라가 빠져 있으면 기본 카메라로 연결한다.
 */
export function useCamera(deviceId: string | null, text: CameraMessages) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<CameraMode>("pending");
  // 값을 바꾸면 카메라를 다시 연결한다.
  const [session, setSession] = useState(0);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  /** 실제로 연결된 카메라 */
  const [activeId, setActiveId] = useState<string | null>(null);
  // 문구가 바뀌어도 카메라를 다시 연결하지 않도록 최신 값만 ref로 본다.
  const textRef = useRef(text);
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // 카메라를 꽂거나 빼면 목록을 새로 읽는다.
  useEffect(() => {
    const md = navigator.mediaDevices;
    if (!md?.addEventListener) return;
    const onChange = () => void listCameras(textRef.current).then(setDevices);
    md.addEventListener("devicechange", onChange);
    return () => md.removeEventListener("devicechange", onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const videoEl = videoRef.current;
    let wakeLock: WakeLockSentinel | null = null;
    let endedTrack: MediaStreamTrack | null = null;
    const onEnded = () => {
      if (!cancelled) setSession((n) => n + 1);
    };

    const requestWakeLock = async () => {
      if (wakeLock && !wakeLock.released) return;
      try {
        const lock = await navigator.wakeLock?.request("screen");
        if (cancelled) await lock?.release();
        else wakeLock = lock ?? null;
      } catch {
        wakeLock = null;
      }
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMode("file");
        return;
      }
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints(deviceId));
        } catch (err) {
          // 고른 카메라가 빠졌으면 기본 카메라로. 권한 거부는 그대로 실패 처리한다.
          if (!deviceId || (err instanceof DOMException && err.name === "NotAllowedError")) throw err;
          stream = await navigator.mediaDevices.getUserMedia(constraints(null));
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        // 카메라를 뽑거나 카메라가 스스로 꺼지면 다시 연결한다 (고른 카메라가 없으면 기본 카메라로).
        endedTrack = stream.getVideoTracks()[0] ?? null;
        endedTrack?.addEventListener("ended", onEnded);
        if (videoEl) {
          videoEl.srcObject = stream;
          await videoEl.play().catch(() => {});
        }
        if (cancelled) return;
        setMode("live");
        setActiveId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? null);
        // 권한을 받은 뒤에야 카메라 이름이 보인다.
        void listCameras(textRef.current).then((list) => {
          if (!cancelled) setDevices(list);
        });
        requestWakeLock();
      } catch {
        if (!cancelled) setMode("file");
      }
    })();

    // 다른 앱으로 갔다 오거나 화면이 잠기면 Safari가 카메라를 끊거나(ended) 멈춰(muted) 둔다.
    let recheck: ReturnType<typeof setTimeout> | undefined;
    const onVisibility = () => {
      if (document.hidden || !streamRef.current) return;
      const track = streamRef.current.getVideoTracks()[0];
      if (!track || track.readyState === "ended") {
        setSession((n) => n + 1);
        return;
      }
      videoEl?.play().catch(() => {});
      requestWakeLock(); // 화면이 가려지면 wake lock은 자동으로 풀린다
      clearTimeout(recheck);
      recheck = setTimeout(() => {
        const t = streamRef.current?.getVideoTracks()[0];
        if (!cancelled && (!t || t.muted || videoEl?.paused)) setSession((n) => n + 1);
      }, 1200);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      endedTrack?.removeEventListener("ended", onEnded);
      clearTimeout(recheck);
      document.removeEventListener("visibilitychange", onVisibility);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoEl) videoEl.srcObject = null;
      wakeLock?.release().catch(() => {});
      setMode("pending");
    };
  }, [session, deviceId]);

  /** 지금 화면을 미리보기와 같은 거울 모드로 찍는다. */
  const grabFrame = useCallback((): Shot => {
    const video = videoRef.current;
    const track = streamRef.current?.getVideoTracks()[0];
    if (!video || !video.videoWidth || !track || track.muted || track.readyState !== "live" || video.paused) {
      throw new Error(textRef.current.frozen);
    }
    return toShot(video, true);
  }, []);

  /** 같은 카메라로 다시 연결한다 (예: 빠졌던 카메라를 다시 꽂았을 때) */
  const restart = useCallback(() => setSession((n) => n + 1), []);

  /** 녹화에 쓸 카메라 스트림 */
  const getStream = useCallback(() => streamRef.current, []);

  return { videoRef, mode, grabFrame, getStream, devices, activeId, restart };
}
