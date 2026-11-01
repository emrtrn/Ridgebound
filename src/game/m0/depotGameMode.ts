import { Vector3 } from "three";
import { DEFAULT_INPUT_BINDINGS } from "@engine/input/defaultInputBindings";
import { PARKED_VEHICLE_INPUT, stoppingInput } from "@/game/gameModes/vehicleEntry";
import { createVehicleGameMode } from "@/game/gameModes/vehicleGameMode";
import { DEFAULT_VEHICLE_CHASE_CAMERA } from "@/game/gameModes/vehicleCameraControl";
import { DEFAULT_RTS_CAMERA_SETTINGS, rtsCameraPosition, rtsPanStep, zoomDistance } from "@/game/gameModes/rtsCameraControl";
import { PlayerCameraManager } from "@/game/playerCameraManager";
import type { GameModeContext, GameModeDefinition, GameModeSession } from "@/scene/gameModeTypes";
import type { RuntimeUiPresenter } from "@/scene/capabilities/runtimeServiceKeys";
import { depotEntryStatus, INITIAL_DEPOT_VIEW, limitDepotView, DEPOT_LIMITS, type DepotConfig, type DepotView } from "./depotRules";

export const DEPOT_WIDGET_ID = "ridgebound-depot";
export interface DepotModeHost {
  config(): DepotConfig | null;
  presenter(): RuntimeUiPresenter | undefined;
  publish(fields: Record<string, string | number | boolean>): void;
}

/** The existing Forge driving session remains the sole driving implementation. */
export function createDepotGameMode(host: DepotModeHost): GameModeDefinition {
  const driving = createVehicleGameMode({ ...DEFAULT_VEHICLE_CHASE_CAMERA, distance: 12, height: 5, lookHeight: 1.6 });
  return {
    ...driving,
    displayName: "Ridgebound — Sürüş / Depo",
    createSession: (context) => new DepotSession(context, driving.createSession(context), host),
  };
}

class DepotSession implements GameModeSession {
  readonly playerState;
  readonly gameState;
  private depot: DepotConfig | null = null;
  private parkedVehicleId: string | null = null;
  private view: DepotView = INITIAL_DEPOT_VIEW;
  private readonly camera: PlayerCameraManager;
  private readonly position = new Vector3();
  private lastPosition: Vector3 | null = null;
  private planarSpeed = 0;
  private releaseControls = false;
  private unsubscribe: (() => void) | undefined;
  private disposed = false;

  constructor(private readonly context: GameModeContext, private readonly driving: GameModeSession, private readonly host: DepotModeHost) {
    this.playerState = driving.playerState;
    this.gameState = driving.gameState;
    this.camera = new PlayerCameraManager(context.camera);
    context.actions.bind("KeyE", "ridgebound.depot");
    context.actions.bind("KeyR", "interact");
  }

  spawnDefaultPawn(): void { this.driving.spawnDefaultPawn(); }
  possess(): void {
    this.driving.possess();
    this.unsubscribe = this.context.onScriptMessage?.("ui-action", (event) => {
      if (this.disposed || !this.depot || !this.parkedVehicleId) return;
      const message = event.payload?.message;
      if (typeof message !== "string" || !message.startsWith("ridgebound:depot:")) return;
      const action = message.slice("ridgebound:depot:".length);
      if (action === "return") { this.leaveDepot(); return; }
      if (action === "center") this.view = INITIAL_DEPOT_VIEW;
      if (action === "left" || action === "right") this.view = { ...this.view, yawDeg: this.view.yawDeg + (action === "left" ? -10 : 10) };
      if (action === "near" || action === "far") this.view = { ...this.view, distance: zoomDistance(this.view.distance, action === "near" ? -1 : 1, { ...DEFAULT_RTS_CAMERA_SETTINGS, minDistance: DEPOT_LIMITS.distanceMin, maxDistance: DEPOT_LIMITS.distanceMax }) };
      const pan = { north: [1, 0], south: [-1, 0], west: [0, -1], east: [0, 1] }[action];
      if (pan) {
        const step = rtsPanStep({ forward: pan[0]!, right: pan[1]! }, this.view.yawDeg, 2, 1);
        this.view = { ...this.view, panX: this.view.panX + step.dx, panZ: this.view.panZ + step.dz };
      }
      this.view = limitDepotView(this.view);
    });
  }

  private park(id: string): void {
    const speed = this.context.vehicles?.state(id)?.forwardSpeed ?? 0;
    this.context.vehicles?.setInput(id, Math.abs(speed) > 0.15 ? stoppingInput(speed) : PARKED_VEHICLE_INPUT);
  }

