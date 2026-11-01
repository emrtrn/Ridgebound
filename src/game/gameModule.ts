import { createGameModule as createCommonGameModule } from "@/game/gameModule";
import type { ForgeGameModule } from "@/scene/ForgeGameModule";
import { gameModeProviderService } from "@/scene/capabilities/runtimeServiceKeys";
import { createVehicleGameMode } from "@/game/gameModes/vehicleGameMode";
import { DEFAULT_VEHICLE_CHASE_CAMERA } from "@/game/gameModes/vehicleCameraControl";

/** M0 content preview; contract rules are not connected to the runtime yet. */
export function createGameModule(): ForgeGameModule {
  const common = createCommonGameModule();
  let status: HTMLElement | null = null;
  const removeStatus = () => { status?.remove(); status = null; };
  return {
    ...common,
    id: "ridgebound.prototype",
    register(runtime) {
      common.register?.(runtime);
      const provider = runtime.services.resolve(gameModeProviderService);
      if (!provider) throw new Error("Common Forge game mode catalog unavailable");
      const resolveCommonMode = provider.resolve.bind(provider);
      // Compose Forge's driving session; only the long Gaz52's framing differs.
      const truckMode = createVehicleGameMode({
        ...DEFAULT_VEHICLE_CHASE_CAMERA, distance: 12, height: 5, lookHeight: 1.6,
      });
      provider.resolve = async (request) => request.gameModeId === "forge.vehicle"
        ? truckMode
        : resolveCommonMode(request);
    },
    async onLevelLoaded(context) {
      await common.onLevelLoaded?.(context);
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
        ? "W/S: gaz/fren · A/D: direksiyon · Space: el freni · E: aracı düzelt · F8: ölçümler"
        : "WASD: hareket · Sağ fare: bakış · Q/E: alçal/yüksel";
      controls.style.cssText = "font-size:12px;color:#c6d3c7;margin-top:8px";
      status.append(title, description, controls);
      document.getElementById("ui-overlay")?.append(status);
    },
    onLevelUnloaded() { removeStatus(); common.onLevelUnloaded?.(); },
    dispose() { removeStatus(); common.dispose?.(); },
  };
}
