import { describe, expect, test } from "vitest";
import { TARGET_AREA_CODES, fetchBuildingTilesets, selectBuildingTilesets } from "./plateauCatalog";

const sampleBody = {
  data: {
    datasets: [
      {
        name: "建築物モデル（墨田区）",
        items: [
          { url: "https://example.com/sumida_lod1/tileset.json", lod: 1 },
          { url: "https://example.com/sumida_lod2/tileset.json", lod: 2 },
        ],
      },
      {
        name: "建築物モデル（西区）",
        items: [
          { url: "https://example.com/nishi_lod2/tileset.json", lod: 2 },
          { url: "https://example.com/nishi_lod1/tileset.json", lod: 1 },
        ],
      },
      { name: "建築物モデル（LOD1なし）", items: [{ url: "https://example.com/x.json", lod: 2 }] },
    ],
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("TARGET_AREA_CODES", () => {
  test("東京23区と横浜市を含む", () => {
    expect(TARGET_AREA_CODES).toHaveLength(24);
    expect(TARGET_AREA_CODES[0]).toBe("13101");
    expect(TARGET_AREA_CODES).toContain("13123");
    expect(TARGET_AREA_CODES).toContain("14100");
  });
});

describe("selectBuildingTilesets", () => {
  test("各データセットの LOD1 の URL を選び、LOD1 がないものは除く", () => {
    expect(selectBuildingTilesets(sampleBody)).toEqual([
      { name: "建築物モデル（墨田区）", url: "https://example.com/sumida_lod1/tileset.json" },
      { name: "建築物モデル（西区）", url: "https://example.com/nishi_lod1/tileset.json" },
    ]);
  });

  test("datasets がなければエラーにする", () => {
    expect(() => selectBuildingTilesets({ errors: [{ message: "bad" }] })).toThrow(
      "データカタログ API の応答の形式が想定と異なります",
    );
  });
});

describe("fetchBuildingTilesets", () => {
  test("対象地域の地域コードで問い合わせ、tileset を返す", async () => {
    let requestBody: unknown;
    const tilesets = await fetchBuildingTilesets(async (_input, init) => {
      requestBody = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
      return jsonResponse(sampleBody);
    });
    expect(tilesets).toHaveLength(2);
    expect(requestBody).toMatchObject({ variables: { areaCodes: TARGET_AREA_CODES } });
  });

  test("HTTP エラーはエラーとして返す", async () => {
    await expect(fetchBuildingTilesets(async () => jsonResponse({}, 503))).rejects.toThrow(
      "データカタログ API が 503 を返しました",
    );
  });

  test("通信の失敗はエラーとして返す", async () => {
    await expect(
      fetchBuildingTilesets(async () => {
        throw new TypeError("Failed to fetch");
      }),
    ).rejects.toThrow("Failed to fetch");
  });

  test("建物データが1件もなければエラーとして返す", async () => {
    await expect(
      fetchBuildingTilesets(async () => jsonResponse({ data: { datasets: [] } })),
    ).rejects.toThrow("データカタログ API の応答に建物データがありません");
  });
});
