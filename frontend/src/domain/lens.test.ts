import { describe, expect, test } from "vitest";
import {
  DEFAULT_FIELD_OF_VIEW,
  FOCAL_LENGTHS,
  type FocalLength,
  angleOfView,
  fieldOfView,
  frameSize,
} from "./lens";

const LANDSCAPE = 16 / 9;
const PORTRAIT = 9 / 16;

describe("定番の焦点距離", () => {
  test("仕様の9種類と一致する", () => {
    expect(FOCAL_LENGTHS).toEqual([24, 28, 35, 40, 50, 75, 85, 100, 200]);
  });
});

describe("angleOfView", () => {
  test("50mm の画角は水平 約39.6°、垂直 約27.0°", () => {
    const { horizontal, vertical } = angleOfView(50);
    expect(horizontal).toBeCloseTo(39.6, 1);
    expect(vertical).toBeCloseTo(27.0, 1);
  });

  test("24mm の画角は水平 約73.7°、垂直 約53.1°", () => {
    const { horizontal, vertical } = angleOfView(24);
    expect(horizontal).toBeCloseTo(73.7, 1);
    expect(vertical).toBeCloseTo(53.1, 1);
  });
});

describe("fieldOfView", () => {
  test("画角枠がなければ既定の視野", () => {
    expect(fieldOfView(LANDSCAPE, [])).toBe(DEFAULT_FIELD_OF_VIEW);
  });

  test("望遠の画角枠だけなら既定の視野", () => {
    expect(fieldOfView(LANDSCAPE, [100, 200])).toBe(DEFAULT_FIELD_OF_VIEW);
    expect(fieldOfView(PORTRAIT, [100, 200])).toBe(DEFAULT_FIELD_OF_VIEW);
  });

  test.each([
    ["横長", LANDSCAPE],
    ["縦長", PORTRAIT],
  ])("%sの画面で 24mm を含むと既定より広がる", (_, aspectRatio) => {
    expect(fieldOfView(aspectRatio, [24, 50])).toBeGreaterThan(DEFAULT_FIELD_OF_VIEW);
  });

  test.each([
    ["横長", LANDSCAPE],
    ["縦長", PORTRAIT],
    ["正方形", 1],
  ])("%sの画面で、すべての画角枠が画面の 9 割以内に収まる", (_, aspectRatio) => {
    const fov = fieldOfView(aspectRatio, FOCAL_LENGTHS);
    for (const focalLength of FOCAL_LENGTHS) {
      const { width, height } = frameSize(focalLength, fov, aspectRatio);
      expect(width).toBeLessThanOrEqual(0.9 + 1e-9);
      expect(height).toBeLessThanOrEqual(0.9 + 1e-9);
    }
  });
});

describe("frameSize", () => {
  test("広げた視野では、最も広い画角枠が縦か横のどちらかで画面の 9 割を占める", () => {
    const focalLengths: FocalLength[] = [24, 85];
    const fov = fieldOfView(LANDSCAPE, focalLengths);
    const { width, height } = frameSize(24, fov, LANDSCAPE);
    expect(Math.max(width, height)).toBeCloseTo(0.9, 9);
  });

  test("画面の水平視野と同じ画角の画角枠は、画面の幅いっぱいになる", () => {
    // 横長の画面では視野は水平方向に適用される。
    const { horizontal } = angleOfView(50);
    const { width } = frameSize(50, horizontal, LANDSCAPE);
    expect(width).toBeCloseTo(1, 9);
  });

  test("縦長の画面では、垂直視野と同じ画角の画角枠が画面の高さいっぱいになる", () => {
    const { vertical } = angleOfView(50);
    const { height } = frameSize(50, vertical, PORTRAIT);
    expect(height).toBeCloseTo(1, 9);
  });

  test("横長の既定の視野では、200mm の画角枠は画面の幅の約 16%", () => {
    expect(frameSize(200, DEFAULT_FIELD_OF_VIEW, LANDSCAPE).width).toBeCloseTo(0.156, 3);
  });
});
