import { useEffect, useRef, useState } from "react";
import { type FocalLength, fieldOfView, frameSize } from "../domain/lens";

/** 画角枠の色。暗い空と明るい建物のどちらの上でも見えるよう、明るい色に暗い縁取りを付けて描く。 */
const FRAME_COLORS: Readonly<Record<FocalLength, string>> = {
  24: "#ff5252",
  28: "#ff9800",
  35: "#ffeb3b",
  40: "#c6ff00",
  50: "#00e676",
  75: "#1de9b6",
  85: "#00e5ff",
  100: "#448aff",
  200: "#e040fb",
};

type Props = {
  readonly focalLengths: readonly FocalLength[];
};

type Size = {
  readonly width: number;
  readonly height: number;
};

/**
 * 一人称モードの景色に重ねる画角枠。
 * 地図の領域いっぱいに置き、自身の大きさ（= Cesium の画面の大きさ）から、一人称モードのカメラと
 * 同じ計算で視野を求める。Cesium から視野を読み戻さないため、React 側と状態を同期せずに済む。
 */
export function LensFrames({ focalLengths }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>();

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const aspectRatio = size && size.width > 0 && size.height > 0 ? size.width / size.height : 0;
  const fov = aspectRatio > 0 ? fieldOfView(aspectRatio, focalLengths) : 0;

  return (
    <div ref={ref} className="lens-frames">
      {aspectRatio > 0 &&
        focalLengths.map((focalLength) => {
          const { width, height } = frameSize(focalLength, fov, aspectRatio);
          return (
            <div
              key={focalLength}
              className="lens-frame"
              style={{
                width: `${width * 100}%`,
                height: `${height * 100}%`,
                color: FRAME_COLORS[focalLength],
              }}
            >
              <span className="lens-frame-label">{focalLength}mm</span>
            </div>
          );
        })}
    </div>
  );
}
