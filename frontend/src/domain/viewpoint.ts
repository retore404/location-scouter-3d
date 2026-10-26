import type { GeoPoint } from "./geoPoint";

/** 撮影地点を置いた直後の地上高。地表に立った人の目の高さとする。 */
const DEFAULT_HEIGHT_ABOVE_GROUND = 1.5;

export type Viewpoint = {
  readonly position: GeoPoint;
  /** 地表からの高さ（m）。 */
  readonly heightAboveGround: number;
  /**
   * position の地表の楕円体高（m）。地形データからの取得が終わるまでは null。
   * null の間は表示位置が決まらないため、描画と一人称モードへの切り替えを行わない。
   */
  readonly groundHeight: number | null;
};

export function createViewpoint(position: GeoPoint): Viewpoint {
  return { position, heightAboveGround: DEFAULT_HEIGHT_ABOVE_GROUND, groundHeight: null };
}
