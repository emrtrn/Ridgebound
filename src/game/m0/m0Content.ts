import type { TransportContract } from "./transport";

/** Labeled prototype values. M1 mass/COM and the final economy are separate. */
export const DEMO_CAPACITY_KG = 2000;
export const DEMO_CONTRACT = {
  id: "m0-demo-supplies", cargoId: "m0-demo-cargo",
  profile: { id: "m0-demo-light", kind: "light", massKg: 500 },
  pickupPointId: "pickup", deliveryPointId: "delivery", fee: 100,
} as const satisfies TransportContract;
export const DEMO_CONTRACTS: Readonly<Record<string, TransportContract>> = {
  light: DEMO_CONTRACT,
  heavy: { ...DEMO_CONTRACT, id: "m0-demo-heavy-supplies", cargoId: "m0-demo-heavy-cargo", profile: { id: "m0-demo-heavy", kind: "heavy", massKg: 1500 } },
  overload: { ...DEMO_CONTRACT, id: "m0-demo-overload-supplies", cargoId: "m0-demo-overload-cargo", profile: { id: "m0-demo-overload", kind: "heavy", massKg: 2500 } },
};
export function cargoLabel(contract: TransportContract): string {
  return `${contract.profile.kind === "light" ? "Hafif" : "Ağır"} erzak · ${contract.profile.massKg} kg`;
}

/** Saved spline XZ centerline lengths measured with Forge splineToPolyline.
 * Not door-to-door distance, a GPS route, or a safety assessment.
 * A regression checks these numbers against the authored terrain definition.
 */
export const DEMO_ROUTES = [
  { id: "wb-road-main-route", name: "Ana yol", mapLengthM: 533 },
  { id: "wb-road-short-route", name: "Alternatif yol", mapLengthM: 435 },
] as const;
