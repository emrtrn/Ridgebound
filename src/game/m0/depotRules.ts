/** Prototype tuning; these are not final content or handling acceptance values. */
export const DEPOT_LIMITS = {
  range: 10, heightTolerance: 3, stoppedSpeed: 0.25,
  pitchDeg: 55, yawMin: 10, yawMax: 80,
  distanceMin: 24, distanceMax: 50, panLimit: 8,
} as const;

export interface DepotConfig {
  readonly entry: readonly [number, number, number];
  readonly focus: readonly [number, number, number];
}

export function depotEntryStatus(config: DepotConfig | null, position: readonly number[] | null, speed: number): "unavailable" | "far" | "moving" | "ready" {
  if (!config || !position || position.length !== 3 || !position.every(Number.isFinite) || !Number.isFinite(speed)) return "unavailable";
  if (Math.hypot(position[0]! - config.entry[0], position[2]! - config.entry[2]) > DEPOT_LIMITS.range
    || Math.abs(position[1]! - config.entry[1]) > DEPOT_LIMITS.heightTolerance) return "far";
  return Math.abs(speed) <= DEPOT_LIMITS.stoppedSpeed ? "ready" : "moving";
}

export interface DepotView { readonly yawDeg: number; readonly distance: number; readonly panX: number; readonly panZ: number }
export const INITIAL_DEPOT_VIEW: DepotView = { yawDeg: 45, distance: 36, panX: 0, panZ: 0 };
export function limitDepotView(view: DepotView): DepotView {
  const limit = (value: number, min: number, max: number, fallback: number) => Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  return {
    yawDeg: limit(view.yawDeg, DEPOT_LIMITS.yawMin, DEPOT_LIMITS.yawMax, 45),
    distance: limit(view.distance, DEPOT_LIMITS.distanceMin, DEPOT_LIMITS.distanceMax, 36),
    panX: limit(view.panX, -DEPOT_LIMITS.panLimit, DEPOT_LIMITS.panLimit, 0),
    panZ: limit(view.panZ, -DEPOT_LIMITS.panLimit, DEPOT_LIMITS.panLimit, 0),
  };
}
