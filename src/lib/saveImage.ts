export type SaveOutcome = { kind: "ok" | "bad" | "none"; message: string };

export type MediaKind = "image" | "video";

export const LONG_PRESS_HINT = "사진을 길게 눌러 사진 앱에 저장할 수 있어요.";

const NOUN: Record<MediaKind, string> = { image: "이미지", video: "동영상" };

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * 완성 사진(또는 영상)을 사진 앱에 저장한다.
 * iPad Safari는 공유 시트의 "이미지 저장"/"동영상 저장"이 사진 앱으로 가는 유일한 경로라서 Web Share를 먼저 쓴다.
 * 클릭 직후(사용자 활성화가 살아 있을 때) 호출해야 하므로 이 함수 앞에서 await하지 않는다.
 */
export async function saveImage(
  blob: Blob,
  fileName: string,
  objectUrl: string,
  kind: MediaKind = "image",
): Promise<SaveOutcome> {
  const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });

  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return { kind: "ok", message: `공유 시트에서 ${NOUN[kind]} 저장을 골랐다면 사진 앱에 저장됐어요.` };
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError" || name === "InvalidStateError") return { kind: "none", message: "" };
      const fallback = kind === "image" ? LONG_PRESS_HINT : "파일로 다운로드를 눌러 주세요.";
      return { kind: "bad", message: "공유 시트를 열지 못했어요. 다시 누르거나 " + fallback };
    }
  }

  // iOS에서 다운로드 링크는 사진 앱으로 가지 않으므로 길게 누르기를 안내한다.
  if (isIOS() && kind === "image") return { kind: "bad", message: LONG_PRESS_HINT };

  return downloadImage(fileName, objectUrl);
}

/**
 * 파일로 내려받는다. iPad Safari에서는 "다운로드" 폴더(파일 앱)에 들어간다.
 */
export function downloadImage(fileName: string, objectUrl: string): SaveOutcome {
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  a.rel = "noopener";
  document.body.append(a);
  a.click();
  a.remove();
  return {
    kind: "ok",
    message: isIOS() ? "다운로드했어요. 파일 앱의 다운로드 폴더에서 볼 수 있어요." : "다운로드를 시작했어요.",
  };
}

/** Blob을 바로 내려받는다. 링크 주소는 다운로드가 시작될 시간을 두고 정리한다. */
export function downloadBlob(blob: Blob, fileName: string): SaveOutcome {
  const url = URL.createObjectURL(blob);
  const outcome = downloadImage(fileName, url);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return outcome;
}
