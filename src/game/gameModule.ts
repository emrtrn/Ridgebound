import { createGameModule as createCommonGameModule } from "@/game/gameModule";
import type { ForgeGameModule } from "@/scene/ForgeGameModule";
import type { RuntimeServiceKey } from "@/scene/capabilities/RuntimeServices";
import type { BehaviorRegistryFactory } from "@/scene/capabilities/runtimeServiceKeys";
import { behaviorRegistryFactoryService, gameModeProviderService, gameplaySaveStateService, saveGameCommandsService, uiPresenterService, uiViewModelService } from "@/scene/capabilities/runtimeServiceKeys";
import { createDepotGameMode } from "./m0/depotGameMode";
import type { DeliveryConfig, DepotConfig } from "./m0/depotRules";
import { BOARD_SCRIPT, createContractBoard } from "./m0/contractBoard";
import { actorInstanceEntityId, actorInstanceTransform } from "@engine/scene/actorInstance";
import { DEMO_CAPACITY_KG } from "./m0/m0Content";
import type { TransportPoints } from "./m0/transportHud";
import type { TransformComponent } from "@engine/scene/components";
import { readSaveGameUiCommand } from "@engine/persistence/saveGameSlots";
import { createTransportPersistence, transportSaveBindings } from "./m0/transportPersistence";

/** Compose Forge runtime systems with Ridgebound's depot and contract rules. */
export function createGameModule(): ForgeGameModule {
  const common = createCommonGameModule();
  let depot: DepotConfig | null = null;
  let points: TransportPoints | null = null;
  let deliveryConfig: DeliveryConfig | null = null;
  const capacities = new Map<string, number>();
  const recovery = new Map<string, TransformComponent>();
  let persistence: ReturnType<typeof createTransportPersistence> | null = null;
  let installSaveCommands = () => {};
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
        if (value === "Loading") return "Kayıt yükleniyor; işlemlerin tamamlanmasını bekleyin.";
        return "Kayıt kullanılamıyor.";
      };
      const nativeSave = runtime.services.resolve(gameplaySaveStateService);
      if (!nativeSave) throw new Error("Forge save state bridge unavailable");
      const capture = nativeSave.capture.bind(nativeSave);
      const restore = nativeSave.restore.bind(nativeSave);
      persistence = createTransportPersistence({ capture, restore }, message => board?.blockRestore(message));
      nativeSave.capture = persistence.bridge.capture;
      nativeSave.restore = persistence.bridge.restore;
      let commandsInstalled = false;
      installSaveCommands = () => {
        const commandService = runtime.services.resolve(saveGameCommandsService);
        if (commandService && !commandsInstalled) {
          const commands = { ...commandService };
          commandsInstalled = true;
          Object.assign(commandService, {
            ...commands,
            handleUiMessage(message: string) {
              const command = readSaveGameUiCommand(message);
              if (command?.kind !== "load") return commands.handleUiMessage(message);
              if (persistence?.isLoading()) return true;
              persistence?.beginLoad();
              // Clear a stale Empty/Load failed status before Forge tries the slot.
              runtime.services.resolve(uiViewModelService)?.setField(`save.slots.${command.slot}.status`, "Loading");
              const handled = commands.handleUiMessage(message);
              const status = runtime.services.resolve(uiViewModelService)?.getField(`save.slots.${command.slot}.status`);
              if (status === "Empty" || status === "Load failed") persistence?.cancelLoad();
              return handled;
            },
            requestSaveGameLoad(payload: unknown) {
              if (persistence?.isLoading()) return false;
              persistence?.beginLoad();
              const ok = commands.requestSaveGameLoad(payload);
              if (!ok) persistence?.cancelLoad();
              return ok;
            },
          });
        }
      };
      board = createContractBoard({ publish, saveStatus, points: () => points, canMutate: () => persistence?.canMutate() ?? false, save() {
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
        recoveryTransform: id => persistence?.canMutate() ? recovery.get(id) ?? null : null,
        recovered: () => board?.recovered(),
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
      recovery.clear();
      (context.layout.actors ?? []).forEach((actor, index) => {
        const id = actorInstanceEntityId(index);
        if (actor.classRef === "assets/vehicles/gaz52/Script_Gaz52.actor.json" && context.entity(id)?.components.Vehicle) {
          capacities.set(id, DEMO_CAPACITY_KG);
          const pose = actorInstanceTransform(actor);
          recovery.set(id, { ...pose, rotation: [0, pose.rotation[1], 0] });
        }
      });
      installSaveCommands();
      persistence?.levelLoaded(transportSaveBindings(context, [...capacities.keys()]));
    },
    update(deltaSeconds) { common.update?.(deltaSeconds); },
    onLevelUnloaded() { persistence?.unload(); recovery.clear(); depot = null; points = null; deliveryConfig = null; capacities.clear(); boardReady = false; board?.reset(); common.onLevelUnloaded?.(); },
    dispose() { depot = null; points = null; deliveryConfig = null; capacities.clear(); boardReady = false; board?.reset(); common.dispose?.(); },
  };
}
