import {
  type Cartesian2,
  type Cartesian3,
  Cartographic,
  Math as CesiumMath,
  type Scene,
} from "cesium";
import type { GeoPoint } from "../domain/geoPoint";

/**
 * 画面上の位置にある建物・地表の緯度経度を返す。何もない（空など）場合は undefined。
 * 建物をクリックした場合も、使うのは緯度経度だけである。
 */
export function pickGeoPoint(scene: Scene, screenPosition: Cartesian2): GeoPoint | undefined {
  const cartesian = pickCartesian(scene, screenPosition);
  if (!cartesian) {
    return undefined;
  }
  const cartographic = Cartographic.fromCartesian(cartesian);
  return {
    latitude: CesiumMath.toDegrees(cartographic.latitude),
    longitude: CesiumMath.toDegrees(cartographic.longitude),
  };
}

// 深度バッファから建物を含む位置を取り、取れない環境では地表との交点で代用する。
function pickCartesian(scene: Scene, screenPosition: Cartesian2): Cartesian3 | undefined {
  if (scene.pickPositionSupported) {
    const picked = scene.pickPosition(screenPosition);
    if (picked) {
      return picked;
    }
  }
  const ray = scene.camera.getPickRay(screenPosition);
  return ray ? scene.globe.pick(ray, scene) : undefined;
}
