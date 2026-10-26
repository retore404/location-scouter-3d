import { Cartesian3, Cartographic } from "cesium";
import { describe, expect, test } from "vitest";
import { createFirework } from "../domain/firework";
import { burstCenter, directionTo, nearestFirework, viewpointPosition } from "./sightLine";

const origin = { latitude: 35.71, longitude: 139.81 };

function heightOf(position: Cartesian3): number {
  return Cartographic.fromCartesian(position).height;
}

describe("高さの変換", () => {
  test("撮影地点は地表の楕円体高に地上高を足した高さになる", () => {
    const position = viewpointPosition({
      position: origin,
      heightAboveGround: 350,
      groundHeight: 40,
    });
    expect(position && heightOf(position)).toBeCloseTo(390, 3);
  });

  test("開花範囲の中心は打上地点の地表の楕円体高に開花高度を足した高さになる", () => {
    const firework = { ...createFirework("f1", origin), groundHeight: 37 };
    const center = burstCenter(firework);
    expect(center && heightOf(center)).toBeCloseTo(367, 3);
  });

  test("地表の高さが未取得なら位置は決まらない", () => {
    expect(
      viewpointPosition({ position: origin, heightAboveGround: 1.5, groundHeight: null }),
    ).toBe(undefined);
    expect(burstCenter(createFirework("f1", origin))).toBe(undefined);
  });
});

describe("directionTo", () => {
  const from = Cartesian3.fromDegrees(origin.longitude, origin.latitude, 0);

  test.each([
    { name: "北", to: { lat: 35.72, lon: 139.81 }, heading: 0 },
    { name: "東", to: { lat: 35.71, lon: 139.82 }, heading: 90 },
    { name: "南", to: { lat: 35.7, lon: 139.81 }, heading: 180 },
    { name: "西", to: { lat: 35.71, lon: 139.8 }, heading: 270 },
  ])("$name の点の方位は $heading°", ({ to, heading }) => {
    const direction = directionTo(from, Cartesian3.fromDegrees(to.lon, to.lat, 0));
    expect(direction.heading).toBeCloseTo(heading, 0);
  });

  test("真上の点の仰角は 90°", () => {
    const above = Cartesian3.fromDegrees(origin.longitude, origin.latitude, 100);
    expect(directionTo(from, above).pitch).toBeCloseTo(90, 3);
  });

  test("約1km先の330m上の点は仰角が約18°になる", () => {
    // 緯度 0.009° はおよそ 1km。地球の丸みによる低下は 1km で約0.08m なので無視できる。
    const to = Cartesian3.fromDegrees(origin.longitude, origin.latitude + 0.009, 330);
    const distance = Cartesian3.distance(
      from,
      Cartesian3.fromDegrees(origin.longitude, origin.latitude + 0.009, 0),
    );
    expect(directionTo(from, to).pitch).toBeCloseTo((Math.atan2(330, distance) * 180) / Math.PI, 1);
  });
});

describe("nearestFirework", () => {
  const from = Cartesian3.fromDegrees(origin.longitude, origin.latitude, 0);
  const near = {
    ...createFirework("near", { latitude: 35.72, longitude: 139.81 }),
    groundHeight: 0,
  };
  const far = { ...createFirework("far", { latitude: 35.8, longitude: 139.81 }), groundHeight: 0 };

  test("開花範囲の中心が最も近い花火を選ぶ", () => {
    expect(nearestFirework(from, [far, near])?.firework.id).toBe("near");
  });

  test("地表の高さが未取得の花火は候補にしない", () => {
    const pending = createFirework("pending", origin);
    expect(nearestFirework(from, [pending, far])?.firework.id).toBe("far");
  });

  test("候補がなければ undefined", () => {
    expect(nearestFirework(from, [])).toBe(undefined);
  });
});
