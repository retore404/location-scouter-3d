import { Cartographic, type TerrainProvider, sampleTerrainMostDetailed } from "cesium";
import type { GeoPoint } from "../domain/geoPoint";

/**
 * 緯度経度の地表の楕円体高を地形データから取得する。
 * 地形を取得できない場合は 0m とみなす（画面には、高さが実際と異なり得る旨を別途表示する）。
 */
export async function sampleGroundHeight(
  terrainProvider: Promise<TerrainProvider>,
  position: GeoPoint,
): Promise<number> {
  try {
    const [sampled] = await sampleTerrainMostDetailed(await terrainProvider, [
      Cartographic.fromDegrees(position.longitude, position.latitude),
    ]);
    return sampled?.height ?? 0;
  } catch {
    return 0;
  }
}
