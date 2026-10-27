import { afterEach, describe, expect, it, vi } from "vitest";
import { errorMessage } from "./bgRemover";

describe("누끼 서버 오류 문구", () => {
  it("FastAPI의 detail을 그대로 보여 준다", () => {
    expect(errorMessage(400, JSON.stringify({ detail: "최소 1개 이상의 좌표가 필요합니다" }))).toBe("최소 1개 이상의 좌표가 필요합니다");
  });
  it("본문이 JSON이 아니면 상태 코드로 고른다", () => {
    expect(errorMessage(502, "<html>")).toMatch(/오류/);
    expect(errorMessage(413, "")).toMatch(/너무 커요/);
    expect(errorMessage(404, "")).toContain("404");
  });
});

describe("배경 제거 요청", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function load(url: string) {
    vi.stubEnv("NEXT_PUBLIC_BG_REMOVER_URL", url);
    vi.resetModules();
    return import("./bgRemover");
  }

  it("이미지와 좌표 JSON을 /background-removal/remove로 보낸다", async () => {
    const { removeBackground } = await load("http://localhost:5000/");
    const fetchMock = vi.fn(async () => new Response(new Blob(["png"], { type: "image/png" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const out = await removeBackground(new Blob(["x"], { type: "image/png" }), [[10, 20], [30, 40]]);
    expect(out.type).toBe("image/png");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost:5000/background-removal/remove");
    const form = init.body as FormData;
    expect(form.get("points")).toBe("[[10,20],[30,40]]");
    expect(form.get("image")).toBeInstanceOf(Blob);
  });

  it("서버 주소가 없으면 요청하지 않는다", async () => {
    const { removeBackground, BgRemoverError } = await load("");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(removeBackground(new Blob(), [[1, 1]])).rejects.toBeInstanceOf(BgRemoverError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("연결 실패와 오류 응답을 사용자 문구로 바꾼다", async () => {
    const { removeBackground } = await load("/bg-remover");
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(removeBackground(new Blob(), [[1, 1]])).rejects.toThrow(/연결하지 못했어요/);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: "이미지 파일을 읽을 수 없습니다" }), { status: 400 })));
    await expect(removeBackground(new Blob(), [[1, 1]])).rejects.toThrow("이미지 파일을 읽을 수 없습니다");
  });
});
