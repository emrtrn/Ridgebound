import { createGameModule as createCommonGameModule } from "@/game/gameModule";
import type { ForgeGameModule } from "@/scene/ForgeGameModule";
import type { RuntimeServiceKey } from "@/scene/capabilities/RuntimeServices";
import type { BehaviorRegistryFactory } from "@/scene/capabilities/runtimeServiceKeys";
import { behaviorRegistryFactoryService, gameModeProviderService, saveGameCommandsService, uiPresenterService, uiViewModelService } from "@/scene/capabilities/runtimeServiceKeys";
import { createDepotGameMode } from "./m0/depotGameMode";
import type { DeliveryConfig, DepotConfig } from "./m0/depotRules";
import { BOARD_SCRIPT, createContractBoard } from "./m0/contractBoard";
import { actorInstanceEntityId } from "@engine/scene/actorInstance";
import { DEMO_CAPACITY_KG } from "./m0/m0Content";
import type { TransportPoints } from "./m0/transportHud";

/** Compose Forge runtime systems with Ridgebound's depot and contract rules. */
export function createGameModule(): ForgeGameModule {
  const common = createCommonGameModule();
  let depot: DepotConfig | null = null;
  let points: TransportPoints | null = null;
  let deliveryConfig: DeliveryConfig | null = null;
  const capacities = new Map<string, number>();
  let boardReady = false;
  let board: ReturnType<typeof createContractBoard> | null = null;
  return {
    ...common,
    id: "ridgebound.prototype",
    register(runtime) {
      common.register?.({ ...runtime, services: {
        ...runtime.services,
        provide<T>(key: RuntimeServiceKey<T>, value: T): void {
          if (key.id === behaviorRegistryFactoryService.id) {
            const factory = value as unknown as BehaviorRegistryFactory;
            runtime.services.provide(behaviorRegistryFactoryService, (host) => {
              const registry = factory(host);
              return { get: (id) => id === BOARD_SCRIPT ? board?.tick : registry.get(id) };
            });
          } else runtime.services.provide(key, value);
        },
      } });
      const publish = (fields: Record<string, string | number | boolean>) => {
        const store = runtime.services.resolve(uiViewModelService);
        store?.setFields(fields);
        store?.flush();
      };
      const saveStatus = () => {
        if (!runtime.services.resolve(saveGameCommandsService)) return "Kayıt kullanılamıyor; ilerleme yalnız bu oturumda.";
        const value = runtime.services.resolve(uiViewModelService)?.getField("save.slots.quick.status");
        if (typeof value !== "string") return "Kayıt kullanılamıyor.";
        if (value.startsWith("Saved")) return "Hızlı kayıt mevcut.";
        if (value === "Empty") return "Henüz hızlı kayıt yok.";
        if (value === "Save failed") return "Kayıt alınamadı; ilerleme yalnız bu oturumda. Tekrar kaydetmeyi deneyin.";
        if (value === "Load failed") return "Kayıt yüklenemedi.";
        return "Kayıt kullanılamıyor.";
      };
      board = createContractBoard({ publish, saveStatus, points: () => points, save() {
        runtime.services.resolve(saveGameCommandsService)?.handleUiMessage("save:write:quick");
      } });
      const provider = runtime.services.resolve(gameModeProviderService);
      if (!provider) throw new Error("Common Forge game mode catalog unavailable");
      const resolveCommonMode = provider.resolve.bind(provider);
      const truckMode = createDepotGameMode({
        config: () => depot,
        presenter: () => runtime.services.resolve(uiPresenterService),
        publish,
        contractAction: (action) => boardReady ? board?.action(action) ?? false : false,
        loadCargo(pointId, vehicleId) {
          const capacity = capacities.get(vehicleId);
          if (!boardReady || capacity === undefined) {
            publish({ "depot.notice": "Bu araç veya görev noktası için yükleme tanımlı değil." });
            return false;
          }
          return board?.load(pointId, vehicleId, capacity) ?? false;
        },
        telemetry: (live) => board?.updateHud(live),
        deliveryConfig: () => deliveryConfig,
        deliverCargo(pointId, vehicleId) {
          if (!boardReady || !capacities.has(vehicleId)) {
            board?.deliveryNotice("Bu araç veya görev noktası için teslim tanımlı değil.");
            return false;
          }
          return board?.deliver(pointId, vehicleId) ?? false;
        },
        deliveryNotice: (message) => board?.deliveryNotice(message),
      });
      provider.resolve = async (request) => request.gameModeId === "forge.vehicle"
        ? truckMode
        : resolveCommonMode(request);
    },
    async onLevelLoaded(context) {
      await common.onLevelLoaded?.(context);
      const placements = context.layout.instances.flatMap((group) => group.placements);
      const entry = placements.find((placement) => placement.id === "pickup" && placement.role === "logistics.pickup");
      const center = placements.find((placement) => placement.role === "building.transport.depot");
      const delivery = placements.find((placement) => placement.id === "delivery" && placement.role === "logistics.delivery");
      boardReady = placements.some((placement) => placement.role === "logistics.board" && placement.behavior?.script === BOARD_SCRIPT)
        && placements.some((placement) => placement.id === "pickup" && placement.role === "logistics.pickup")
        && placements.some((placement) => placement.id === "delivery" && placement.role === "logistics.delivery");
      depot = entry && center ? {
        entry: [...entry.position], focus: [center.position[0], entry.position[1], center.position[2]],
        pickupPointId: "pickup",
      } : null;
      points = entry && delivery ? { pickup: [...entry.position], delivery: [...delivery.position] } : null;
      deliveryConfig = delivery ? { pointId: "delivery", position: [...delivery.position] } : null;
      capacities.clear();
      (context.layout.actors ?? []).forEach((actor, index) => {
        const id = actorInstanceEntityId(index);
        if (actor.classRef === "assets/vehicles/gaz52/Script_Gaz52.actor.json" && context.entity(id)?.components.Vehicle) {
          capacities.set(id, DEMO_CAPACITY_KG);
        }
      });
    },
    update(deltaSeconds) { common.update?.(deltaSeconds); },
    onLevelUnloaded() { depot = null; points = null; deliveryConfig = null; capacities.clear(); boardReady = false; board?.reset(); common.onLevelUnloaded?.(); },
    dispose() { depot = null; points = null; deliveryConfig = null; capacities.clear(); boardReady = false; board?.reset(); common.dispose?.(); },
  };
}
