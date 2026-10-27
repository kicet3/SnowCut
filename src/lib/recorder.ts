/** 촬영하는 동안의 화면을 영상으로 남긴다. iPad Safari는 MP4(H.264), 그 밖의 브라우저는 대개 WebM이다. */

const TYPES = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];

export function pickVideoType(isSupported: (t: string) => boolean): string | null {
  return TYPES.find((t) => isSupported(t)) ?? null;
}

export function videoExtension(type: string): "mp4" | "webm" {
  return type.startsWith("video/mp4") ? "mp4" : "webm";
}

export interface Recording {
  /** 녹화를 끝내고 영상을 돌려준다. 녹화가 비었거나 실패하면 null. */
  stop(): Promise<Blob | null>;
  /** 녹화를 버린다. */
  cancel(): void;
}

/** onEnd: 녹화가 끝나거나 버려진 뒤 한 번 불린다 (녹화용으로 만든 스트림 정리). */
export function startRecording(stream: MediaStream, onEnd?: () => void): Recording | null {
  if (typeof MediaRecorder === "undefined") {
    onEnd?.();
    return null;
  }
  const type = pickVideoType((t) => MediaRecorder.isTypeSupported(t));
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), videoBitsPerSecond: 6_000_000 });
    recorder.start(1000);
  } catch (err) {
    console.warn("영상 녹화를 시작하지 못했어요", err);
    onEnd?.();
    return null;
  }
  const chunks: Blob[] = [];
  recorder.addEventListener("dataavailable", (e) => {
    if (e.data.size) chunks.push(e.data);
  });
  const finished = new Promise<void>((resolve) => {
    recorder.addEventListener("stop", () => resolve(), { once: true });
    recorder.addEventListener("error", () => resolve(), { once: true });
  }).then(() => onEnd?.());
  let cancelled = false;
  const end = () => {
    if (recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {}
    }
  };
  return {
    async stop() {
      end();
      await finished;
      if (cancelled || !chunks.length) return null;
      return new Blob(chunks, { type: recorder.mimeType || type || "video/mp4" });
    },
    cancel() {
      cancelled = true;
      chunks.length = 0;
      end();
    },
  };
}

/** 녹화 영상 긴 변 */
const RECORD_LONG_EDGE = 1280;

type StreamCanvas = HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream };

/**
 * 카메라 화면을 미리보기처럼 좌우 반전해서 녹화한다. 크기는 시작할 때 정해 두고, 도중에 카메라 비율이 바뀌면
 * 가운데를 잘라 맞춘다 (MediaRecorder는 녹화 중 크기 변경을 잘 처리하지 못한다).
 * 캔버스 녹화를 못 하는 브라우저에서는 카메라 스트림을 그대로(반전 없이) 녹화한다.
 */
export function recordCamera(video: HTMLVideoElement, camera: MediaStream | null, mirror = true): Recording | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const canvas = document.createElement("canvas") as StreamCanvas;
  const ctx = canvas.getContext("2d");
  if (!vw || !vh || !ctx || typeof canvas.captureStream !== "function") {
    return camera ? startRecording(camera) : null;
  }
  const s = Math.min(1, RECORD_LONG_EDGE / Math.max(vw, vh));
  // H.264 인코더는 짝수 크기를 요구한다.
  canvas.width = Math.round((vw * s) / 2) * 2;
  canvas.height = Math.round((vh * s) / 2) * 2;

  let frame = 0;
  const draw = () => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w && h) {
      const k = Math.max(canvas.width / w, canvas.height / h);
      ctx.setTransform(mirror ? -1 : 1, 0, 0, 1, mirror ? canvas.width : 0, 0);
      ctx.drawImage(video, (canvas.width - w * k) / 2, (canvas.height - h * k) / 2, w * k, h * k);
    }
    frame = requestAnimationFrame(draw);
  };
  draw();

  let stream: MediaStream;
  try {
    stream = canvas.captureStream(30);
  } catch {
    cancelAnimationFrame(frame);
    return camera ? startRecording(camera) : null;
  }
  return startRecording(stream, () => {
    cancelAnimationFrame(frame);
    stream.getTracks().forEach((t) => t.stop());
    canvas.width = 0;
    canvas.height = 0;
  });
}
