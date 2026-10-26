import { describe, expect, test } from "vitest";
import {
  CUSTOM_SHELL,
  SHELL_PRESETS,
  createFirework,
  selectShellSize,
  setBurstDiameter,
  setBurstHeight,
  shellLabel,
} from "./firework";

const launchSite = { latitude: 35.7, longitude: 139.8 };

describe("号数の目安値", () => {
  test("仕様の表と一致する", () => {
    expect(SHELL_PRESETS).toEqual({
      "3": { burstHeight: 120, burstDiameter: 60 },
      "5": { burstHeight: 190, burstDiameter: 170 },
      "10": { burstHeight: 330, burstDiameter: 320 },
    });
  });
});

describe("createFirework", () => {
  test("新しく置いた花火は10号になる", () => {
    const firework = createFirework("f1", launchSite);
    expect(firework).toMatchObject({
      shellSize: "10",
      burstHeight: 330,
      burstDiameter: 320,
      launchSite,
      groundHeight: null,
    });
  });
});

describe("selectShellSize", () => {
  test("5号を選ぶと開花高度190m・開花直径170mになる", () => {
    const firework = selectShellSize(createFirework("f1", launchSite), "5");
    expect(firework).toMatchObject({ shellSize: "5", burstHeight: 190, burstDiameter: 170 });
  });

  test("直接指定の花火でも号数を選ぶと目安値に戻る", () => {
    const custom = setBurstHeight(createFirework("f1", launchSite), 300);
    expect(selectShellSize(custom, "3")).toMatchObject({
      shellSize: "3",
      burstHeight: 120,
      burstDiameter: 60,
    });
  });
});

describe("開花高度・開花直径の直接指定", () => {
  test("10号の開花高度を300mにすると直接指定になる", () => {
    const firework = setBurstHeight(createFirework("f1", launchSite), 300);
    expect(firework).toMatchObject({
      shellSize: CUSTOM_SHELL,
      burstHeight: 300,
      burstDiameter: 320,
    });
  });

  test("開花直径を変えると直接指定になる", () => {
    const firework = setBurstDiameter(createFirework("f1", launchSite), 250);
    expect(firework).toMatchObject({ shellSize: CUSTOM_SHELL, burstDiameter: 250 });
  });

  test("目安値と同じ組み合わせに戻すとその号数として扱う", () => {
    const custom = setBurstHeight(createFirework("f1", launchSite), 300);
    expect(setBurstHeight(custom, 330).shellSize).toBe("10");
  });
});

describe("shellLabel", () => {
  test("号数の花火は号数で、直接指定の花火は「直接指定」と表示する", () => {
    const firework = createFirework("f1", launchSite);
    expect(shellLabel(firework)).toBe("10号");
    expect(shellLabel(setBurstHeight(firework, 300))).toBe("直接指定");
  });
});
