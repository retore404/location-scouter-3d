export function formatDegrees(value: number): string {
  return value.toFixed(6);
}

/** メートルの値を小数点以下1桁までで表示する。 */
export function formatMeters(value: number): string {
  return String(Math.round(value * 10) / 10);
}

const COMPASS_POINTS = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"] as const;

/** 方位（北を 0° とした時計回り）を8方位の名前にする。 */
export function compassPoint(heading: number): string {
  const index = Math.round((((heading % 360) + 360) % 360) / 45) % COMPASS_POINTS.length;
  return COMPASS_POINTS[index] ?? "北";
}
