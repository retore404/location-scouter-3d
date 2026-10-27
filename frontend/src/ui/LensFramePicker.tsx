import type { Dispatch } from "react";
import { FOCAL_LENGTHS, type FocalLength } from "../domain/lens";
import type { AppAction } from "../state/appState";

type Props = {
  readonly shownFocalLengths: readonly FocalLength[];
  readonly dispatch: Dispatch<AppAction>;
};

export function LensFramePicker({ shownFocalLengths, dispatch }: Props) {
  return (
    <section className="panel-section" aria-labelledby="lens-frames-heading">
      <h2 id="lens-frames-heading">画角枠</h2>
      <p className="hint">
        35mm判フルサイズ換算の焦点距離です。画角枠は撮影地点から見ているときに表示されます。
      </p>
      <div className="focal-length-buttons">
        {FOCAL_LENGTHS.map((focalLength) => (
          <button
            key={focalLength}
            type="button"
            aria-pressed={shownFocalLengths.includes(focalLength)}
            onClick={() => dispatch({ type: "toggleFocalLength", focalLength })}
          >
            {focalLength}mm
          </button>
        ))}
      </div>
    </section>
  );
}
