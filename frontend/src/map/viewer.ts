import {
  Cartesian3,
  Cesium3DTileset,
  CesiumTerrainProvider,
  Credit,
  ImageryLayer,
  Math as CesiumMath,
  Terrain,
  type TerrainProvider,
  UrlTemplateImageryProvider,
  Viewer,
} from "cesium";
import type { BuildingTileset } from "../data/plateauCatalog";
import { BASE_MAP, BUILDINGS_CREDIT, INITIAL_VIEW, TERRAIN_URL } from "./config";

export type MapViewer = {
  readonly viewer: Viewer;
  /** 地形の読み込みが成功すれば地形、失敗すれば reject する。地表の高さの取得に使う。 */
  readonly terrainProvider: Promise<TerrainProvider>;
};

export function createViewer(container: HTMLElement, onTerrainError: () => void): MapViewer {
  const terrainProvider = CesiumTerrainProvider.fromUrl(TERRAIN_URL, {
    requestVertexNormals: true,
  });
  const terrain = new Terrain(terrainProvider);
  terrain.errorEvent.addEventListener(onTerrainError);
  // layer.json を取得できなくても Cesium は既定値で初期化を続けるため、初期化の失敗だけでなく
  // タイルの取得失敗も地形の取得失敗として通知する。
  void terrainProvider.then(
    (provider) => provider.errorEvent.addEventListener(onTerrainError),
    () => undefined,
  );

  // Cesium ion のサービス（既定の背景画像・地名検索など）は使わないため、既定のウィジェットをすべて外す。
  const viewer = new Viewer(container, {
    baseLayer: new ImageryLayer(
      new UrlTemplateImageryProvider({
        url: BASE_MAP.url,
        maximumLevel: BASE_MAP.maximumLevel,
        credit: new Credit(BASE_MAP.credit, true),
      }),
    ),
    terrain,
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    // 変化がないときは再描画せず、スマホでの負荷を抑える。
    requestRenderMode: true,
    maximumRenderTimeChange: Number.POSITIVE_INFINITY,
  });
  viewer.creditDisplay.addStaticCredit(new Credit(BUILDINGS_CREDIT, true));
  // 地形の起伏が開花範囲を遮るようにする。
  viewer.scene.globe.depthTestAgainstTerrain = true;

  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(
      INITIAL_VIEW.longitude,
      INITIAL_VIEW.latitude,
      INITIAL_VIEW.height,
    ),
    orientation: {
      heading: CesiumMath.toRadians(INITIAL_VIEW.headingDegrees),
      pitch: CesiumMath.toRadians(INITIAL_VIEW.pitchDegrees),
      roll: 0,
    },
  });

  return { viewer, terrainProvider };
}

/**
 * 建物の tileset を追加する。取得に失敗した tileset の数を返す。
 * 一部が失敗しても、取得できた tileset は表示する。
 */
export async function addBuildingTilesets(
  viewer: Viewer,
  tilesets: readonly BuildingTileset[],
): Promise<number> {
  const results = await Promise.allSettled(
    tilesets.map(async ({ url }) => {
      const tileset = await Cesium3DTileset.fromUrl(url);
      if (viewer.isDestroyed()) {
        tileset.destroy();
        return;
      }
      viewer.scene.primitives.add(tileset);
    }),
  );
  viewer.scene.requestRender();
  return results.filter(({ status }) => status === "rejected").length;
}
