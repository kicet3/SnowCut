import { coverCrop, type Drawable, type Shot } from "../canvas";
import type { Rect } from "../frame";
import { filterDef, isIdentityFilter, type FilterId } from "./presets";
import { getLookRenderer } from "./renderer";

/**
 * 촬영본 중 칸(cell)에 보이는 부분만 칸 크기로 필터를 입혀 돌려준다. 프레임·문구는 건드리지 않는다.
 * 돌려준 캔버스는 공용 렌더러의 것이라 다음 호출 전에 (같은 작업 안에서) 바로 그려야 한다.
 * 처리할 수 없으면 원본을 돌려준다 (drawCover가 같은 영역을 잘라 그린다).
 */
export function filterShot(shot: Shot, filter: FilterId, seed: number, cell: Rect): Drawable {
  if (isIdentityFilter(filterDef(filter))) return shot;
  const renderer = getLookRenderer();
  if (!renderer) return shot;
  const outW = Math.max(1, Math.round(cell.w));
  const outH = Math.max(1, Math.round(cell.h));
  const ok = renderer.render(shot, outW, outH, {
    filter,
    seed,
    crop: coverCrop(shot.width, shot.height, { w: outW, h: outH }),
  });
  return ok ? renderer.canvas : shot;
}
