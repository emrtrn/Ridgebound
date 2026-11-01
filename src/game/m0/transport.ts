/** Ridgebound rules only. Forge owns input, sensors, vehicles, UI and storage. */
export interface CargoProfile {
  readonly id: string;
  readonly kind: "light" | "heavy";
  readonly massKg: number;
}

export interface TransportContract {
  readonly id: string;
  readonly cargoId: string;
  readonly profile: CargoProfile;
  readonly pickupPointId: string;
  readonly deliveryPointId: string;
  /** Integer minor units; currency and actual amounts remain content decisions. */
  readonly fee: number;
}

export interface CarriedCargo {
  readonly id: string;
  readonly profileId: string;
  readonly vehicleId: string;
}

export interface TransportState {
  readonly schema: 1;
  /** Stable across load/retry; a future new job must use a new instance id. */
  readonly instanceId: string;
  readonly contract: TransportContract;
  readonly phase: "offered" | "accepted" | "loaded" | "delivered" | "completed";
  readonly cargo: CarriedCargo | null;
  readonly balance: number;
  readonly rewardPaid: boolean;
}

export type TransportCommand =
  | { readonly type: "accept"; readonly contractId: string }
  | { readonly type: "cancel" }
  | { readonly type: "load"; readonly pointId: string; readonly vehicleId: string; readonly capacityKg: number }
  | { readonly type: "deliver"; readonly pointId: string; readonly vehicleId: string; readonly cargoId: string }
  | { readonly type: "complete" };

export type TransportRejection = "wrong-contract" | "wrong-phase" | "wrong-point" | "invalid-vehicle" | "over-capacity" | "wrong-cargo";
export type TransportResult =
  | { readonly ok: true; readonly state: TransportState }
  | { readonly ok: false; readonly state: TransportState; readonly reason: TransportRejection };

const identifier = (value: string): boolean => value.trim().length > 0;
const money = (value: number): boolean => Number.isSafeInteger(value) && value >= 0;

export function createTransportState(contract: TransportContract, instanceId: string, balance = 0): TransportState {
  if (![instanceId, contract.id, contract.cargoId, contract.profile.id, contract.pickupPointId, contract.deliveryPointId].every(identifier)
    || !["light", "heavy"].includes(contract.profile.kind)
    || !Number.isFinite(contract.profile.massKg) || contract.profile.massKg <= 0
    || !money(contract.fee) || !money(balance)) {
    throw new Error("Invalid Ridgebound transport definition");
  }
  return {
    schema: 1, instanceId,
    contract: { ...contract, profile: { ...contract.profile } },
    phase: "offered", cargo: null, balance, rewardPaid: false,
  };
}

/** Call only after the Forge adapter verifies live range, vehicle and input. */
export function transitionTransport(state: TransportState, command: TransportCommand): TransportResult {
  const reject = (reason: TransportRejection): TransportResult => ({ ok: false, state, reason });
  const accept = (next: TransportState): TransportResult => ({ ok: true, state: next });
  switch (command.type) {
    case "accept":
      if (command.contractId !== state.contract.id) return reject("wrong-contract");
      if (state.phase !== "offered") return reject("wrong-phase");
      return accept({ ...state, phase: "accepted" });
    case "cancel":
      if (state.phase !== "accepted") return reject("wrong-phase");
      return accept({ ...state, phase: "offered" });
    case "load":
      if (state.phase !== "accepted") return reject("wrong-phase");
      if (command.pointId !== state.contract.pickupPointId) return reject("wrong-point");
      if (!identifier(command.vehicleId)) return reject("invalid-vehicle");
      if (!Number.isFinite(command.capacityKg) || command.capacityKg < state.contract.profile.massKg) return reject("over-capacity");
      return accept({ ...state, phase: "loaded", cargo: {
        id: state.contract.cargoId, profileId: state.contract.profile.id, vehicleId: command.vehicleId,
      } });
    case "deliver":
      if (state.phase !== "loaded") return reject("wrong-phase");
      if (command.pointId !== state.contract.deliveryPointId) return reject("wrong-point");
      if (!state.cargo || command.cargoId !== state.cargo.id || command.cargoId !== state.contract.cargoId
        || state.cargo.profileId !== state.contract.profile.id) return reject("wrong-cargo");
      if (command.vehicleId !== state.cargo.vehicleId) return reject("invalid-vehicle");
      return accept({ ...state, phase: "delivered", cargo: null });
    case "complete":
      // Completion, receipt and balance are one state change, never a UI effect.
      if (state.phase !== "delivered" || state.rewardPaid) return reject("wrong-phase");
      if (!money(state.balance + state.contract.fee)) throw new Error("Ridgebound balance exceeds safe integer range");
      return accept({ ...state, phase: "completed", rewardPaid: true, balance: state.balance + state.contract.fee });
  }
}
