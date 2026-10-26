import { describe, expect, test } from "vitest";
import {
  validateBurstLength,
  validateHeightAboveGround,
  validateLatitude,
  validateLongitude,
} from "./validation";

describe("validateHeightAboveGround", () => {
  test.each([
    ["0", 0],
    ["350", 350],
    [" 1.5 ", 1.5],
  ])("%s は受け付ける", (input, expected) => {
    expect(validateHeightAboveGround(input)).toEqual({ ok: true, value: expected });
  });

  test("負の値は受け付けない", () => {
    expect(validateHeightAboveGround("-0.1")).toEqual({
      ok: false,
      message: "0m 以上で入力してください",
    });
  });
});

describe("validateBurstLength", () => {
  test("0 より大きい値は受け付ける", () => {
    expect(validateBurstLength("0.1")).toEqual({ ok: true, value: 0.1 });
  });

  test.each(["0", "-10"])("%s は受け付けない", (input) => {
    expect(validateBurstLength(input)).toEqual({
      ok: false,
      message: "0m より大きい値で入力してください",
    });
  });
});

describe("validateLatitude", () => {
  test.each(["-90", "90", "35.71"])("%s は受け付ける", (input) => {
    expect(validateLatitude(input).ok).toBe(true);
  });

  test.each(["91", "-90.01"])("%s は受け付けない", (input) => {
    expect(validateLatitude(input)).toEqual({
      ok: false,
      message: "緯度は -90〜90 の範囲で入力してください",
    });
  });
});

describe("validateLongitude", () => {
  test.each(["-180", "180", "139.81"])("%s は受け付ける", (input) => {
    expect(validateLongitude(input).ok).toBe(true);
  });

  test.each(["181", "-180.5"])("%s は受け付けない", (input) => {
    expect(validateLongitude(input)).toEqual({
      ok: false,
      message: "経度は -180〜180 の範囲で入力してください",
    });
  });
});

describe("数値でない入力", () => {
  test.each(["", "  ", "abc", "Infinity"])("%j は受け付けない", (input) => {
    expect(validateHeightAboveGround(input)).toEqual({
      ok: false,
      message: "数値を入力してください",
    });
  });
});
