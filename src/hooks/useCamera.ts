"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toShot, type Shot } from "@/lib/canvas";
import type { Rect } from "@/lib/frame";
import { measureVideo, similarRect } from "@/lib/letterbox";

/** live: 실시간 카메라 / file: 카메라 앱으로 한 장씩 / pending: 준비 중 / stalled: 연결됐지만 화면이 오지 않음 */
export type CameraMode = "pending" | "live" | "file" | "stalled";

/**
 * 요청할 화면 크기. 앞에서부터 시도한다.
 * 목록에서 고른 카메라(USB 카메라 등)는 먼저 카메라의 원래 해상도로 열어 본다 (NATIVE). 미리보기는 화면 크기에 맞춰 확대·축소된다.
 * USB 카메라(니콘 Zf 등)는 16:9만 내보내는 경우가 많고, Safari는 맞지 않는 크기를 요청하면
 * 카메라를 연 채로 화면을 한 장도 보내지 않을 때가 있어 16:9 → 카메라 기본값 순으로 낮춘다.
 */
const SIZES: MediaTrackConstraints[] = [
  { width: { ideal: 1920 }, height: { ideal: 1440 } },
  { width: { ideal: 1920 }, height: { ideal: 1080 } },
  {},
];

/** 실시간 카메라를 못 쓰는 이유. denied: 권한 거부(브라우저·기기 설정), unavailable: 그 밖의 이유 */
export type CameraFailure = "denied" | "unavailable";

/** 검은 띠를 다시 살펴보는 간격 (ms) */
const LETTERBOX_INTERVAL = 700;

/** 연결 뒤 첫 화면을 기다리는 시간 (ms). 넘으면 다음 크기로 다시 연결한다. */
export const FIRST_FRAME_TIMEOUT = 4000;
/** 카메라의 원래 해상도로 연다 (크기를 정하지 않고 열어 최대 해상도를 확인한 뒤 맞춘다). */
const NATIVE = "native";
/** 원래 해상도로 연 카메라는 첫 화면까지 조금 더 기다린다 (ms). USB 카메라는 켜지는 데 시간이 걸린다. */
const NATIVE_FIRST_FRAME_TIMEOUT = 10000;
/**
 * 마지막 시도에서는 안내를 띄운 뒤에도 카메라를 닫지 않고 이만큼 더 기다린다 (ms).
 * 아이패드에 연결한 니콘 Zf처럼 첫 화면까지 오래 걸리는 USB 카메라가 있어, 늦게라도 화면이 오면 바로 쓴다.
 */
const LATE_FRAME_TIMEOUT = 60000;

/** deviceId가 있으면 그 카메라(예: USB로 연결한 니콘 Zf), 없으면 전면 카메라 */
function constraints(deviceId: string | null, size: MediaTrackConstraints): MediaStreamConstraints {
  return {
    video: deviceId ? { deviceId: { exact: deviceId }, ...size } : { facingMode: "user", ...size },
    audio: false,
  };
}

/**
 * 비디오에 실제 화면이 들어올 때까지 기다린다. 시간 안에 오지 않으면 false.
 * play()의 Promise는 Safari·Chrome 모두 화면이 오지 않으면 끝나지 않을 수 있어 그것에 기대지 않는다.
 */
