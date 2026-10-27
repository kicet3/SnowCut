import { describe, expect, it } from "vitest";
import { FILTERS, IDENTITY, applyAffine, filterMatrix, isIdentityFilter, opMatrix } from "./presets";

const close = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 5));

describe("필터 행렬", () => {
  it("원본은 항등이다", () => {
    expect(isIdentityFilter(FILTERS[0])).toBe(true);
    close(filterMatrix([]), IDENTITY);
  });

  it("brightness·contrast는 CSS 정의와 같다", () => {
    close(applyAffine(opMatrix(["brightness", 1.5]), [0.2, 0.4, 0.6]), [0.3, 0.6, 0.9]);
    // contrast(a): c' = a·c + 0.5(1 − a)
    close(applyAffine(opMatrix(["contrast", 2]), [0.25, 0.5, 0.75]), [0, 0.5, 1]);
  });

  it("grayscale(1)은 세 채널을 같은 밝기로 만든다", () => {
    const [r, g, b] = applyAffine(opMatrix(["grayscale", 1]), [1, 0, 0]);
    expect(r).toBeCloseTo(0.2126);
    expect(g).toBeCloseTo(0.2126);
    expect(b).toBeCloseTo(0.2126);
  });

  it("saturate(1)과 hue-rotate(0)은 항등이다", () => {
    close(opMatrix(["saturate", 1]), IDENTITY);
    close(opMatrix(["hueRotate", 0]), IDENTITY);
  });

  it("함수는 왼쪽부터 차례로 적용된다", () => {
    // brightness(2) 다음 contrast(0.5): 0.25 → 0.5 → 0.5
    // 반대 순서라면 0.25 → 0.375 → 0.75
    const [r] = applyAffine(filterMatrix([["brightness", 2], ["contrast", 0.5]]), [0.25, 0.25, 0.25]);
    expect(r).toBeCloseTo(0.5);
  });

  it("흑백 필터는 회색을 만든다", () => {
    const mono = FILTERS.find((f) => f.id === "mono")!;
    const [r, g, b] = applyAffine(filterMatrix(mono.ops), [0.8, 0.3, 0.2]);
    expect(r).toBeCloseTo(g);
    expect(g).toBeCloseTo(b);
  });

  it("필터 id와 이름이 겹치지 않는다", () => {
    expect(new Set(FILTERS.map((f) => f.id)).size).toBe(FILTERS.length);
    expect(new Set(FILTERS.map((f) => f.name)).size).toBe(FILTERS.length);
  });
});
