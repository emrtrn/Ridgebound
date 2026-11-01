import { createGameModule as createCommonGameModule } from "@/game/gameModule";
import type { ForgeGameModule } from "@/scene/ForgeGameModule";

/** P1-B prototype only. Transport contracts and cargo rules belong to M0. */
export function createGameModule(): ForgeGameModule {
  const common = createCommonGameModule();
  let status: HTMLElement | null = null;
  const removeStatus = () => { status?.remove(); status = null; };
  return {
    ...common,
    id: "ridgebound.prototype",
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
      description.textContent = "Prototip alanı";
      const controls = document.createElement("div");
      controls.textContent = "WASD: hareket · Sağ fare: bakış · Q/E: alçal/yüksel";
      controls.style.cssText = "font-size:12px;color:#c6d3c7;margin-top:8px";
      status.append(title, description, controls);
      document.getElementById("ui-overlay")?.append(status);
    },
    onLevelUnloaded() { removeStatus(); common.onLevelUnloaded?.(); },
    dispose() { removeStatus(); common.dispose?.(); },
  };
}
