const CATALOG_ENDPOINT = "https://api.plateauview.mlit.go.jp/datacatalog/graphql";

/** 東京23区（13101〜13123）と横浜市（14100）の地域コード。 */
export const TARGET_AREA_CODES: readonly string[] = [
  ...Array.from({ length: 23 }, (_, index) => String(13101 + index)),
  "14100",
];

/**
 * 建物は全区で揃っている LOD1 を使う。
 * LOD2 以上は区によって欠けており、LOD1 と重ねると表示が干渉するため使わない。
 */
const BUILDING_LOD = 1;

const QUERY = `query BuildingTilesets($areaCodes: [AreaCode!]!) {
  datasets(input: { areaCodes: $areaCodes, includeTypes: ["bldg"] }) {
    name
    ... on PlateauDataset { items { url lod } }
  }
}`;

export type BuildingTileset = {
  /** データセット名（例: 建築物モデル（墨田区））。 */
  readonly name: string;
  readonly url: string;
};

/**
 * 対象地域の建物の tileset URL を、PLATEAU のデータカタログ API から取得する。
 * 配信 URL は予告なく変わり得るため、固定値として持たずに実行時に問い合わせる。
 */
export async function fetchBuildingTilesets(
  fetchImpl: typeof fetch = fetch,
): Promise<BuildingTileset[]> {
  const response = await fetchImpl(CATALOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { areaCodes: TARGET_AREA_CODES } }),
  });
  if (!response.ok) {
    throw new Error(`データカタログ API が ${response.status} を返しました`);
  }
  const tilesets = selectBuildingTilesets(await response.json());
  if (tilesets.length === 0) {
    throw new Error("データカタログ API の応答に建物データがありません");
  }
  return tilesets;
}

/** API の応答から、各データセットの LOD1 の tileset を選ぶ。想定外の形の要素は無視する。 */
export function selectBuildingTilesets(body: unknown): BuildingTileset[] {
  const datasets = property(property(body, "data"), "datasets");
  if (!Array.isArray(datasets)) {
    throw new Error("データカタログ API の応答の形式が想定と異なります");
  }
  return datasets.flatMap((dataset: unknown) => {
    const name = property(dataset, "name");
    const items = property(dataset, "items");
    if (typeof name !== "string" || !Array.isArray(items)) {
      return [];
    }
    const url = items
      .filter((item: unknown) => property(item, "lod") === BUILDING_LOD)
      .map((item: unknown) => property(item, "url"))
      .find((value): value is string => typeof value === "string");
    return url === undefined ? [] : [{ name, url }];
  });
}

// 応答は外部サービスのものなので、型を仮定せずにプロパティを1つずつ確かめながら読む。
function property(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;
}
