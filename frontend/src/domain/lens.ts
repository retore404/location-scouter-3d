/** 画角枠を選べる定番の焦点距離（35mm判フルサイズ換算、mm）。 */
export const FOCAL_LENGTHS = [24, 28, 35, 40, 50, 75, 85, 100, 200] as const;

export type FocalLength = (typeof FOCAL_LENGTHS)[number];

/** 35mm判フルサイズのセンサーを横位置に置いたときの幅と高さ（mm）。 */
const SENSOR_WIDTH = 36;
const SENSOR_HEIGHT = 24;

/** 一人称モードの既定の視野（画面の長い辺の方向、度）。Cesium の既定値に合わせる。 */
export const DEFAULT_FIELD_OF_VIEW = 60;

/**
 * 最も広い画角枠が画面の幅・高さに占める割合の上限。
 * 枠の線とラベルが画面の端で切れないように、画面いっぱいまでは広げない。
 */
const FRAME_FILL = 0.9;

/** 水平・垂直の角度（度）。 */
export type Angles = {
  readonly horizontal: number;
  readonly vertical: number;
};

/** 画面の幅・高さに対する画角枠の幅・高さの割合。 */
export type FrameSize = {
  readonly width: number;
  readonly height: number;
};

// 透視投影では、画面上の長さは角度ではなく tan(半角) に比例するため、計算は tan(半角) で行う。
type HalfTangents = {
  readonly horizontal: number;
  readonly vertical: number;
};

export function angleOfView(focalLength: FocalLength): Angles {
  const { horizontal, vertical } = lensHalfTangents(focalLength);
  return { horizontal: fullAngle(horizontal), vertical: fullAngle(vertical) };
}

/**
 * 表示中のすべての画角枠が画面に収まる視野（画面の長い辺の方向、度）。
 * 既定の視野で収まる場合は既定の視野のままにし、それより狭くはしない。
 * aspectRatio は画面の幅 / 高さ。
 */
export function fieldOfView(aspectRatio: number, focalLengths: readonly FocalLength[]): number {
  let required = 0;
  for (const focalLength of focalLengths) {
    const lens = lensHalfTangents(focalLength);
    // 画面の長い辺の方向の tan(半角) に揃えて、縦横の両方が収まる値を求める。
    const longSide =
      aspectRatio >= 1
        ? Math.max(lens.horizontal, lens.vertical * aspectRatio)
        : Math.max(lens.vertical, lens.horizontal / aspectRatio);
    required = Math.max(required, longSide / FRAME_FILL);
  }
  // 既定で収まる場合は、角度の往復の誤差で既定値からずれないよう、既定値そのものを返す。
  return required > halfTangent(DEFAULT_FIELD_OF_VIEW)
    ? fullAngle(required)
    : DEFAULT_FIELD_OF_VIEW;
}

/** 視野 fieldOfViewDegrees の画面に対する、その焦点距離の画角枠の大きさの割合。 */
export function frameSize(
  focalLength: FocalLength,
  fieldOfViewDegrees: number,
  aspectRatio: number,
): FrameSize {
  const lens = lensHalfTangents(focalLength);
  const screen = screenHalfTangents(fieldOfViewDegrees, aspectRatio);
  return {
    width: lens.horizontal / screen.horizontal,
    height: lens.vertical / screen.vertical,
  };
}

function lensHalfTangents(focalLength: FocalLength): HalfTangents {
  return {
    horizontal: SENSOR_WIDTH / 2 / focalLength,
    vertical: SENSOR_HEIGHT / 2 / focalLength,
  };
}

// Cesium と同じく、視野は画面の長い辺の方向に適用する。
function screenHalfTangents(fieldOfViewDegrees: number, aspectRatio: number): HalfTangents {
  const longSide = halfTangent(fieldOfViewDegrees);
  return aspectRatio >= 1
    ? { horizontal: longSide, vertical: longSide / aspectRatio }
    : { horizontal: longSide * aspectRatio, vertical: longSide };
}

function halfTangent(degrees: number): number {
  return Math.tan((degrees * Math.PI) / 360);
}

function fullAngle(halfTangentValue: number): number {
  return (Math.atan(halfTangentValue) * 360) / Math.PI;
}
