import type { ViewDirection } from "../geo/sightLine";
import { compassPoint } from "./format";

type Props = {
  readonly direction: ViewDirection;
};

export function DirectionIndicator({ direction }: Props) {
  return (
    <div className="direction-indicator" aria-live="polite">
      方位 {Math.round(direction.heading)}°（{compassPoint(direction.heading)}） / 仰角{" "}
      {Math.round(direction.pitch)}°
    </div>
  );
}
