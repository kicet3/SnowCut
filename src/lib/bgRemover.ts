/**
 * 누끼(배경 제거) 서버 연동. Background-Remover(https://github.com/Daek-You/Background-Remover, SAM 2.1)를
 * 따로 띄워 두고 그 API를 부른다. 이미지와 피사체 위를 누른 좌표를 보내면 배경이 투명한 PNG가 돌아온다.
 *
 *   NEXT_PUBLIC_BG_REMOVER_URL=http://localhost:5000   (개발: 서버의 CORS_ORIGINS에 이 앱 주소를 넣는다)
 *   NEXT_PUBLIC_BG_REMOVER_URL=/bg-remover             (server.mjs가 BG_REMOVER_URL로 대신 전달)
 *
 * 값이 없으면 누끼 기능을 끄고, 이미 배경이 투명한 PNG를 그대로 쓰는 것만 허용한다.
 */
export const BG_REMOVER_URL = (process.env.NEXT_PUBLIC_BG_REMOVER_URL ?? "").replace(/\/+$/, "");

/**
 * 실패 이유. 화면에서 이 코드를 현재 언어 문구로 바꿔 보여 준다.
 * detail은 서버(FastAPI)가 보낸 문구라 그대로 보여 주고, status는 그 밖의 오류 응답 상태 코드다.
 */
export type BgRemoverErrorCode =
  | "notConfigured"
  | "noPoints"
  | "network"
  | "tooLarge"
  | "server"
  | "status"
  | "notImage"
  | "detail"
  | "prepare"
  | "notRemoved"
  | "noSubject";

export class BgRemoverError extends Error {
  readonly code: BgRemoverErrorCode;
  readonly detail?: string;
  readonly status?: number;
  constructor(code: BgRemoverErrorCode, extra: { detail?: string; status?: number } = {}) {
    super(extra.detail ?? (extra.status ? `${code} (${extra.status})` : code));
    this.name = "BgRemoverError";
    this.code = code;
    this.detail = extra.detail;
    this.status = extra.status;
  }
}

/** 오류 응답을 BgRemoverError로 바꾼다. 본문에 FastAPI의 {"detail": "..."}가 있으면 그 문구를 담는다. */
export function responseError(status: number, body: string): BgRemoverError {
  try {
    const detail = (JSON.parse(body) as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail) return new BgRemoverError("detail", { detail, status });
  } catch {}
  if (status === 413) return new BgRemoverError("tooLarge", { status });
  if (status >= 500) return new BgRemoverError("server", { status });
  return new BgRemoverError("status", { status });
}

/** points: 이미지 픽셀 좌표 [[x, y], ...] (1개 이상). 배경이 투명한 PNG를 돌려준다. */
export async function removeBackground(image: Blob, points: [number, number][], signal?: AbortSignal): Promise<Blob> {
  if (!BG_REMOVER_URL) throw new BgRemoverError("notConfigured");
  if (!points.length) throw new BgRemoverError("noPoints");
  const form = new FormData();
  form.append("image", image, "character.png");
  form.append("points", JSON.stringify(points));
  let res: Response;
  try {
    res = await fetch(`${BG_REMOVER_URL}/background-removal/remove`, { method: "POST", body: form, signal });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new BgRemoverError("network");
  }
  if (!res.ok) throw responseError(res.status, await res.text().catch(() => ""));
  const blob = await res.blob();
  if (!blob.type.startsWith("image/")) throw new BgRemoverError("notImage");
  return blob;
}
