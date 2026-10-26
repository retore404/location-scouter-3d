import {
  type Firework,
  type ShellSize,
  createFirework,
  selectShellSize,
  setBurstDiameter,
  setBurstHeight,
} from "../domain/firework";
import type { GeoPoint } from "../domain/geoPoint";
import { type Viewpoint, createViewpoint } from "../domain/viewpoint";
import { assertNever } from "../assertNever";

type Mode = "overview" | "firstPerson";

/** 俯瞰モードで地図をクリックしたときに置くもの。 */
export type PlacementTool = "none" | "viewpoint" | "firework";

type DataSource = "buildings" | "terrain";

export type AppState = {
  readonly mode: Mode;
  readonly tool: PlacementTool;
  readonly viewpoint: Viewpoint | null;
  readonly fireworks: readonly Firework[];
  /** 花火の id を払い出すための通し番号。削除しても再利用しない。 */
  readonly fireworkSequence: number;
  readonly loadErrors: Readonly<Partial<Record<DataSource, string>>>;
};

export const initialAppState: AppState = {
  mode: "overview",
  tool: "none",
  viewpoint: null,
  fireworks: [],
  fireworkSequence: 0,
  loadErrors: {},
};

export type AppAction =
  | { type: "selectTool"; tool: PlacementTool }
  | { type: "placeAt"; position: GeoPoint }
  | { type: "updateViewpointPosition"; position: GeoPoint }
  | { type: "updateViewpointHeight"; heightAboveGround: number }
  | { type: "viewpointGroundHeightResolved"; position: GeoPoint; groundHeight: number }
  | { type: "updateLaunchSite"; id: string; launchSite: GeoPoint }
  | { type: "selectShellSize"; id: string; shellSize: ShellSize }
  | { type: "updateBurstHeight"; id: string; burstHeight: number }
  | { type: "updateBurstDiameter"; id: string; burstDiameter: number }
  | { type: "fireworkGroundHeightResolved"; id: string; launchSite: GeoPoint; groundHeight: number }
  | { type: "removeFirework"; id: string }
  | { type: "enterFirstPerson" }
  | { type: "exitFirstPerson" }
  | { type: "reportLoadError"; source: DataSource; message: string };

/** 地表の高さが取得済みの撮影地点があるときだけ、一人称モードに切り替えられる。 */
export function canEnterFirstPerson(state: AppState): boolean {
  return state.viewpoint !== null && state.viewpoint.groundHeight !== null;
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "selectTool":
      return state.mode === "overview" ? { ...state, tool: action.tool } : state;
    case "placeAt":
      return placeAt(state, action.position);
    case "updateViewpointPosition":
      return state.viewpoint
        ? {
            ...state,
            viewpoint: { ...state.viewpoint, position: action.position, groundHeight: null },
          }
        : state;
    case "updateViewpointHeight":
      return state.viewpoint
        ? {
            ...state,
            viewpoint: { ...state.viewpoint, heightAboveGround: action.heightAboveGround },
          }
        : state;
    case "viewpointGroundHeightResolved":
      // 取得中に位置が変わった場合、古い位置の結果は捨てる。
      return state.viewpoint && samePoint(state.viewpoint.position, action.position)
        ? { ...state, viewpoint: { ...state.viewpoint, groundHeight: action.groundHeight } }
        : state;
    case "updateLaunchSite":
      return updateFirework(state, action.id, (firework) => ({
        ...firework,
        launchSite: action.launchSite,
        groundHeight: null,
      }));
    case "selectShellSize":
      return updateFirework(state, action.id, (firework) =>
        selectShellSize(firework, action.shellSize),
      );
    case "updateBurstHeight":
      return updateFirework(state, action.id, (firework) =>
        setBurstHeight(firework, action.burstHeight),
      );
    case "updateBurstDiameter":
      return updateFirework(state, action.id, (firework) =>
        setBurstDiameter(firework, action.burstDiameter),
      );
    case "fireworkGroundHeightResolved":
      return updateFirework(state, action.id, (firework) =>
        samePoint(firework.launchSite, action.launchSite)
          ? { ...firework, groundHeight: action.groundHeight }
          : firework,
      );
    case "removeFirework":
      return { ...state, fireworks: state.fireworks.filter(({ id }) => id !== action.id) };
    case "enterFirstPerson":
      return canEnterFirstPerson(state) ? { ...state, mode: "firstPerson", tool: "none" } : state;
    case "exitFirstPerson":
      return { ...state, mode: "overview" };
    case "reportLoadError":
      return { ...state, loadErrors: { ...state.loadErrors, [action.source]: action.message } };
    default:
      return assertNever(action);
  }
}

// 置いた後は道具を解除し、意図しないクリックで地点が増えたり動いたりしないようにする。
function placeAt(state: AppState, position: GeoPoint): AppState {
  if (state.mode !== "overview") {
    return state;
  }
  switch (state.tool) {
    case "none":
      return state;
    case "viewpoint":
      return { ...state, tool: "none", viewpoint: createViewpoint(position) };
    case "firework": {
      const fireworkSequence = state.fireworkSequence + 1;
      return {
        ...state,
        tool: "none",
        fireworkSequence,
        fireworks: [...state.fireworks, createFirework(`firework-${fireworkSequence}`, position)],
      };
    }
    default:
      return assertNever(state.tool);
  }
}

function updateFirework(
  state: AppState,
  id: string,
  update: (firework: Firework) => Firework,
): AppState {
  return {
    ...state,
    fireworks: state.fireworks.map((firework) =>
      firework.id === id ? update(firework) : firework,
    ),
  };
}

function samePoint(a: GeoPoint, b: GeoPoint): boolean {
  return a.latitude === b.latitude && a.longitude === b.longitude;
}
