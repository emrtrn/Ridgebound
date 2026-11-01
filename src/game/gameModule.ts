import { createGameModule as createCommonGameModule } from "@/game/gameModule";
import type { ForgeGameModule } from "@/scene/ForgeGameModule";
import type { RuntimeServiceKey } from "@/scene/capabilities/RuntimeServices";
import type { BehaviorRegistryFactory } from "@/scene/capabilities/runtimeServiceKeys";
import { behaviorRegistryFactoryService, gameModeProviderService, saveGameCommandsService, uiPresenterService, uiViewModelService } from "@/scene/capabilities/runtimeServiceKeys";
import { createDepotGameMode } from "./m0/depotGameMode";
import type { DepotConfig } from "./m0/depotRules";
import { BOARD_SCRIPT, createContractBoard } from "./m0/contractBoard";

/** Compose Forge runtime systems with Ridgebound's depot and contract rules. */
export function createGameModule(): ForgeGameModule {
  const common = createCommonGameModule();
  let status: HTMLElement | null = null;
  let depot: DepotConfig | null = null;
  let boardReady = false;
  let board: ReturnType<typeof createContractBoard> | null = null;
  const removeStatus = () => { status?.remove(); status = null; };
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
        if (status && typeof fields["depot.active"] === "boolean") status.hidden = fields["depot.active"];
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
      board = createContractBoard({ publish, saveStatus, save() {
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
      });
      provider.resolve = async (request) => request.gameModeId === "forge.vehicle"
        ? truckMode
        : resolveCommonMode(request);
    },
    async onLevelLoaded(context) {
      await common.onLevelLoaded?.(context);
      const placements = context.layout.instances.flatMap((group) => group.placements);
      const entry = placements.find((placement) => placement.role === "logistics.pickup");
      const center = placements.find((placement) => placement.role === "building.transport.depot");
      boardReady = placements.some((placement) => placement.role === "logistics.board" && placement.behavior?.script === BOARD_SCRIPT)
        && placements.some((placement) => placement.id === "pickup" && placement.role === "logistics.pickup")
        && placements.some((placement) => placement.id === "delivery" && placement.role === "logistics.delivery");
      depot = entry && center ? {
        entry: [...entry.position], focus: [center.position[0], entry.position[1], center.position[2]],
      } : null;
      removeStatus();
      status = document.createElement("section");
      status.id = "ridgebound-status";
      status.dataset.gameModule = "ridgebound.prototype";
      status.style.cssText = "position:absolute;top:24px;left:24px;max-width:calc(100vw - 48px);padding:18px 22px;border:1px solid #768979;border-radius:8px;background:#17251feb;color:#f3eee1;font:15px/1.6 system-ui;pointer-events:none;box-sizing:border-box";
      const title = document.createElement("strong");
      title.textContent = "Ridgebound";
      title.style.cssText = "display:block;font-size:24px;letter-spacing:1px";
      const description = document.createElement("div");
      const driving = context.layout.worldSettings?.gameMode === "forge.vehicle";
      description.textContent = driving ? "M0 saha prototipi · Gaz52" : "Prototip alanı";
      const controls = document.createElement("div");
      controls.textContent = driving
        ? "W/S: gaz/fren · A/D: direksiyon · Space: el freni · E: depo · R: aracı düzelt · F8: ölçümler"
        : "WASD: hareket · Sağ fare: bakış · Q/E: alçal/yüksel";
      controls.style.cssText = "font-size:12px;color:#c6d3c7;margin-top:8px";
      status.append(title, description, controls);
      document.getElementById("ui-overlay")?.append(status);
    },
    update(deltaSeconds) { common.update?.(deltaSeconds); },
    onLevelUnloaded() { depot = null; boardReady = false; board?.reset(); removeStatus(); common.onLevelUnloaded?.(); },
    dispose() { depot = null; boardReady = false; board?.reset(); removeStatus(); common.dispose?.(); },
  };
}
