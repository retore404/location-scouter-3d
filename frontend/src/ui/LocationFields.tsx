import type { GeoPoint } from "../domain/geoPoint";
import { validateLatitude, validateLongitude } from "../domain/validation";
import { NumberField } from "./NumberField";
import { formatDegrees } from "./format";

type Props = {
  readonly position: GeoPoint;
  readonly onChange: (position: GeoPoint) => void;
};

export function LocationFields({ position, onChange }: Props) {
  return (
    <>
      <NumberField
        label="緯度"
        value={position.latitude}
        format={formatDegrees}
        validate={validateLatitude}
        onCommit={(latitude) => onChange({ ...position, latitude })}
      />
      <NumberField
        label="経度"
        value={position.longitude}
        format={formatDegrees}
        validate={validateLongitude}
        onCommit={(longitude) => onChange({ ...position, longitude })}
      />
    </>
  );
}
