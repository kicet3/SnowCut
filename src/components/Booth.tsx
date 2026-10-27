"use client";

import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { initialState, reducer } from "@/lib/boothState";
import { freeShot } from "@/lib/canvas";
import { LAYOUT_KEYS, compatibleLayouts } from "@/lib/frame";
import { CharacterEditor } from "./CharacterEditor";
import { CaptureScreen } from "./CaptureScreen";
import { ResultScreen, type ResultStep } from "./ResultScreen";
import { StartScreen } from "./StartScreen";

export function Booth() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [resultStep, setResultStep] = useState<ResultStep>("frame");
  const [editingCharacters, setEditingCharacters] = useState(false);
  // 촬영 순서처럼 오래 도는 비동기 작업이 예전 렌더의 state를 보지 않도록 최신 값을 둔다.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const freeAll = () => {
    state.shots.forEach(freeShot);
    freeShot(state.pendingRetake?.shot);
  };

  let screen: ReactNode;
  if (state.screen === "capture") {
    screen = (
      <CaptureScreen
        layout={state.layout}
        timer={state.timer}
        shots={state.shots}
        isRetake={state.pendingRetake !== null}
        onVideo={(video) => dispatch({ type: "video", session: state.session, video })}
        onShot={(index, shot) => {
          const current = stateRef.current;
          if (current.shots[index]) {
            // 이미 찬 칸이면 리듀서가 무시하므로 새 촬영본을 바로 해제한다.
            freeShot(shot);
            return;
          }
          if (current.pendingRetake?.index === index) freeShot(current.pendingRetake.shot);
          const next = current.shots.map((s, i) => (i === index ? shot : s));
          stateRef.current = {
            ...current,
            shots: next,
            pendingRetake: current.pendingRetake?.index === index ? null : current.pendingRetake,
          };
          dispatch({ type: "shot", index, shot });
        }}
        onBack={() => {
          if (!state.pendingRetake && !state.shots.every(Boolean)) freeAll();
          dispatch({ type: "back" });
        }}
        onComplete={() => dispatch({ type: "complete" })}
      />
    );
  } else if (state.screen === "result") {
    screen = (
      <ResultScreen
        layout={state.layout}
        frame={state.frame}
        showDate={state.showDate}
        shots={state.shots}
        revision={state.revision}
        capturedAt={state.capturedAt}
        filter={state.filter}
        video={state.video}
        characters={state.characters}
        onCharacters={() => setEditingCharacters(true)}
        onFilter={(filter) => dispatch({ type: "filter", filter })}
        onFrame={(frame) => dispatch({ type: "frame", frame })}
        onLayout={(layout) => dispatch({ type: "layout", layout })}
        onShowDate={(showDate) => dispatch({ type: "showDate", showDate })}
        onRetake={(index) => dispatch({ type: "retake", index })}
        step={resultStep}
        onStep={setResultStep}
        onNew={() => {
          setResultStep("frame");
          freeAll();
          dispatch({ type: "reset" });
        }}
      />
    );
  } else {
    screen = (
      <StartScreen
        layout={state.layout}
        timer={state.timer}
        onLayout={(layout) => dispatch({ type: "layout", layout })}
        onTimer={(timer) => dispatch({ type: "timer", timer })}
        characterCount={state.characters.length}
        onCharacters={() => setEditingCharacters(true)}
        onStart={() => {
          setResultStep("frame");
          freeAll();
          dispatch({ type: "start" });
        }}
      />
    );
  }

  return (
    <div className="app">
      <header className="brand-bar">
        {/* 평소에는 로고. 다섯 번 누르면 숨은 기능이 열린다 (아무 표시 없이). */}
        <div className="brand" id="brandLogo">
          Snow<span>Cut</span>
        </div>
      </header>
      {screen}
      {editingCharacters && state.screen !== "capture" && (
        <CharacterEditor
          layout={state.layout}
          layouts={state.screen === "start" ? LAYOUT_KEYS : compatibleLayouts(state.layout)}
          frame={state.frame}
          shots={state.shots}
          filter={state.screen === "result" ? state.filter : undefined}
          date={state.screen === "result" && state.showDate ? state.capturedAt : null}
          characters={state.characters}
          onLayout={(layout) => dispatch({ type: "layout", layout })}
          onChange={(characters) => dispatch({ type: "characters", characters })}
          onClose={() => setEditingCharacters(false)}
        />
      )}
    </div>
  );
}
