import type { Dispatch } from "react";
import { validateHeightAboveGround } from "../domain/validation";
import type { Viewpoint } from "../domain/viewpoint";
import type { AppAction } from "../state/appState";
import { LocationFields } from "./LocationFields";
import { NumberField } from "./NumberField";
import { formatMeters } from "./format";

type Props = {
  readonly viewpoint: Viewpoint | null;
  readonly dispatch: Dispatch<AppAction>;
};

export function ViewpointEditor({ viewpoint, dispatch }: Props) {
  return (
    <section className="panel-section" aria-labelledby="viewpoint-heading">
      <h2 id="viewpoint-heading">撮影地点</h2>
      {viewpoint ? (
        <>
          <LocationFields
            position={viewpoint.position}
            onChange={(position) => dispatch({ type: "updateViewpointPosition", position })}
          />
          <NumberField
            label="地上高（m）"
            value={viewpoint.heightAboveGround}
            format={formatMeters}
            validate={validateHeightAboveGround}
            onCommit={(heightAboveGround) =>
              dispatch({ type: "updateViewpointHeight", heightAboveGround })
            }
          />
          {viewpoint.groundHeight === null && <p className="hint">地表の高さを取得しています…</p>}
        </>
      ) : (
        <p className="hint">まだ置かれていません。</p>
      )}
    </section>
  );
}
