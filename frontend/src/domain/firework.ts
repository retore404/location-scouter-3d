import type { GeoPoint } from "./geoPoint";

export type ShellSize = "3" | "5" | "10";

/** 号数ではなく、開花高度・開花直径を直接指定した花火の区分。 */
export const CUSTOM_SHELL = "custom";

type ShellSizeOrCustom = ShellSize | typeof CUSTOM_SHELL;

type BurstDimensions = {
  /** 打上地点の地表から開花範囲の中心までの高さ（m）。 */
  readonly burstHeight: number;
  /** 開花範囲の直径（m）。 */
  readonly burstDiameter: number;
};

/**
 * 号数ごとの開花高度・開花直径の目安値。
 * 出典によって値に差があるため、複数の出典で確認できた号数だけを持つ。
 */
export const SHELL_PRESETS: Readonly<Record<ShellSize, BurstDimensions>> = {
  "3": { burstHeight: 120, burstDiameter: 60 },
  "5": { burstHeight: 190, burstDiameter: 170 },
  "10": { burstHeight: 330, burstDiameter: 320 },
};

export const SHELL_SIZES: readonly ShellSize[] = ["3", "5", "10"];

const DEFAULT_SHELL_SIZE: ShellSize = "10";

export type Firework = BurstDimensions & {
  readonly id: string;
  readonly launchSite: GeoPoint;
  /** launchSite の地表の楕円体高（m）。地形データからの取得が終わるまでは null。 */
  readonly groundHeight: number | null;
  readonly shellSize: ShellSizeOrCustom;
};

export function createFirework(id: string, launchSite: GeoPoint): Firework {
  return {
    id,
    launchSite,
    groundHeight: null,
    shellSize: DEFAULT_SHELL_SIZE,
    ...SHELL_PRESETS[DEFAULT_SHELL_SIZE],
  };
}

export function selectShellSize(firework: Firework, shellSize: ShellSize): Firework {
  return { ...firework, shellSize, ...SHELL_PRESETS[shellSize] };
}

export function setBurstHeight(firework: Firework, burstHeight: number): Firework {
  return withDimensions(firework, { burstHeight, burstDiameter: firework.burstDiameter });
}

export function setBurstDiameter(firework: Firework, burstDiameter: number): Firework {
  return withDimensions(firework, { burstHeight: firework.burstHeight, burstDiameter });
}

// 目安値と一致する組み合わせに戻した場合は、その号数として扱う。
function withDimensions(firework: Firework, dimensions: BurstDimensions): Firework {
  const matched = SHELL_SIZES.find((size) => {
    const preset = SHELL_PRESETS[size];
    return (
      preset.burstHeight === dimensions.burstHeight &&
      preset.burstDiameter === dimensions.burstDiameter
    );
  });
  return { ...firework, ...dimensions, shellSize: matched ?? CUSTOM_SHELL };
}

/** 号数の表示名。目安値と異なる値の花火は「直接指定」とする。 */
export function shellLabel(firework: Firework): string {
  return firework.shellSize === CUSTOM_SHELL ? "直接指定" : `${firework.shellSize}号`;
}
