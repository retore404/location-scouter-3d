import {
  type Cartesian2,
  type Cartesian3,
  Math as CesiumMath,
  PerspectiveFrustum,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer,
} from "cesium";
import { type FocalLength, fieldOfView } from "../domain/lens";
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
  /** 視野（ラジアン）。一人称モードで画角枠に合わせて広げるため、戻すときに復元する。 */
  readonly fov: number | undefined;
};

/**
 * 一人称モードのカメラ操作。視点の位置は撮影地点に固定し、ドラッグ・スワイプで方位と仰角だけを変える。
 * Cesium 標準のカメラ操作は、位置が動いてしまうため一人称モードの間は無効にする。
 * 視野は、表示中の画角枠が画面に収まるように、焦点距離と画面の縦横比から決める。
 */
export class FirstPersonController {
  private readonly handler: ScreenSpaceEventHandler;
  private readonly resizeObserver: ResizeObserver;
  private readonly saved: SavedCamera;
  private position: Cartesian3;
  private direction: ViewDirection;
  private focalLengths: readonly FocalLength[];
  private dragStart: { screen: Cartesian2; direction: ViewDirection } | undefined;

  constructor(
    private readonly viewer: Viewer,
    position: Cartesian3,
    initialDirection: ViewDirection,
    focalLengths: readonly FocalLength[],
    private readonly onDirectionChange: (direction: ViewDirection) => void,
  ) {
    const { camera } = viewer;
    this.saved = {
      position: camera.positionWC.clone(),
      heading: camera.heading,
      pitch: camera.pitch,
      roll: camera.roll,
      fov: camera.frustum instanceof PerspectiveFrustum ? camera.frustum.fov : undefined,
    };
    viewer.scene.screenSpaceCameraController.enableInputs = false;
    this.position = position;
    this.direction = initialDirection;
    this.focalLengths = focalLengths;
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
    // 画面の縦横比が変わると、画角枠を収めるのに必要な視野も変わる。
    this.resizeObserver = new ResizeObserver(() => this.applyFieldOfView());
    this.resizeObserver.observe(viewer.scene.canvas);
    this.applyFieldOfView();
    this.apply();
  }

  /** 表示する画角枠の焦点距離が変わったときに、視野を決め直す。 */
  setFocalLengths(focalLengths: readonly FocalLength[]): void {
    this.focalLengths = focalLengths;
    this.applyFieldOfView();
  }

  /** 撮影地点の位置が変わったときに、向きを保ったまま視点を移す。 */
  moveTo(position: Cartesian3): void {
    this.position = position;
    this.apply();
  }

  /** 俯瞰モードに戻る。カメラ操作を有効に戻し、一人称モードに入る前の視点を復元する。 */
  destroy(): void {
    this.handler.destroy();
    this.resizeObserver.disconnect();
    if (this.viewer.isDestroyed()) {
      return;
    }
    this.viewer.scene.screenSpaceCameraController.enableInputs = true;
    const { frustum } = this.viewer.camera;
    if (frustum instanceof PerspectiveFrustum && this.saved.fov !== undefined) {
      frustum.fov = this.saved.fov;
    }
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

  private applyFieldOfView(): void {
    const { frustum } = this.viewer.camera;
    const { clientWidth, clientHeight } = this.viewer.scene.canvas;
    if (!(frustum instanceof PerspectiveFrustum) || clientWidth === 0 || clientHeight === 0) {
      return;
    }
    frustum.fov = CesiumMath.toRadians(fieldOfView(clientWidth / clientHeight, this.focalLengths));
    this.viewer.scene.requestRender();
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
