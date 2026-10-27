import { describe, expect, test } from "vitest";
import {
  type AppAction,
  type AppState,
  appReducer,
  canEnterFirstPerson,
  initialAppState,
} from "./appState";

const tokyo = { latitude: 35.71, longitude: 139.81 };
const yokohama = { latitude: 35.45, longitude: 139.63 };

function run(...actions: AppAction[]): AppState {
  return runFrom(initialAppState, ...actions);
}

function runFrom(state: AppState, ...actions: AppAction[]): AppState {
  return actions.reduce(appReducer, state);
}

describe("撮影地点", () => {
  test("撮影地点を置くと地上高1.5mで置かれ、道具が解除される", () => {
    const state = run(
      { type: "selectTool", tool: "viewpoint" },
      { type: "placeAt", position: tokyo },
    );
    expect(state.viewpoint).toEqual({
      position: tokyo,
      heightAboveGround: 1.5,
      groundHeight: null,
    });
    expect(state.tool).toBe("none");
  });

  test("置き直すと新しい位置の1つに置き換わる", () => {
    const state = run(
      { type: "selectTool", tool: "viewpoint" },
      { type: "placeAt", position: tokyo },
      { type: "selectTool", tool: "viewpoint" },
      { type: "placeAt", position: yokohama },
    );
    expect(state.viewpoint?.position).toEqual(yokohama);
  });

  test("道具を選んでいないクリックでは何も置かれない", () => {
    expect(run({ type: "placeAt", position: tokyo })).toEqual(initialAppState);
  });

  test("地上高を変更できる", () => {
    const state = run(
      { type: "selectTool", tool: "viewpoint" },
      { type: "placeAt", position: tokyo },
      { type: "updateViewpointHeight", heightAboveGround: 350 },
    );
    expect(state.viewpoint?.heightAboveGround).toBe(350);
  });

  test("位置を変えると地表の高さは取り直しになり、古い位置の取得結果は捨てる", () => {
    const state = run(
      { type: "selectTool", tool: "viewpoint" },
      { type: "placeAt", position: tokyo },
      { type: "updateViewpointPosition", position: yokohama },
      { type: "viewpointGroundHeightResolved", position: tokyo, groundHeight: 40 },
    );
    expect(state.viewpoint).toMatchObject({ position: yokohama, groundHeight: null });
    expect(
      appReducer(state, {
        type: "viewpointGroundHeightResolved",
        position: yokohama,
        groundHeight: 80,
      }).viewpoint?.groundHeight,
    ).toBe(80);
  });
});

describe("花火", () => {
  const twoFireworks = run(
    { type: "selectTool", tool: "firework" },
    { type: "placeAt", position: tokyo },
    { type: "selectTool", tool: "firework" },
    { type: "placeAt", position: yokohama },
  );

  test("複数置ける", () => {
    expect(twoFireworks.fireworks.map(({ id, launchSite }) => ({ id, launchSite }))).toEqual([
      { id: "firework-1", launchSite: tokyo },
      { id: "firework-2", launchSite: yokohama },
    ]);
  });

  test("号数・開花高度・開花直径を変更できる", () => {
    const state = runFrom(
      twoFireworks,
      { type: "selectShellSize", id: "firework-1", shellSize: "5" },
      { type: "updateBurstHeight", id: "firework-2", burstHeight: 300 },
      { type: "updateBurstDiameter", id: "firework-2", burstDiameter: 280 },
    );
    expect(state.fireworks[0]).toMatchObject({ shellSize: "5", burstHeight: 190 });
    expect(state.fireworks[1]).toMatchObject({
      shellSize: "custom",
      burstHeight: 300,
      burstDiameter: 280,
    });
  });

  test("打上地点を変えると地表の高さは取り直しになる", () => {
    const resolved = appReducer(twoFireworks, {
      type: "fireworkGroundHeightResolved",
      id: "firework-1",
      launchSite: tokyo,
      groundHeight: 38,
    });
    expect(resolved.fireworks[0]?.groundHeight).toBe(38);
    const moved = appReducer(resolved, {
      type: "updateLaunchSite",
      id: "firework-1",
      launchSite: yokohama,
    });
    expect(moved.fireworks[0]).toMatchObject({ launchSite: yokohama, groundHeight: null });
  });

  test("個別に削除でき、id は再利用しない", () => {
    const removed = appReducer(twoFireworks, { type: "removeFirework", id: "firework-1" });
    expect(removed.fireworks.map(({ id }) => id)).toEqual(["firework-2"]);
    const readded = runFrom(
      removed,
      { type: "selectTool", tool: "firework" },
      { type: "placeAt", position: tokyo },
    );
    expect(readded.fireworks.map(({ id }) => id)).toEqual(["firework-2", "firework-3"]);
  });
});

