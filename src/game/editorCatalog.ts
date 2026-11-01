import { GAME_EDITOR_CATALOG as common } from "@/game/editorCatalog";

/** Keep generic tools in Forge; this game supplies its own catalog data. */
export const GAME_EDITOR_CATALOG = {
  ...common,
  gameModeOptions: common.gameModeOptions.map((mode) => mode.id === "forge.defaultCamera"
    ? { ...mode, displayName: "Ridgebound — Prototip Kamera" }
    : mode),
};