  beforeEngineUpdate(deltaSeconds: number): void {
    const id = this.playerState.pawnEntityId;
    if (this.depot && this.parkedVehicleId) { this.park(this.parkedVehicleId); return; }
    const heldControl = ["move-forward", "move-back", "move-left", "move-right", "jump", "interact", "ridgebound.depot"].some((action) => this.context.actions.held(action));
    if (this.releaseControls && !heldControl) this.releaseControls = false;
    if (id && (this.releaseControls || this.context.getInputMode() === "ui")) { this.park(id); return; }
    const config = this.host.config();
    const object = id ? this.context.vehicles?.object(id) : null;
    const state = id ? this.context.vehicles?.state(id) : null;
    const speed = Math.max(Math.abs(state?.forwardSpeed ?? Infinity), this.planarSpeed);
    const status = depotEntryStatus(config, object ? object.getWorldPosition(this.position).toArray() : null, speed);
    if (this.context.actions.pressed("ridgebound.depot") && status === "ready" && config && id) {
      const presenter = this.host.presenter();
      if (presenter && presenter.screenDepth() === 0 && presenter.pushWidget(DEPOT_WIDGET_ID)) {
        this.depot = config;
        this.parkedVehicleId = id;
        this.view = INITIAL_DEPOT_VIEW;
        this.host.publish({ "depot.notice": "" });
        this.context.setInputMode("ui");
        this.context.setPointerLookMode("right-drag");
        this.context.setMouseCursorVisible(true);
        this.park(id);
        return;
      }
    }
    this.driving.beforeEngineUpdate?.(deltaSeconds);
  }

  private leaveDepot(): void {
    const id = this.parkedVehicleId;
    if (!id || !this.context.vehicles?.object(id)) {
      this.host.publish({ "depot.notice": "Araç bulunamadı. Sürüşe dönülemiyor." });
      if (this.host.presenter()?.screenDepth() === 0) this.host.presenter()?.pushWidget(DEPOT_WIDGET_ID);
      this.context.setInputMode("ui");
      return;
    }
    this.host.presenter()?.clearScreens();
    this.parkedVehicleId = null;
    this.depot = null;
    this.releaseControls = true;
    this.driving.possess(); // Same session and pawn: never re-spawn/select a car.
    this.context.consumeLookDelta();
  }

  update(deltaSeconds: number): void {
    const id = this.playerState.pawnEntityId;
    const object = id ? this.context.vehicles?.object(id) : null;
    if (object) {
      object.getWorldPosition(this.position);
      this.planarSpeed = this.lastPosition && deltaSeconds > 0
        ? Math.hypot(this.position.x - this.lastPosition.x, this.position.z - this.lastPosition.z) / deltaSeconds : 0;
      this.lastPosition = this.position.clone();
    } else { this.planarSpeed = 0; this.lastPosition = null; }
    if (this.depot) {
      // Escape is the existing screen-stack Back action, labelled in the panel.
      if (this.host.presenter()?.screenDepth() === 0) this.leaveDepot();
      if (this.depot) {
        const target = { x: this.depot.focus[0] + this.view.panX, y: this.depot.focus[1], z: this.depot.focus[2] + this.view.panZ };
        const spot = rtsCameraPosition(target, this.view.distance, { ...DEFAULT_RTS_CAMERA_SETTINGS, yawDeg: this.view.yawDeg, pitchDeg: DEPOT_LIMITS.pitchDeg });
        this.camera.setViewTarget({ source: "ridgebound-depot", pose: { position: [spot.x, spot.y, spot.z], target: [target.x, target.y, target.z] } });
        this.camera.update(deltaSeconds);
      }
    }
    if (!this.depot) this.driving.update(deltaSeconds);
    const status = depotEntryStatus(this.host.config(), object ? this.position.toArray() : null,
      Math.max(this.planarSpeed, Math.abs(id ? this.context.vehicles?.state(id)?.forwardSpeed ?? Infinity : Infinity)));
    const prompt = { unavailable: "", far: "Depo için yük alanına yaklaşın.", moving: "Depoya girmek için aracı durdurun.", ready: "E — Depo yönetimine geç" }[status];
    this.host.publish({
      "depot.prompt": this.depot ? "Araç park halinde." : prompt,
      "depot.active": Boolean(this.depot), "depot.vehicleId": id ?? "",
      "depot.yaw": this.view.yawDeg, "depot.distance": this.view.distance,
      "depot.panX": this.view.panX, "depot.panZ": this.view.panZ,
    });
  }

  getCameraDebug() {
    return this.depot ? { controlYawDeg: this.view.yawDeg, controlPitchDeg: -DEPOT_LIMITS.pitchDeg, cameraSource: "ridgebound-depot" } : this.driving.getCameraDebug?.() ?? { controlYawDeg: null, controlPitchDeg: null, cameraSource: null };
  }

  dispose(): void {
    this.disposed = true;
    this.unsubscribe?.();
    if (this.depot) this.host.presenter()?.clearScreens();
    this.context.actions.bind("KeyE", DEFAULT_INPUT_BINDINGS.KeyE!);
    this.context.actions.bind("KeyR", DEFAULT_INPUT_BINDINGS.KeyR!);
    this.driving.dispose();
  }
}
