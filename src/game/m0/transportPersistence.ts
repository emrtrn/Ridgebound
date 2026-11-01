import type { GameSaveRestoreRequest } from "@engine/persistence/saveGameState";
import type { GameplaySaveState } from "@/scene/capabilities/runtimeServiceKeys";
import { BOARD_SCRIPT, TRANSPORT_KEY, readBoardState } from "./contractBoard";
import type { RuntimeContext } from "@/scene/capabilities/RuntimeContext";

export interface TransportSaveBindings {
  readonly levelPath: string;
  readonly boardId: string | null;
  readonly vehicleIds: readonly string[];
}

/** Authored ids are positional in Forge; never guess a migration after a scene edit. */
export function transportSaveBindings(context: RuntimeContext, vehicleIds: readonly string[]): TransportSaveBindings {
  const boards = context.entities.filter(entity => entity.components.Behavior?.scriptId === BOARD_SCRIPT);
  return { levelPath: context.levelPath, boardId: boards.length === 1 ? boards[0]!.id : null, vehicleIds };
}

export function transportRestoreError(request: GameSaveRestoreRequest, bindings: TransportSaveBindings): string | null {
  const entries = request.persistentState.filter(entry => entry.key.startsWith("ridgebound.transport."));
  const entry = entries[0];
  if (request.levelPath !== bindings.levelPath || !bindings.boardId || entries.length !== 1
    || !entry || entry.key !== TRANSPORT_KEY || entry.entityId !== bindings.boardId) {
    return "Kayıt bu sahnenin görev panosuyla uyumlu değil. İlerleme uygulanmadı; kayıt korunuyor.";
  }
  const state = readBoardState(entry.value);
  if (!state) return "Görev kaydı bozuk veya sürümü uyumsuz. İlerleme uygulanmadı; kayıt korunuyor.";
  if (state.cargo && (!bindings.vehicleIds.includes(state.cargo.vehicleId)
    || !request.vehicles.some(vehicle => vehicle.entityId === state.cargo!.vehicleId))) {
    return "Kayıttaki taşıyıcı araç bu sahnede doğrulanamadı. İlerleme uygulanmadı; kayıt korunuyor.";
  }
  return null;
}

/** Compose the existing Forge capture/restore bridge; storage and travel stay in Forge. */
export function createTransportPersistence(native: GameplaySaveState, blocked: (message: string) => void) {
  let ready = false;
  let pending: GameSaveRestoreRequest | null = null;
  let bindings: TransportSaveBindings | null = null;
  let loadWasReady = false;
  let loading = false;
  const bridge: GameplaySaveState = {
    capture() {
      if (!ready || !bindings) return null;
      const payload = native.capture();
      if (!payload) return null;
      const error = transportRestoreError({ levelPath: payload.activeLevelPath, player: payload.player,
        persistentState: payload.flags, vehicles: payload.vehicles ?? [], drivingVehicleId: payload.drivingVehicleId ?? null }, bindings);
      if (error) { ready = false; blocked(error); return null; }
      return payload;
    },
    restore(request) { ready = false; loading = true; pending = request; },
  };
  return {
    bridge,
    canMutate: () => ready,
    isLoading: () => loading,
    beginLoad() { loadWasReady = ready; ready = false; loading = true; },
    cancelLoad() { ready = loadWasReady; loading = false; },
    unload() { ready = false; bindings = null; },
    levelLoaded(current: TransportSaveBindings) {
      loading = false;
      bindings = current;
      const request = pending;
      pending = null;
      if (request) {
        const error = transportRestoreError(request, current);
        if (error) { blocked(error); return; }
        native.restore(request);
      }
      ready = true;
    },
  };
}