describe("モード", () => {
  const placed = run(
    { type: "selectTool", tool: "viewpoint" },
    { type: "placeAt", position: tokyo },
  );

  test("撮影地点がないときは一人称モードに切り替えられない", () => {
    expect(canEnterFirstPerson(initialAppState)).toBe(false);
    expect(appReducer(initialAppState, { type: "enterFirstPerson" }).mode).toBe("overview");
  });

  test("地表の高さを取得するまでは一人称モードに切り替えられない", () => {
    expect(canEnterFirstPerson(placed)).toBe(false);
  });

  test("撮影地点があれば一人称モードに切り替えられ、戻っても配置は保たれる", () => {
    const resolved = appReducer(placed, {
      type: "viewpointGroundHeightResolved",
      position: tokyo,
      groundHeight: 40,
    });
    const firstPerson = appReducer(resolved, { type: "enterFirstPerson" });
    expect(firstPerson.mode).toBe("firstPerson");
    const back = appReducer(firstPerson, { type: "exitFirstPerson" });
    expect(back).toEqual({ ...resolved, mode: "overview" });
  });

  test("一人称モードでは地点を置けない", () => {
    const firstPerson = run(
      { type: "selectTool", tool: "viewpoint" },
      { type: "placeAt", position: tokyo },
      { type: "viewpointGroundHeightResolved", position: tokyo, groundHeight: 40 },
      { type: "enterFirstPerson" },
      { type: "selectTool", tool: "firework" },
      { type: "placeAt", position: yokohama },
    );
    expect(firstPerson.fireworks).toEqual([]);
  });
});

describe("データ取得の失敗", () => {
  test("建物と地形の失敗をそれぞれ記録する", () => {
    const state = run(
      { type: "reportLoadError", source: "buildings", message: "建物を表示できません" },
      { type: "reportLoadError", source: "terrain", message: "地形を表示できません" },
    );
    expect(state.loadErrors).toEqual({
      buildings: "建物を表示できません",
      terrain: "地形を表示できません",
    });
  });
});

describe("画角枠", () => {
  test("アプリを開いた直後は、どの焦点距離も表示しない", () => {
    expect(initialAppState.shownFocalLengths).toEqual([]);
  });

  test("複数の焦点距離を選べ、定番の順に並ぶ", () => {
    const state = run(
      { type: "toggleFocalLength", focalLength: 85 },
      { type: "toggleFocalLength", focalLength: 24 },
    );
    expect(state.shownFocalLengths).toEqual([24, 85]);
  });

  test("選んだ焦点距離をもう一度切り替えると外れる", () => {
    const state = run(
      { type: "toggleFocalLength", focalLength: 50 },
      { type: "toggleFocalLength", focalLength: 35 },
      { type: "toggleFocalLength", focalLength: 50 },
    );
    expect(state.shownFocalLengths).toEqual([35]);
  });

  test("一人称モードでも切り替えられ、俯瞰モードに戻っても保たれる", () => {
    const firstPerson = run(
      { type: "selectTool", tool: "viewpoint" },
      { type: "placeAt", position: tokyo },
      { type: "viewpointGroundHeightResolved", position: tokyo, groundHeight: 40 },
      { type: "enterFirstPerson" },
      { type: "toggleFocalLength", focalLength: 24 },
    );
    expect(firstPerson.shownFocalLengths).toEqual([24]);
    const back = appReducer(firstPerson, { type: "exitFirstPerson" });
    expect(back.shownFocalLengths).toEqual([24]);
  });
});
