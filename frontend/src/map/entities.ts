import {
  Cartesian2,
  Cartesian3,
  Color,
  HorizontalOrigin,
  LabelStyle,
  PolylineDashMaterialProperty,
  VerticalOrigin,
  type Viewer,
} from "cesium";
import { type Firework, shellLabel } from "../domain/firework";
import type { Viewpoint } from "../domain/viewpoint";
import { burstCenter, viewpointPosition } from "../geo/sightLine";

const VIEWPOINT_COLOR = Color.fromCssColorString("#1e88e5");
const FIREWORK_COLOR = Color.fromCssColorString("#ff7043");

/** 印やラベルを建物に隠さず常に見えるようにする。開花範囲の球はこの対象にしない。 */
const ALWAYS_VISIBLE = Number.POSITIVE_INFINITY;

export type SceneContents = {
  readonly viewpoint: Viewpoint | null;
  readonly fireworks: readonly Firework[];
  /** 一人称モードでは視点が撮影地点にあるため、撮影地点の印を描かない。 */
  readonly showViewpoint: boolean;
};

/**
 * 状態に合わせて撮影地点と花火の Entity を作り直す。
 * 地表の高さが未取得のものは位置が決まらないため描かない。
 */
export function syncEntities(viewer: Viewer, contents: SceneContents): void {
  viewer.entities.suspendEvents();
  viewer.entities.removeAll();
  if (contents.viewpoint && contents.showViewpoint) {
    addViewpoint(viewer, contents.viewpoint);
  }
  contents.fireworks.forEach((firework, index) => addFirework(viewer, firework, index + 1));
  viewer.entities.resumeEvents();
  viewer.scene.requestRender();
}

function addViewpoint(viewer: Viewer, viewpoint: Viewpoint): void {
  const position = viewpointPosition(viewpoint);
  if (!position || viewpoint.groundHeight === null) {
    return;
  }
  const ground = Cartesian3.fromDegrees(
    viewpoint.position.longitude,
    viewpoint.position.latitude,
    viewpoint.groundHeight,
  );
  viewer.entities.add({
    position,
    point: {
      pixelSize: 14,
      color: VIEWPOINT_COLOR,
      outlineColor: Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: ALWAYS_VISIBLE,
    },
    label: label(`撮影地点（地上高 ${formatMeters(viewpoint.heightAboveGround)}）`),
  });
  // 地上高がわかるよう、地表から撮影地点まで線を引く。
  viewer.entities.add({
    polyline: { positions: [ground, position], width: 2, material: VIEWPOINT_COLOR },
  });
}

function addFirework(viewer: Viewer, firework: Firework, number: number): void {
  const center = burstCenter(firework);
  if (!center || firework.groundHeight === null) {
    return;
  }
  const launchSite = Cartesian3.fromDegrees(
    firework.launchSite.longitude,
    firework.launchSite.latitude,
    firework.groundHeight,
  );
  const radius = firework.burstDiameter / 2;
  viewer.entities.add({
    position: launchSite,
    point: {
      pixelSize: 10,
      color: FIREWORK_COLOR,
      outlineColor: Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: ALWAYS_VISIBLE,
    },
    label: label(`花火${number}（${shellLabel(firework)}）`),
  });
  // 打上地点と開花範囲の対応がわかるよう、打上地点から開花範囲の中心まで破線を引く。
  viewer.entities.add({
    polyline: {
      positions: [launchSite, center],
      width: 2,
      material: new PolylineDashMaterialProperty({ color: FIREWORK_COLOR }),
    },
  });
  viewer.entities.add({
    position: center,
    ellipsoid: {
      radii: new Cartesian3(radius, radius, radius),
      material: FIREWORK_COLOR.withAlpha(0.35),
    },
  });
}

function label(text: string) {
  return {
    text,
    font: "14px sans-serif",
    fillColor: Color.WHITE,
    outlineColor: Color.BLACK,
    outlineWidth: 3,
    style: LabelStyle.FILL_AND_OUTLINE,
    horizontalOrigin: HorizontalOrigin.LEFT,
    verticalOrigin: VerticalOrigin.BOTTOM,
    pixelOffset: new Cartesian2(10, -10),
    disableDepthTestDistance: ALWAYS_VISIBLE,
  };
}

function formatMeters(value: number): string {
  return `${Math.round(value * 10) / 10}m`;
}
