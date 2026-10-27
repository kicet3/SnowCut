import type { Shot } from "./canvas";
import type { Character } from "./character";
import { LAYOUTS, type LayoutKey } from "./frame";
import { DEFAULT_FRAME, type FrameId } from "./frames";
import { DEFAULT_FILTER, type FilterId } from "./look/presets";

export type Screen = "start" | "capture" | "result";

export interface BoothState {
  screen: Screen;
  layout: LayoutKey;
  timer: number;
  frame: FrameId;
  showDate: boolean;
  /** 사진 아래 문구 (기본은 비어 있음) */
  caption: string;
  shots: (Shot | null)[];
  /** 다시 찍기를 취소하면 되돌릴 원래 사진 */
  pendingRetake: { index: number; shot: Shot } | null;
  /** 촬영본이 바뀔 때마다 증가 (합성 이미지 갱신 기준) */
  revision: number;
  capturedAt: Date;
  /** 사진 칸에만 입히는 색 필터. 다 찍은 뒤 결과 화면에서 고른다. */
  filter: FilterId;
  /** 촬영하는 동안 녹화한 영상 */
  video: Blob | null;
  /** 새 촬영을 시작할 때마다 증가. 늦게 끝난 녹화가 다른 촬영에 붙지 않게 한다. */
  session: number;
  /** 프레임 위에 얹는 커스텀 캐릭터. 새로 찍어도 지우지 않는다. */
  characters: Character[];
}

export type Action =
  | { type: "layout"; layout: LayoutKey }
  | { type: "timer"; timer: number }
  | { type: "frame"; frame: FrameId }
  | { type: "showDate"; showDate: boolean }
  | { type: "caption"; caption: string }
  | { type: "start" }
  | { type: "shot"; index: number; shot: Shot }
  | { type: "retake"; index: number }
  | { type: "back" }
  | { type: "complete" }
  | { type: "reset" }
  | { type: "filter"; filter: FilterId }
  | { type: "video"; session: number; video: Blob }
  | { type: "characters"; characters: Character[] };

const emptyShots = (layout: LayoutKey): (Shot | null)[] => Array(LAYOUTS[layout].count).fill(null);

export const initialState: BoothState = {
  screen: "start",
  layout: "strip",
  timer: 5,
  frame: DEFAULT_FRAME,
  showDate: false,
  caption: "",
  shots: emptyShots("strip"),
  pendingRetake: null,
  revision: 0,
  capturedAt: new Date(0),
  filter: DEFAULT_FILTER,
  video: null,
  session: 0,
  characters: [],
};

// 리듀서는 순수 함수로 둔다. 캔버스 메모리 해제는 dispatch 전에 이벤트 핸들러에서 한다.
export function reducer(state: BoothState, action: Action): BoothState {
  switch (action.type) {
    case "layout":
      // 찍은 뒤에는 장수가 같은 레이아웃으로만 바꿀 수 있다.
      if (state.screen !== "start" && LAYOUTS[action.layout].count !== state.shots.length) return state;
      return {
        ...state,
        layout: action.layout,
        shots: state.screen === "start" ? emptyShots(action.layout) : state.shots,
        revision: state.revision + 1,
      };
    case "timer":
      return { ...state, timer: action.timer };
    case "frame":
      return { ...state, frame: action.frame };
    case "showDate":
      return { ...state, showDate: action.showDate };
    case "caption":
      return { ...state, caption: action.caption };
    case "start":
      return {
        ...state,
        screen: "capture",
        shots: emptyShots(state.layout),
        pendingRetake: null,
        revision: state.revision + 1,
        video: null,
        session: state.session + 1,
      };
    case "shot": {
      if (state.shots[action.index]) return state;
      const shots = state.shots.map((s, i) => (i === action.index ? action.shot : s));
      const complete = shots.every(Boolean);
      return {
        ...state,
        shots,
        pendingRetake: state.pendingRetake?.index === action.index ? null : state.pendingRetake,
        revision: state.revision + 1,
        capturedAt: complete ? new Date() : state.capturedAt,
      };
    }
    case "retake": {
      const shot = state.shots[action.index];
      if (!shot || !state.shots.every(Boolean)) return state;
      return {
        ...state,
        screen: "capture",
        shots: state.shots.map((s, i) => (i === action.index ? null : s)),
        pendingRetake: { index: action.index, shot },
        revision: state.revision + 1,
      };
    }
    case "back": {
      if (state.pendingRetake) {
        const { index, shot } = state.pendingRetake;
        return {
          ...state,
          screen: "result",
          shots: state.shots.map((s, i) => (i === index ? shot : s)),
          pendingRetake: null,
          revision: state.revision + 1,
        };
      }
      // 다시 찍기를 막 마친 직후(결과로 넘어가기 전)라면 사진을 지우지 않는다.
      if (state.shots.every(Boolean)) return { ...state, screen: "result" };
      return { ...state, screen: "start", shots: emptyShots(state.layout), revision: state.revision + 1, video: null, session: state.session + 1 };
    }
    case "complete":
      return state.shots.every(Boolean) ? { ...state, screen: "result" } : state;
    case "reset":
      return {
        ...state,
        screen: "start",
        shots: emptyShots(state.layout),
        pendingRetake: null,
        revision: state.revision + 1,
        video: null,
        session: state.session + 1,
      };
    case "filter":
      return { ...state, filter: action.filter };
    case "video":
      return action.session === state.session ? { ...state, video: action.video } : state;
    case "characters":
      return { ...state, characters: action.characters };
  }
}
