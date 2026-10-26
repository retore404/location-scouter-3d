import { describe, expect, test } from "vitest";
import { compassPoint, formatDegrees, formatMeters } from "./format";

describe("format", () => {
  test("緯度経度は小数点以下6桁", () => {
    expect(formatDegrees(35.7)).toBe("35.700000");
  });

  test("メートルは小数点以下1桁まで", () => {
    expect(formatMeters(1.5)).toBe("1.5");
    expect(formatMeters(350)).toBe("350");
    expect(formatMeters(12.345)).toBe("12.3");
  });

  test.each([
    [0, "北"],
    [22, "北"],
    [23, "北東"],
    [90, "東"],
    [180, "南"],
    [270, "西"],
    [337.5, "北"],
    [359, "北"],
  ])("方位 %d° は %s", (heading, expected) => {
    expect(compassPoint(heading)).toBe(expected);
  });
});
