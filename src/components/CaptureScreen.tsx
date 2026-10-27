"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { useCamera } from "@/hooks/useCamera";
import { freeShot, shotFromFile, type Shot } from "@/lib/canvas";
import { photoAspect, type LayoutKey } from "@/lib/frame";
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
  // 노트북에 USB로 연결한 카메라(니콘 Zf 등 UVC 웹캠)를 고를 수 있다. 고른 카메라는 기억해 둔다.
  const [cameraId, setCameraId] = useState<string | null>(savedCamera);
  const { videoRef, mode, grabFrame, getStream, devices, activeId, restart } = useCamera(cameraId);
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
    const rec = recordCamera(video, getStream());
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
        setError(err instanceof Error ? err.message : "촬영하지 못했어요.");
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
      if (mountedRef.current) setError("사진을 불러오지 못했어요. 다시 찍어 주세요.");
    } finally {
      if (mountedRef.current) setDecoding(false);
    }
  };

  const shootLabel = running
    ? "중지"
    : mode === "file"
      ? `${nextEmpty + 1}번째 사진 찍기`
      : remaining === total
        ? "촬영 시작"
        : `남은 ${remaining}장 촬영`;

  return (
    <section id="capture" className="screen">
      <div className="bar">
        <div>
          <button id="backBtn" className="btn ghost" type="button" disabled={running || decoding} onClick={onBack}>
            {isRetake ? "← 결과로 돌아가기" : "← 처음으로"}
          </button>
        </div>
        <div className="counter">{nextEmpty === -1 ? "촬영 완료" : `${nextEmpty + 1} / ${total}`}</div>
        <div>
          {devices.length > 1 && (
            <label className="camera-select">
              <span className="sr-only">카메라</span>
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
          <video ref={videoRef} playsInline muted autoPlay />
          {recording && (
            <div className="rec-badge" aria-label="녹화 중">
              REC
            </div>
          )}
          <div className="corner-marks" />
          {mode === "pending" && (
            <div className="vf-message">
              <strong>카메라 준비 중…</strong>
            </div>
          )}
          {mode === "file" && (
            <div className="vf-message">
              <strong>실시간 카메라를 쓸 수 없어요</strong>
              <span>버튼을 누르면 iPad 카메라가 열립니다. 한 장씩 찍어 주세요.</span>
              <span className="fine">HTTPS 주소에서 카메라 권한을 허용하면 실시간 촬영이 됩니다.</span>
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
          <ShotThumb key={i} shot={shot} index={i} aspect={photoAspect(layout, i)} highlighted={i === nextEmpty} label={`${i + 1}번 칸`} />
        ))}
      </div>

      <div className="controls">
        {error && <p className="error">{error}</p>}
        <button
          id="shootBtn"
          className={`btn big${running ? "" : " primary"}`}
          type="button"
          disabled={mode === "pending" || decoding}
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
