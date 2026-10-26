import type { Dispatch } from "react";
import {
  type AppAction,
  type AppState,
  type PlacementTool,
  canEnterFirstPerson,
} from "../state/appState";

type Props = {
  readonly state: AppState;
  readonly dispatch: Dispatch<AppAction>;
};

const TOOL_HINTS: Record<Exclude<PlacementTool, "none">, string> = {
  viewpoint: "地図をクリックして撮影地点を置いてください。",
  firework: "地図をクリックして打上地点を置いてください。",
};

export function ModeControls({ state, dispatch }: Props) {
  if (state.mode === "firstPerson") {
    return (
      <div className="mode-controls">
        <button
          type="button"
          className="primary"
          onClick={() => dispatch({ type: "exitFirstPerson" })}
        >
          俯瞰に戻る
        </button>
        <p className="hint">ドラッグ・スワイプで見回せます。</p>
      </div>
    );
  }
  // 同じ道具をもう一度押すと選択を解除する。
  const toggle = (tool: Exclude<PlacementTool, "none">) =>
    dispatch({ type: "selectTool", tool: state.tool === tool ? "none" : tool });
  return (
    <div className="mode-controls">
      <div className="tool-buttons">
        <button
          type="button"
          aria-pressed={state.tool === "viewpoint"}
          onClick={() => toggle("viewpoint")}
        >
          撮影地点を置く
        </button>
        <button
          type="button"
          aria-pressed={state.tool === "firework"}
          onClick={() => toggle("firework")}
        >
          花火を置く
        </button>
      </div>
      {state.tool !== "none" && <p className="hint">{TOOL_HINTS[state.tool]}</p>}
      <button
        type="button"
        className="primary"
        disabled={!canEnterFirstPerson(state)}
        onClick={() => dispatch({ type: "enterFirstPerson" })}
      >
        撮影地点から見る
      </button>
    </div>
  );
}
