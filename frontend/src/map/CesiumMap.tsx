import { ScreenSpaceEventHandler, ScreenSpaceEventType, type Cartesian2 } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { type Dispatch, useEffect, useRef, useState } from "react";
import { fetchBuildingTilesets } from "../data/plateauCatalog";
import type { GeoPoint } from "../domain/geoPoint";
import {
  type ViewDirection,
  directionTo,
  nearestFirework,
  viewpointPosition,
} from "../geo/sightLine";
import type { AppAction, AppState } from "../state/appState";
import { syncEntities } from "./entities";
import { FirstPersonController } from "./firstPerson";
import { sampleGroundHeight } from "./groundHeight";
import { pickGeoPoint } from "./picking";
import { type MapViewer, addBuildingTilesets, createViewer } from "./viewer";

const TERRAIN_ERROR = "地形データを取得できないため、地形を表示できません。";
const BUILDINGS_ERROR = "建物データを取得できないため、建物を表示できません。";

/** 花火がないときの一人称モード開始時の向き（北・水平）。 */
const DEFAULT_DIRECTION: ViewDirection = { heading: 0, pitch: 0 };

type Props = {
  readonly state: AppState;
  readonly dispatch: Dispatch<AppAction>;
  readonly onViewDirectionChange: (direction: ViewDirection) => void;
};

/**
 * Cesium の3D地図。状態の正は React 側に置き、このコンポーネントは状態を表示へ反映して、
 * クリックや地形の取得結果を action として返す。
 */
export function CesiumMap({ state, dispatch, onViewDirectionChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapViewer, setMapViewer] = useState<MapViewer>();
  const stateRef = useRef(state);
  const firstPersonRef = useRef<FirstPersonController>(undefined);
  const pendingGroundHeights = useRef(new Set<string>());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Viewer の生成と、建物データの読み込み。
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }
    const created = createViewer(container, () =>
      dispatch({ type: "reportLoadError", source: "terrain", message: TERRAIN_ERROR }),
    );
    setMapViewer(created);
    let active = true;
    const reportBuildingsError = (message: string) => {
      if (active) {
        dispatch({ type: "reportLoadError", source: "buildings", message });
      }
    };
    fetchBuildingTilesets()
      .then(async (tilesets) => {
        const failed = await addBuildingTilesets(created.viewer, tilesets);
        if (failed === tilesets.length) {
          reportBuildingsError(BUILDINGS_ERROR);
        } else if (failed > 0) {
          reportBuildingsError(
            `建物データの一部（${tilesets.length}件中${failed}件）を取得できないため、一部の地域の建物を表示できません。`,
          );
        }
      })
      .catch(() => reportBuildingsError(BUILDINGS_ERROR));
    return () => {
      active = false;
      created.viewer.destroy();
      setMapViewer(undefined);
    };
  }, [dispatch]);

  // 俯瞰モードで地図をクリックした位置に、選択中の道具で地点を置く。
  useEffect(() => {
    if (!mapViewer) {
      return undefined;
    }
    const { scene } = mapViewer.viewer;
    const handler = new ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(({ position }: { position: Cartesian2 }) => {
      const { mode, tool } = stateRef.current;
      if (mode !== "overview" || tool === "none") {
        return;
      }
      const picked = pickGeoPoint(scene, position);
      if (picked) {
        dispatch({ type: "placeAt", position: picked });
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
    return () => handler.destroy();
  }, [mapViewer, dispatch]);

  // 地表の高さが未取得の撮影地点・花火について、地形データから取得する。
  useEffect(() => {
    if (!mapViewer) {
      return;
    }
    const request = (key: string, position: GeoPoint, resolve: (groundHeight: number) => void) => {
      const requestKey = `${key}@${position.latitude},${position.longitude}`;
      if (pendingGroundHeights.current.has(requestKey)) {
        return;
      }
      pendingGroundHeights.current.add(requestKey);
      void sampleGroundHeight(mapViewer.terrainProvider, position).then((groundHeight) => {
        pendingGroundHeights.current.delete(requestKey);
        resolve(groundHeight);
      });
    };
    const { viewpoint, fireworks } = state;
    if (viewpoint && viewpoint.groundHeight === null) {
      const { position } = viewpoint;
      request("viewpoint", position, (groundHeight) =>
        dispatch({ type: "viewpointGroundHeightResolved", position, groundHeight }),
      );
    }
    for (const { id, launchSite, groundHeight } of fireworks) {
      if (groundHeight === null) {
        request(id, launchSite, (resolved) =>
          dispatch({
            type: "fireworkGroundHeightResolved",
            id,
            launchSite,
            groundHeight: resolved,
          }),
        );
      }
    }
  }, [mapViewer, state, dispatch]);

  // 撮影地点と花火の表示。
  useEffect(() => {
    if (mapViewer) {
      syncEntities(mapViewer.viewer, {
        viewpoint: state.viewpoint,
        fireworks: state.fireworks,
        showViewpoint: state.mode === "overview",
      });
    }
  }, [mapViewer, state.viewpoint, state.fireworks, state.mode]);

  // 一人称モードの開始と終了。開始時は最も近い花火の開花範囲の中心を向く。
  useEffect(() => {
    if (!mapViewer || state.mode !== "firstPerson") {
      return undefined;
    }
    const { viewpoint, fireworks, shownFocalLengths } = stateRef.current;
    const position = viewpoint ? viewpointPosition(viewpoint) : undefined;
    if (!position) {
      return undefined;
    }
    const nearest = nearestFirework(position, fireworks);
    const controller = new FirstPersonController(
      mapViewer.viewer,
      position,
      nearest ? directionTo(position, nearest.center) : DEFAULT_DIRECTION,
      shownFocalLengths,
      onViewDirectionChange,
    );
    firstPersonRef.current = controller;
    return () => {
      firstPersonRef.current = undefined;
      controller.destroy();
    };
  }, [mapViewer, state.mode, onViewDirectionChange]);

  // 一人称モード中に撮影地点が変わったら、向きを保ったまま視点を移す。
  useEffect(() => {
    const position = state.viewpoint ? viewpointPosition(state.viewpoint) : undefined;
    if (position) {
      firstPersonRef.current?.moveTo(position);
    }
  }, [state.viewpoint]);

  // 一人称モード中に画角枠の焦点距離が変わったら、視野を決め直す。
  useEffect(() => {
    firstPersonRef.current?.setFocalLengths(state.shownFocalLengths);
  }, [state.shownFocalLengths]);

  return <div ref={containerRef} className="cesium-map" />;
}
