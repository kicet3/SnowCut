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

export class BgRemoverError extends Error {}

/** 응답 본문에서 사용자에게 보여 줄 문구를 꺼낸다 (FastAPI는 {"detail": "..."} 형식). */
export function errorMessage(status: number, body: string): string {
  try {
    const detail = (JSON.parse(body) as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail) return detail;
  } catch {}
  if (status === 413) return "이미지가 너무 커요. 더 작은 이미지로 해 주세요.";
  if (status >= 500) return "누끼 서버에서 오류가 났어요. 잠시 뒤 다시 해 주세요.";
  return `누끼를 따지 못했어요 (${status}).`;
}

/** points: 이미지 픽셀 좌표 [[x, y], ...] (1개 이상). 배경이 투명한 PNG를 돌려준다. */
export async function removeBackground(image: Blob, points: [number, number][], signal?: AbortSignal): Promise<Blob> {
  if (!BG_REMOVER_URL) throw new BgRemoverError("누끼 서버가 설정되지 않았어요.");
  if (!points.length) throw new BgRemoverError("캐릭터 위를 한 번 이상 눌러 주세요.");
  const form = new FormData();
  form.append("image", image, "character.png");
  form.append("points", JSON.stringify(points));
  let res: Response;
  try {
    res = await fetch(`${BG_REMOVER_URL}/background-removal/remove`, { method: "POST", body: form, signal });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new BgRemoverError("누끼 서버에 연결하지 못했어요. 서버가 켜져 있는지 확인해 주세요.");
  }
  if (!res.ok) throw new BgRemoverError(errorMessage(res.status, await res.text().catch(() => "")));
  const blob = await res.blob();
  if (!blob.type.startsWith("image/")) throw new BgRemoverError("누끼 서버가 이미지가 아닌 응답을 보냈어요.");
  return blob;
}
