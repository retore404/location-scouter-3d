import { type Dispatch, useId } from "react";
import { CUSTOM_SHELL, type Firework, SHELL_SIZES, shellLabel } from "../domain/firework";
import { validateBurstLength } from "../domain/validation";
import type { AppAction } from "../state/appState";
import { LocationFields } from "./LocationFields";
import { NumberField } from "./NumberField";
import { formatMeters } from "./format";

type Props = {
  readonly fireworks: readonly Firework[];
  readonly dispatch: Dispatch<AppAction>;
};

export function FireworkList({ fireworks, dispatch }: Props) {
  return (
    <section className="panel-section" aria-labelledby="fireworks-heading">
      <h2 id="fireworks-heading">花火</h2>
      {fireworks.length === 0 ? (
        <p className="hint">まだ置かれていません。</p>
      ) : (
        <ol className="firework-list">
          {fireworks.map((firework, index) => (
            <li key={firework.id}>
              <FireworkEditor firework={firework} number={index + 1} dispatch={dispatch} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

type EditorProps = {
  readonly firework: Firework;
  readonly number: number;
  readonly dispatch: Dispatch<AppAction>;
};

function FireworkEditor({ firework, number, dispatch }: EditorProps) {
  const shellId = useId();
  const { id } = firework;
  return (
    <article className="firework" aria-label={`花火${number}`}>
      <header className="firework-header">
        <h3>
          花火{number}（{shellLabel(firework)}）
        </h3>
        <button type="button" onClick={() => dispatch({ type: "removeFirework", id })}>
          削除
        </button>
      </header>
      <div className="field">
        <label htmlFor={shellId}>号数</label>
        <select
          id={shellId}
          value={firework.shellSize}
          onChange={(event) => {
            const shellSize = SHELL_SIZES.find((size) => size === event.target.value);
            if (shellSize) {
              dispatch({ type: "selectShellSize", id, shellSize });
            }
          }}
        >
          {SHELL_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}号
            </option>
          ))}
          <option value={CUSTOM_SHELL} disabled>
            直接指定
          </option>
        </select>
      </div>
      <NumberField
        label="開花高度（m）"
        value={firework.burstHeight}
        format={formatMeters}
        validate={validateBurstLength}
        onCommit={(burstHeight) => dispatch({ type: "updateBurstHeight", id, burstHeight })}
      />
      <NumberField
        label="開花直径（m）"
        value={firework.burstDiameter}
        format={formatMeters}
        validate={validateBurstLength}
        onCommit={(burstDiameter) => dispatch({ type: "updateBurstDiameter", id, burstDiameter })}
      />
      <LocationFields
        position={firework.launchSite}
        onChange={(launchSite) => dispatch({ type: "updateLaunchSite", id, launchSite })}
      />
    </article>
  );
}
