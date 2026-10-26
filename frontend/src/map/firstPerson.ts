import {
  type Cartesian2,
  type Cartesian3,
  Math as CesiumMath,
  PerspectiveFrustum,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer,
} from "cesium";
import type { ViewDirection } from "../geo/sightLine";

const MIN_PITCH = -90;
const MAX_PITCH = 90;
/** 画角を取得できない場合に使う縦の画角（度）。 */
const DEFAULT_VERTICAL_FOV = 60;

/** 俯瞰モードに戻るときに復元するカメラの状態。 */
type SavedCamera = {
  readonly position: Cartesian3;
  readonly heading: number;
  readonly pitch: number;
  readonly roll: number;
};

/**
 * 一人称モードのカメラ操作。視点の位置は撮影地点に固定し、ドラッグ・スワイプで方位と仰角だけを変える。
 * Cesium 標準のカメラ操作は、位置が動いてしまうため一人称モードの間は無効にする。
 */
export class FirstPersonController {
  private readonly handler: ScreenSpaceEventHandler;
  private readonly saved: SavedCamera;
  private position: Cartesian3;
  private direction: ViewDirection;
  private dragStart: { screen: Cartesian2; direction: ViewDirection } | undefined;

  constructor(
    private readonly viewer: Viewer,
    position: Cartesian3,
    initialDirection: ViewDirection,
    private readonly onDirectionChange: (direction: ViewDirection) => void,
  ) {
    const { camera } = viewer;
    this.saved = {
      position: camera.positionWC.clone(),
      heading: camera.heading,
      pitch: camera.pitch,
      roll: camera.roll,
    };
    viewer.scene.screenSpaceCameraController.enableInputs = false;
    this.position = position;
    this.direction = initialDirection;
    this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    this.handler.setInputAction(({ position: screen }: { position: Cartesian2 }) => {
      this.dragStart = { screen: screen.clone(), direction: this.direction };
    }, ScreenSpaceEventType.LEFT_DOWN);
    this.handler.setInputAction(({ endPosition }: { endPosition: Cartesian2 }) => {
      this.drag(endPosition);
    }, ScreenSpaceEventType.MOUSE_MOVE);
    this.handler.setInputAction(() => {
      this.dragStart = undefined;
    }, ScreenSpaceEventType.LEFT_UP);
    this.apply();
  }

  /** 撮影地点の位置が変わったときに、向きを保ったまま視点を移す。 */
  moveTo(position: Cartesian3): void {
    this.position = position;
    this.apply();
  }

  /** 俯瞰モードに戻る。カメラ操作を有効に戻し、一人称モードに入る前の視点を復元する。 */
  destroy(): void {
    this.handler.destroy();
    if (this.viewer.isDestroyed()) {
      return;
    }
    this.viewer.scene.screenSpaceCameraController.enableInputs = true;
    this.viewer.camera.setView({
      destination: this.saved.position,
      orientation: { heading: this.saved.heading, pitch: this.saved.pitch, roll: this.saved.roll },
    });
    this.viewer.scene.requestRender();
  }

  // 画面の端から端までドラッグすると、ちょうど画角ぶん視線が回るようにする。
  private drag(screen: Cartesian2): void {
    if (!this.dragStart) {
      return;
    }
    const degreesPerPixel = this.verticalFovDegrees() / this.viewer.scene.canvas.clientHeight;
    const dx = screen.x - this.dragStart.screen.x;
    const dy = screen.y - this.dragStart.screen.y;
    const start = this.dragStart.direction;
    this.direction = {
      heading: (((start.heading - dx * degreesPerPixel) % 360) + 360) % 360,
      pitch: Math.min(MAX_PITCH, Math.max(MIN_PITCH, start.pitch + dy * degreesPerPixel)),
    };
    this.apply();
  }

  private verticalFovDegrees(): number {
    const { frustum } = this.viewer.camera;
    return frustum instanceof PerspectiveFrustum && frustum.fovy !== undefined
      ? CesiumMath.toDegrees(frustum.fovy)
      : DEFAULT_VERTICAL_FOV;
  }

  private apply(): void {
    this.viewer.camera.setView({
      destination: this.position,
      orientation: {
        heading: CesiumMath.toRadians(this.direction.heading),
        pitch: CesiumMath.toRadians(this.direction.pitch),
        roll: 0,
      },
    });
    this.viewer.scene.requestRender();
    this.onDirectionChange(this.direction);
  }
}
