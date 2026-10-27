import { afterEach, describe, expect, it, vi } from "vitest";
import { BgRemoverError, responseError } from "./bgRemover";

describe("누끼 서버 오류 응답", () => {
  it("FastAPI의 detail을 그대로 담는다", () => {
    const e = responseError(400, JSON.stringify({ detail: "최소 1개 이상의 좌표가 필요합니다" }));
    expect(e).toBeInstanceOf(BgRemoverError);
    expect(e.code).toBe("detail");
    expect(e.detail).toBe("최소 1개 이상의 좌표가 필요합니다");
    expect(e.message).toBe("최소 1개 이상의 좌표가 필요합니다");
  });
  it("본문이 JSON이 아니면 상태 코드로 고른다", () => {
    expect(responseError(502, "<html>").code).toBe("server");
    expect(responseError(413, "").code).toBe("tooLarge");
    const e = responseError(404, "");
    expect(e.code).toBe("status");
    expect(e.status).toBe(404);
  });
  it("detail이 문자열이 아니면 무시한다", () => {
    expect(responseError(422, JSON.stringify({ detail: [{ msg: "x" }] })).code).toBe("status");
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
    await expect(removeBackground(new Blob(), [[1, 1]])).rejects.toMatchObject({ code: "notConfigured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("좌표가 없으면 요청하지 않는다", async () => {
    const { removeBackground } = await load("/bg-remover");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(removeBackground(new Blob(), [])).rejects.toMatchObject({ code: "noPoints" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("연결 실패·오류 응답·이미지가 아닌 응답을 코드로 알린다", async () => {
    const { removeBackground } = await load("/bg-remover");
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(removeBackground(new Blob(), [[1, 1]])).rejects.toMatchObject({ code: "network" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: "이미지 파일을 읽을 수 없습니다" }), { status: 400 })));
    await expect(removeBackground(new Blob(), [[1, 1]])).rejects.toMatchObject({ code: "detail", detail: "이미지 파일을 읽을 수 없습니다" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("oops", { status: 503 })));
    await expect(removeBackground(new Blob(), [[1, 1]])).rejects.toMatchObject({ code: "server", status: 503 });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200, headers: { "content-type": "application/json" } })));
    await expect(removeBackground(new Blob(), [[1, 1]])).rejects.toMatchObject({ code: "notImage" });
  });

  it("취소하면 원래 AbortError를 그대로 던진다", async () => {
    const { removeBackground, BgRemoverError } = await load("/bg-remover");
    const abort = new AbortController();
    vi.stubGlobal("fetch", vi.fn(async () => {
      abort.abort();
      throw new DOMException("aborted", "AbortError");
    }));
    const err = await removeBackground(new Blob(), [[1, 1]], abort.signal).catch((e: unknown) => e);
    expect(err).not.toBeInstanceOf(BgRemoverError);
  });
});