function waitForFrame(video: HTMLVideoElement, timeout: number, isCancelled: () => boolean): Promise<boolean> {
  return new Promise((resolve) => {
    const ready = () => video.videoWidth > 0 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    const events = ["loadeddata", "resize", "playing"] as const;
    function finish(ok: boolean) {
      clearInterval(poll);
      clearTimeout(timer);
      events.forEach((e) => video.removeEventListener(e, check));
      resolve(ok);
    }
    function check() {
      if (isCancelled()) finish(false);
      else if (ready()) finish(true);
    }
    events.forEach((e) => video.addEventListener(e, check));
    const poll = setInterval(check, 200);
    const timer = setTimeout(() => finish(ready()), timeout);
    check();
  });
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
  const [failure, setFailure] = useState<CameraFailure | null>(null);
  /** 검은 띠를 뺀 실제 화면 영역 (원본 픽셀)과 그때의 원본 크기. 띠가 없으면 null */
  const [crop, setCrop] = useState<{ rect: Rect; w: number; h: number } | null>(null);
  const cropRef = useRef<Rect | null>(null);
  /** ?debug=camera 진단 기록 (연결 시도·첫 화면까지 걸린 시간 등) */
  const logRef = useRef<string[]>([]);
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

    const t0 = performance.now();
    const log = (msg: string) => {
      logRef.current = [...logRef.current.slice(-19), `${Math.round(performance.now() - t0)}ms ${msg}`];
    };
    log(`연결 시작 (session ${session}, device ${deviceId ? deviceId.slice(0, 8) : "기본"})`);

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setFailure("unavailable");
        setMode("file");
        return;
      }
      // 고른 카메라가 빠졌으면 기본 카메라로. 권한 거부는 그대로 실패 처리한다.
      let useId = deviceId;
      const open = async (size: MediaTrackConstraints) => {
        try {
          return await navigator.mediaDevices.getUserMedia(constraints(useId, size));
        } catch (err) {
          if (!useId || (err instanceof DOMException && err.name === "NotAllowedError")) throw err;
          log(`고른 카메라 실패 (${err instanceof DOMException ? err.name : String(err)}) → 기본 카메라`);
          useId = null;
          return navigator.mediaDevices.getUserMedia(constraints(null, size));
        }
      };
      // 고른 카메라: 원래 해상도 → 4:3 → 16:9, 기본 카메라: 4:3 → 16:9 → 카메라 기본값
      const attempts: (MediaTrackConstraints | typeof NATIVE)[] = deviceId ? [NATIVE, SIZES[0], SIZES[1]] : SIZES;
      try {
        let stream: MediaStream | null = null;
        for (const [i, attempt] of attempts.entries()) {
          const last = i === attempts.length - 1;
          const native = attempt === NATIVE;
          log(`요청 ${native ? "원래 해상도" : JSON.stringify(attempt)}`);
          const next = await open(native ? {} : attempt);
          const track = next.getVideoTracks()[0];
          const cap = track?.getCapabilities?.();
          const maxW = cap?.width?.max;
          const maxH = cap?.height?.max;
          if (native && track && maxW && maxH) {
            // 크기를 정하지 않으면 브라우저 기본값(640×480 등)으로 열리므로 카메라 최대 해상도로 맞춘다.
            await track.applyConstraints({ width: { ideal: maxW }, height: { ideal: maxH } }).catch((e) => {
              log(`해상도 맞추기 실패 ${e instanceof DOMException ? e.name : String(e)}`);
            });
          }
          const st = track?.getSettings();
          log(
            `열림 ${track?.label ?? "?"} ${st?.width}x${st?.height} ${st?.frameRate ?? "?"}fps muted=${track?.muted}` +
              (maxW ? ` (최대 ${maxW}x${maxH})` : ""),
          );
          track?.addEventListener("mute", () => log("트랙 mute"));
          track?.addEventListener("unmute", () => log("트랙 unmute"));
          if (cancelled) {
            next.getTracks().forEach((t) => t.stop());
            return;
          }
          if (!videoEl) {
            stream = next;
            break;
          }
          videoEl.srcObject = next;
          // 재생 요청의 결과는 기다리지 않는다 (화면이 오면 waitForFrame이 알아챈다).
          videoEl.play().catch((e) => log(`play 거부 ${e instanceof DOMException ? e.name : String(e)}`));
          if (await waitForFrame(videoEl, native ? NATIVE_FIRST_FRAME_TIMEOUT : FIRST_FRAME_TIMEOUT, () => cancelled)) {
            log(`첫 화면 ${videoEl.videoWidth}x${videoEl.videoHeight}`);
            stream = next;
            break;
          }
          log(
            `화면 없음 (readyState ${videoEl.readyState}, paused ${videoEl.paused}, track ${track?.readyState} muted=${track?.muted})`,
          );
          if (last && !cancelled) {
            // 안내는 띄우되 카메라는 열어 둔 채 더 기다린다. 화면이 오면 그대로 이어서 쓴다.
            log("안내 표시, 계속 기다리는 중");
            setMode("stalled");
            void listCameras(textRef.current).then((list) => {
              if (!cancelled) setDevices(list);
            });
            if (await waitForFrame(videoEl, LATE_FRAME_TIMEOUT, () => cancelled)) {
              log(`늦게 첫 화면 ${videoEl.videoWidth}x${videoEl.videoHeight}`);
              stream = next;
              break;
            }
            log("끝내 화면 없음");
          }
          // 카메라는 열렸지만 화면이 오지 않는다: 닫고 다음 크기로 다시 연다.
          next.getTracks().forEach((t) => t.stop());
          videoEl.srcObject = null;
          if (cancelled) return;
        }
        if (!stream) {
          setMode("stalled");
          void listCameras(textRef.current).then((list) => {
            if (!cancelled) setDevices(list);
          });
          return;
        }
        streamRef.current = stream;
        // 카메라를 뽑거나 카메라가 스스로 꺼지면 다시 연결한다 (고른 카메라가 없으면 기본 카메라로).
        endedTrack = stream.getVideoTracks()[0] ?? null;
        endedTrack?.addEventListener("ended", onEnded);
        setMode("live");
        setActiveId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? null);
        // 권한을 받은 뒤에야 카메라 이름이 보인다.
        void listCameras(textRef.current).then((list) => {
          if (!cancelled) setDevices(list);
        });
        requestWakeLock();
      } catch (err) {
        if (cancelled) return;
        // 권한 거부는 브라우저(사이트 설정)나 기기 설정(아이패드 설정 → Chrome → 카메라)에서 막힌 경우다.
        const name = err instanceof DOMException ? err.name : "";
        log(`실패 ${name || String(err)}`);
        setFailure(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
        setMode("file");
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
      setFailure(null);
      cropRef.current = null;
      setCrop(null);
    };
  }, [session, deviceId]);

  // 카메라 화면 가장자리의 검은 띠를 찾아 둔다. 두 번 연속 같은 결과일 때만 바꿔 화면이 들썩이지 않게 한다.
  useEffect(() => {
    if (mode !== "live") return;
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    let candidate: Rect | null | undefined;
    const check = () => {
      if (document.hidden || video.paused) return;
      let found: Rect | null;
      try {
        found = measureVideo(video, canvas);
      } catch {
        return;
      }
      const { videoWidth: w, videoHeight: h } = video;
      if (candidate !== undefined && similarRect(candidate, found, w, h) && !similarRect(cropRef.current, found, w, h)) {
        cropRef.current = found;
        setCrop(found ? { rect: found, w, h } : null);
      }
      candidate = found;
    };
    check();
    const timer = setInterval(check, LETTERBOX_INTERVAL);
    return () => {
      clearInterval(timer);
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [mode, session]);

  /** 지금 화면을 미리보기와 같은 거울 모드로 찍는다. */
  const grabFrame = useCallback((): Shot => {
    const video = videoRef.current;
    const track = streamRef.current?.getVideoTracks()[0];
    if (!video || !video.videoWidth || !track || track.muted || track.readyState !== "live" || video.paused) {
      throw new Error(textRef.current.frozen);
    }
    return toShot(video, true, cropRef.current);
  }, []);

  /** 같은 카메라로 다시 연결한다 (예: 빠졌던 카메라를 다시 꽂았을 때) */
  const restart = useCallback(() => setSession((n) => n + 1), []);

  /** 녹화에 쓸 카메라 스트림 */
  const getStream = useCallback(() => streamRef.current, []);

  /** 진단 기록 (?debug=camera) */
  const getLog = useCallback(() => logRef.current, []);

  /** 녹화 중에도 최신 값을 읽도록 함수로 준다. */
  const getCrop = useCallback(() => cropRef.current, []);

  return { videoRef, mode, failure, grabFrame, getStream, getCrop, getLog, crop, devices, activeId, restart };
}
