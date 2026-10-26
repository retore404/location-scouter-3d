/**
 * PLATEAU 配信サービスの地形（quantized-mesh、楕円体高）。Cesium ion を介さずに読み込める。
 * CesiumTerrainProvider.fromUrl は渡した URL に layer.json を付けて読むため、ディレクトリを渡す。
 */
export const TERRAIN_URL = "https://tile.plateauview.mlit.go.jp/terrain/";

/** 国土地理院の淡色地図。川や海岸線が読み取りやすく、打上地点を置きやすい。 */
export const BASE_MAP = {
  url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
  maximumLevel: 18,
  credit:
    '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>',
};

/** 起動時に東京23区と横浜市を一望できる視点。 */
export const INITIAL_VIEW = {
  longitude: 139.72,
  latitude: 35.2,
  height: 30_000,
  headingDegrees: 0,
  pitchDegrees: -45,
};

/**
 * 建物の出典。PLATEAU サイトポリシー（公共データ利用規約 1.0）に沿い、出典と加工した旨を記載する。
 * 地形の出典（PLATEAU | Mapterhorn | 国土地理院）は、地形の layer.json の attribution から自動で表示される。
 */
export const BUILDINGS_CREDIT =
  '「<a href="https://www.mlit.go.jp/plateau/" target="_blank">3D都市モデル（Project PLATEAU）</a>東京都23区・横浜市」（国土交通省）を加工して作成';
