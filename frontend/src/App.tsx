import { useReducer, useState } from "react";
import type { ViewDirection } from "./geo/sightLine";
import { CesiumMap } from "./map/CesiumMap";
import { appReducer, initialAppState } from "./state/appState";
import { DirectionIndicator } from "./ui/DirectionIndicator";
import { FireworkList } from "./ui/FireworkList";
import { ModeControls } from "./ui/ModeControls";
import { Notices } from "./ui/Notices";
import { ViewpointEditor } from "./ui/ViewpointEditor";

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [direction, setDirection] = useState<ViewDirection>();
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div className="app">
      <div className="map-area">
        <CesiumMap state={state} dispatch={dispatch} onViewDirectionChange={setDirection} />
        {state.mode === "firstPerson" && direction && <DirectionIndicator direction={direction} />}
        <Notices loadErrors={state.loadErrors} />
      </div>
      <aside className="panel" data-open={panelOpen}>
        <header className="panel-header">
          <h1>Location Scouter 3D</h1>
          <button
            type="button"
            className="panel-toggle"
            aria-expanded={panelOpen}
            aria-controls="panel-body"
            onClick={() => setPanelOpen((open) => !open)}
          >
            {panelOpen ? "閉じる" : "開く"}
          </button>
        </header>
        <div id="panel-body" className="panel-body" hidden={!panelOpen}>
          <ModeControls state={state} dispatch={dispatch} />
          <ViewpointEditor viewpoint={state.viewpoint} dispatch={dispatch} />
          <FireworkList fireworks={state.fireworks} dispatch={dispatch} />
        </div>
      </aside>
    </div>
  );
}
