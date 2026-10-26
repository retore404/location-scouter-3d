import { Cartesian3, Math as CesiumMath, Matrix4, Transforms } from "cesium";
import type { Firework } from "../domain/firework";
import type { Viewpoint } from "../domain/viewpoint";

/** 視線の向き。方位は北を 0° とした時計回り、仰角は水平を 0° とした上向きを正とする（度）。 */
export type ViewDirection = {
  readonly heading: number;
  readonly pitch: number;
};

/** 地表の高さが取得済みの撮影地点の位置（地球中心座標）。未取得なら undefined。 */
export function viewpointPosition(viewpoint: Viewpoint): Cartesian3 | undefined {
  if (viewpoint.groundHeight === null) {
    return undefined;
  }
  return Cartesian3.fromDegrees(
    viewpoint.position.longitude,
    viewpoint.position.latitude,
    viewpoint.groundHeight + viewpoint.heightAboveGround,
  );
}

/** 地表の高さが取得済みの花火の開花範囲の中心（地球中心座標）。未取得なら undefined。 */
export function burstCenter(firework: Firework): Cartesian3 | undefined {
  if (firework.groundHeight === null) {
    return undefined;
  }
  return Cartesian3.fromDegrees(
    firework.launchSite.longitude,
    firework.launchSite.latitude,
    firework.groundHeight + firework.burstHeight,
  );
}

/** from から to を見る視線の向き。from の位置での東・北・上を基準に測る。 */
export function directionTo(from: Cartesian3, to: Cartesian3): ViewDirection {
  const toLocal = Matrix4.inverseTransformation(
    Transforms.eastNorthUpToFixedFrame(from),
    new Matrix4(),
  );
  const local = Matrix4.multiplyByPoint(toLocal, to, new Cartesian3());
  const heading = CesiumMath.toDegrees(Math.atan2(local.x, local.y));
  const pitch = CesiumMath.toDegrees(Math.atan2(local.z, Math.hypot(local.x, local.y)));
  return { heading: (heading + 360) % 360, pitch };
}

/**
 * 撮影地点から開花範囲の中心までの直線距離が最も短い花火。
 * 地表の高さが未取得の花火は位置が決まらないため候補にしない。
 */
export function nearestFirework(
  from: Cartesian3,
  fireworks: readonly Firework[],
): { firework: Firework; center: Cartesian3 } | undefined {
  let nearest: { firework: Firework; center: Cartesian3; distance: number } | undefined;
  for (const firework of fireworks) {
    const center = burstCenter(firework);
    if (!center) {
      continue;
    }
    const distance = Cartesian3.distance(from, center);
    if (!nearest || distance < nearest.distance) {
      nearest = { firework, center, distance };
    }
  }
  return nearest && { firework: nearest.firework, center: nearest.center };
}
