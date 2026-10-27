"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useI18n } from "@/i18n/I18nProvider";
import { freeShot, shotFromFile, type Shot } from "@/lib/canvas";
import { photoAspect, type LayoutKey } from "@/lib/frame";
import { coverTransform } from "@/lib/letterbox";
import { recordCamera, type Recording } from "@/lib/recorder";
import { playShutter, unlockSound } from "@/lib/sound";
import { ShotThumb } from "./ShotThumb";

interface Props {
  layout: LayoutKey;
  timer: number;
  shots: (Shot | null)[];
  isRetake: boolean;
  onShot: (index: number, shot: Shot) => void;
  /** 네 컷을 처음부터 이어 찍은 동안의 녹화 영상 */
  onVideo: (video: Blob) => void;
  onBack: () => void;
  onComplete: () => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const CAMERA_KEY = "snowcut.camera";

function savedCamera(): string | null {
  try {
    return localStorage.getItem(CAMERA_KEY);
  } catch {
    return null;
  }
}

export function CaptureScreen(props: Props) {
  const { layout, timer, shots, isRetake, onShot, onVideo, onBack, onComplete } = props;
  const { m } = useI18n();
  const t = m.capture;
  // 노트북에 USB로 연결한 카메라(니콘 Zf 등 UVC 웹캠)를 고를 수 있다. 고른 카메라는 기억해 둔다.
  const [cameraId, setCameraId] = useState<string | null>(savedCamera);
  const { videoRef, mode, failure, grabFrame, getStream, getCrop, crop, devices, activeId, restart } = useCamera(cameraId, t.camera);
  // 미리보기에서 카메라 화면의 검은 띠를 가리도록 비디오를 키운다. 그러려면 비디오 요소 크기를 알아야 한다.
  const [viewSize, setViewSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setViewSize((v) => (v.w === width && v.h === height ? v : { w: width, h: height }));
    });
    ro.observe(video);
    return () => ro.disconnect();
  }, [videoRef]);
  const videoTransform = coverTransform(viewSize, { w: crop?.w ?? 0, h: crop?.h ?? 0 }, crop?.rect ?? null, true);
  const recordingRef = useRef<Recording | null>(null);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [error, setError] = useState("");
  // 카메라 앱에서 고른 사진을 읽는 중. 그동안 뒤로 가기·촬영을 막는다.
  const [decoding, setDecoding] = useState(false);
  const mountedRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 진행 중인 촬영 순서를 구분한다. 값이 바뀌면 이전 순서는 다음 대기에서 멈춘다.
  const runIdRef = useRef(0);
  const shotsRef = useRef(shots);
  useEffect(() => {
    shotsRef.current = shots;
  }, [shots]);

  const total = shots.length;
  // 미리보기는 다음에 찍을 칸의 비율로 잘라 보여 준다 (큰 1컷 + 3컷처럼 칸마다 비율이 다를 수 있다).
  // 다 찍은 뒤에는 마지막으로 찍은 칸 비율을 유지해 화면이 튀지 않게 한다.
  const [lastIndex, setLastIndex] = useState(0);
  const pending = shots.findIndex((s) => !s);
  const aspect = photoAspect(layout, pending === -1 ? lastIndex : pending);
  const nextEmpty = shots.findIndex((s) => !s);
  const remaining = shots.filter((s) => !s).length;

  // ref와 state setter만 쓰므로 한 번 만들어 두고 visibilitychange 핸들러에서도 쓴다.
  const discardRecording = useCallback(() => {
    recordingRef.current?.cancel();
    recordingRef.current = null;
    setRecording(false);
  }, []);

  const cancelRun = useCallback(() => {
    runIdRef.current += 1;
    setRunning(false);
    setCountdown(null);
    discardRecording();
  }, [discardRecording]);

  /** 미리보기와 같은 거울 모드로 카메라 화면을 녹화한다. */
  const beginRecording = () => {
    discardRecording();
    const video = videoRef.current;
    if (!video) return;
    const rec = recordCamera(video, getStream(), true, getCrop);
    recordingRef.current = rec;
    setRecording(!!rec);
  };

  // 고른 카메라가 목록에 새로 나타나면(다시 꽂음) 그 카메라로 돌아간다. 촬영 중에는 바꾸지 않는다.
  // 목록에 계속 있는데 연결이 안 되는 경우(다른 앱이 사용 중 등)에 재연결을 반복하지 않도록 "새로 나타날 때"만 본다.
  const seenCameraRef = useRef(false);
  useEffect(() => {
    const present = !!cameraId && devices.some((d) => d.deviceId === cameraId);
    const appeared = present && !seenCameraRef.current;
    seenCameraRef.current = present;
    if (appeared && !running && activeId && cameraId !== activeId) restart();
  }, [devices, cameraId, activeId, running, restart]);

  const onCamera = (id: string) => {
    // 이미 고른 카메라인데 다른 카메라로 대신 연결돼 있으면(빠졌다 다시 꽂음) 다시 연결한다.
    if (id === cameraId) {
      if (id !== activeId) restart();
    } else {
      setCameraId(id);
    }
    try {
      localStorage.setItem(CAMERA_KEY, id);
    } catch {}
  };

  const finishRecording = () => {
    const rec = recordingRef.current;
    recordingRef.current = null;
    setRecording(false);
    if (!rec) return;
    // 화면이 바뀐 뒤에 끝나도 Booth가 촬영 회차를 확인해서 붙인다.
    void rec.stop().then((blob) => {
      if (blob) onVideo(blob);
    });
  };

  // 화면을 떠나거나 앱이 백그라운드로 가면 촬영을 멈춘다.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) cancelRun();
    };
    document.addEventListener("visibilitychange", onVisibility);
    mountedRef.current = true;
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      runIdRef.current += 1;
      mountedRef.current = false;
      recordingRef.current?.cancel();
      recordingRef.current = null;
    };
  }, [cancelRun]);

  // 촬영 순서 도중 카메라가 다시 연결되는지 확인하기 위한 최신 값.
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const runSequence = async () => {
    const id = ++runIdRef.current;
    // 다른 순서가 시작됐거나 카메라가 끊겼으면 멈춘다.
    const isCurrent = () => {
      if (id !== runIdRef.current) return false;
      if (modeRef.current !== "live") {
        cancelRun();
        return false;
      }
      return true;
    };
    setRunning(true);
    setError("");
    // 촬영 결과가 부모 상태에 반영되기 전에도 다음 칸을 알 수 있도록 지역 사본을 쓴다.
    const filled = shotsRef.current.map(Boolean);
    // 네 컷을 처음부터 찍을 때만 녹화한다. 한 컷 다시 찍기는 처음 영상을 그대로 둔다.
    if (!filled.some(Boolean)) beginRecording();

    for (let i = filled.indexOf(false); i !== -1; i = filled.indexOf(false)) {
      for (let s = timer; s > 0; s--) {
        setCountdown(s);
        await sleep(1000);
        if (!isCurrent()) return;
      }
      setCountdown(null);
      try {
        const shot = grabFrame();
        playShutter();
        setLastIndex(i);
        setFlashKey((k) => k + 1);
        onShot(i, shot);
        filled[i] = true;
      } catch (err) {
        // 화면 멈춤 안내만 그대로 보여 주고, 그 밖의 내부 오류는 번역된 일반 문구로 바꾼다.
        setError(err instanceof Error && err.message === t.camera.frozen ? err.message : t.errors.shotFailed);
        setRunning(false);
        discardRecording();
        return;
      }
      if (filled.includes(false)) {
        await sleep(900);
        if (!isCurrent()) return;
      }
    }

    // 마지막 컷에서 바로 녹화를 끝낸다. 결과로 넘어가기 전 대기 중에 취소돼도 영상은 남는다.
    finishRecording();
    await sleep(450);
    if (!isCurrent()) return;
    setRunning(false);
    onComplete();
  };

  const onShootClick = () => {
    unlockSound();
    if (running) {
      cancelRun();
      return;
    }
    if (mode === "live") void runSequence();
    else if (mode === "file") fileInputRef.current?.click();
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const index = shotsRef.current.findIndex((s) => !s);
    if (!file || index === -1) return;
    setDecoding(true);
    try {
      const shot = await shotFromFile(file);
      // 읽는 사이 화면을 떠났다면 결과를 버린다.
      if (!mountedRef.current || shotsRef.current[index]) {
        freeShot(shot);
        return;
      }
      playShutter();
      setLastIndex(index);
      setFlashKey((k) => k + 1);
      setError("");
      onShot(index, shot);
      if (shotsRef.current.filter((s) => !s).length <= 1) onComplete();
    } catch {
      if (mountedRef.current) setError(t.errors.fileFailed);
    } finally {
      if (mountedRef.current) setDecoding(false);
    }
  };

  const counterText = nextEmpty === -1 ? t.done : t.progress(nextEmpty + 1, total);

  const shootLabel = running
    ? t.shoot.stop
    : mode === "file"
      ? t.shoot.file(nextEmpty + 1)
      : remaining === total
        ? t.shoot.start
        : t.shoot.remaining(remaining);

  return (
    <section id="capture" className="screen" style={{ "--ratio": aspect } as CSSProperties}>
      <div className="bar">
        <div>
          <button id="backBtn" className="btn ghost" type="button" disabled={running || decoding} onClick={onBack}>
            {isRetake ? t.backToResult : t.back}
          </button>
        </div>
        <div className="counter">{counterText}</div>
        <div>
          {devices.length > 1 && (
            <label className="camera-select">
              <span className="sr-only">{t.cameraSelect}</span>
              <select
                id="cameraSelect"
                value={activeId ?? cameraId ?? ""}
                disabled={running || decoding}
                onChange={(e) => onCamera(e.target.value)}
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="stage">
        <div className="viewfinder" style={{ "--ratio": aspect } as CSSProperties}>
          <video ref={videoRef} playsInline muted autoPlay style={{ transform: videoTransform }} />
          {/* 아이패드에서는 위 줄 대신 화면 오른쪽 위에 보인다 (globals.css) */}
          <div className="vf-counter" aria-hidden>
            {counterText}
          </div>
          {recording && (
            <div className="rec-badge" aria-label={t.recording}>
              REC
            </div>
          )}
          <div className="corner-marks" />
          {mode === "pending" && (
            <div className="vf-message">
              <strong>{t.preparing}</strong>
            </div>
          )}
          {mode === "stalled" && (
            <div className="vf-message">
              <strong>{t.stalled.title}</strong>
              <span>{t.stalled.body}</span>
              <button className="btn" type="button" onClick={restart}>
                {t.stalled.retry}
              </button>
            </div>
          )}
          {mode === "file" && (
            <div className="vf-message">
              <strong>{t.fileMode.title}</strong>
              <span>{t.fileMode.body}</span>
              <span className="fine">{failure === "denied" ? t.fileMode.denied : t.fileMode.fine}</span>
            </div>
          )}
          {countdown !== null && (
            <div key={countdown} className="countdown tick" aria-live="assertive">
              {countdown}
            </div>
          )}
        </div>
      </div>

      <div className="thumbs">
        {shots.map((shot, i) => (
          <ShotThumb key={i} shot={shot} index={i} aspect={photoAspect(layout, i)} highlighted={i === nextEmpty} label={t.slot(i + 1)} />
        ))}
      </div>

      <div className={`controls${mode === "live" && !running ? " idle" : ""}`}>
        {error && <p className="error">{error}</p>}
        <button
          id="shootBtn"
          className={`btn big${running ? "" : " primary"}`}
          type="button"
          disabled={mode === "pending" || mode === "stalled" || decoding}
          onPointerDown={unlockSound}
          onClick={onShootClick}
        >
          <span className="dot" />
          <span id="shootLabel">{shootLabel}</span>
        </button>
        <input ref={fileInputRef} id="fileInput" type="file" accept="image/*" capture="user" hidden onChange={onFile} />
      </div>

      {flashKey > 0 && <div key={flashKey} className="flash on" />}
    </section>
  );
}
