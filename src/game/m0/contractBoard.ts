import type { BehaviorUpdate, ScriptState } from "@engine/behavior/behaviorSubsystem";
import type { SceneJsonValue } from "@engine/scene/entity";
import { createTransportState, transitionTransport, type TransportState } from "./transport";
import { cargoLabel, DEMO_CAPACITY_KG, DEMO_CONTRACT, DEMO_CONTRACTS, DEMO_ROUTES } from "./m0Content";
import { transportHud, type TransportPoints, type TransportTelemetry } from "./transportHud";
export { DEMO_CONTRACT } from "./m0Content";

export const BOARD_SCRIPT = "ridgebound-contract-board";
export const TRANSPORT_KEY = "ridgebound.transport.v1";
export const CONTRACT_WIDGET_ID = "ridgebound-contract";
export const ROUTES_WIDGET_ID = "ridgebound-routes";
export const DELIVERY_WIDGET_ID = "ridgebound-delivery";

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

/** Reject incompatible/corrupt progress without replacing it with a fresh job. */
export function readBoardState(value: unknown): TransportState | null {
  if (!object(value) || value.schema !== 1 || value.instanceId !== "m0-demo-1"
    || !object(value.contract) || !object(value.contract.profile)) return null;
  const contract = value.contract;
  const profile = value.contract.profile;
  const definition = Object.values(DEMO_CONTRACTS).find((entry) => entry.id === contract.id);
  if (!definition || Object.entries(definition).some(([key, expected]) => key !== "profile" && contract[key] !== expected)
    || Object.entries(definition.profile).some(([key, expected]) => profile[key] !== expected)
    || !["offered", "accepted", "loaded", "delivered", "completed"].includes(String(value.phase))
    || !Number.isSafeInteger(value.balance) || (value.balance as number) < 0
    || typeof value.rewardPaid !== "boolean") return null;
  if (value.phase === "loaded") {
    if (!object(value.cargo) || value.cargo.id !== definition.cargoId || value.cargo.profileId !== definition.profile.id
      || typeof value.cargo.vehicleId !== "string" || !value.cargo.vehicleId.trim()) return null;
  } else if (value.cargo !== null) return null;
  if (value.rewardPaid !== (value.phase === "completed") || (value.rewardPaid && (value.balance as number) < definition.fee)) return null;
  return value as unknown as TransportState;
}

export type BoardAction = "open" | "accept" | "cancel" | "reason" | "terms" | "profile-light" | "profile-heavy" | "profile-overload";
export interface ContractBoardHost {
  publish(fields: Record<string, string | number | boolean>): void;
  save(): void;
  saveStatus?(): string;
  points?(): TransportPoints | null;
}

/** ScriptState is the only authoritative record; no second in-memory job store. */
export function createContractBoard(host: ContractBoardHost) {
  let scriptState: ScriptState | null = null;
  let entityId: string | null = null;
  let reason = false;
  let terms = false;
  let notice = "";
  let telemetry: TransportTelemetry | null = null;
  const publish = (): void => {
    const state = readBoardState(scriptState?.get(TRANSPORT_KEY, null));
    const phase = state?.phase;
    host.publish({
      "contract.summary": state ? cargoLabel(state.contract) : "Sözleşme bilgisi okunamıyor.",
      "contract.points": "Yük alma: Depo yük alanı (turuncu) · Varış: Teslim alanı (yeşil)",
      "contract.fee": "Sabit ücret: 100 deneme kredisi · Deneme sözleşmesi",
      "contract.risk": "Arazi riskleri: Bilgi mevcut değil. Sürüş koşulları henüz ölçülmedi.",
      "contract.status": !state ? "Görev kaydı okunamıyor; işlem yapılamaz."
        : ({ offered: "İş sunuluyor · Henüz yük alınmadı.", accepted: "İş kabul edildi · Henüz yük alınmadı.", loaded: "Yük araçta · İptal edilemez.", delivered: "Teslim edildi · Sonuç bekleniyor.", completed: "İş tamamlandı · Yeni iş otomatik başlamaz." })[state.phase],
      "contract.acceptLabel": phase === "offered" ? "İşi kabul et" : "Kabul kapalı — tek aktif iş",
      "contract.cancelLabel": phase === "accepted" ? "Yükleme öncesi cezasız iptal" : "İptal — yalnız kabulden sonra, yüklemeden önce",
      "contract.reasonLabel": `${reason ? "−" : "+"} 1. Taşıma gerekçesi`,
      "contract.reason": reason ? "Yerleşimin erzak ihtiyacını depodan karşılamak için bu sevkiyat isteniyor." : "",
      "contract.termsLabel": `${terms ? "−" : "+"} 2. Taşıma koşulları`,
      "contract.terms": terms ? "Kabul yüklemez. Yük alma ayrıca onaylanır. Tek aktif iş; yükleme öncesi cezasız iptal. Zorunlu teslim süresi yok." : "",
      "contract.notice": notice,
      "contract.saveStatus": host.saveStatus?.() ?? "",
      "depot.loadHint": `${state ? cargoLabel(state.contract) : "Yük bilgisi yok"} / ${DEMO_CAPACITY_KG} kg deneme kapasitesi`,
      "depot.loadLabel": phase === "loaded" ? "Yük araçta" : "Yükü araca al",
      "hud.notice": notice,
      "hud.balance": state ? `Bakiye: ${state.balance} deneme kredisi` : "Bakiye okunamıyor.",
      "delivery.title": phase === "completed" ? "Teslimat tamamlandı" : phase === "delivered" ? "Teslim alındı · Sonuç bekleniyor" : "Teslimatı onayla",
      "delivery.cargo": state ? cargoLabel(state.contract) : "Görev kaydı okunamıyor.",
      "delivery.fee": state ? `Sözleşme ücreti: ${state.contract.fee} deneme kredisi` : "Ücret okunamıyor.",
      "delivery.balance": state ? `Bakiye: ${state.balance} deneme kredisi` : "Bakiye okunamıyor.",
      "delivery.status": !state ? "Görev kaydı bozuk veya uyumsuz; işlem yapılamaz." : phase === "completed" ? "Yük teslim edildi. Sözleşme ücreti bir kez eklendi. Yeni iş otomatik başlamaz."
        : phase === "delivered" ? "Yük teslim edildi. Ücreti tamamlamak için sonucu onaylayın."
        : phase === "loaded" ? "Doğru yük, aynı taşıyıcı araç ve teslim noktası doğrulanarak teslim alınacak."
        : "Araçta teslim edilebilir görev yükü yok. Önce işi kabul edip yükleyin.",
      "delivery.confirmLabel": phase === "completed" ? "Teslim tamamlandı" : phase === "delivered" ? "Sonucu tamamla" : "Teslim et",
      "delivery.notice": notice,
      "routes.main": `${DEMO_ROUTES[0].name} · Yaklaşık ${DEMO_ROUTES[0].mapLengthM} m yol çizgisi`,
      "routes.alternative": `${DEMO_ROUTES[1].name} · Yaklaşık ${DEMO_ROUTES[1].mapLengthM} m yol çizgisi`,
      ...transportHud(state, telemetry, host.points?.() ?? null),
    });
  };
  const tick: BehaviorUpdate = (context) => {
    if (entityId && entityId !== context.entityId) return;
    entityId = context.entityId;
    scriptState = context.state;
    if (scriptState.get(TRANSPORT_KEY, undefined) === undefined) {
      scriptState.persist(TRANSPORT_KEY, createTransportState(DEMO_CONTRACT, "m0-demo-1") as unknown as SceneJsonValue);
    }
    publish();
  };
  return {
    tick,
    action(action: BoardAction): boolean {
      if (!scriptState) { notice = "İş panosu hazır değil."; publish(); return false; }
      const state = readBoardState(scriptState.get(TRANSPORT_KEY, null));
      if (action === "open") { reason = false; terms = false; notice = ""; host.publish({ "depot.notice": "" }); publish(); return true; }
      if (action === "reason") reason = !reason;
      else if (action === "terms") terms = !terms;
      else if (!state) notice = "Kayıt bozuk veya uyumsuz; mevcut ilerleme değiştirilmedi.";
      else if (action.startsWith("profile-")) {
        const definition = DEMO_CONTRACTS[action.slice("profile-".length)];
        if (state.phase !== "offered") notice = "Profili değiştirmeden önce yüklenmemiş işi iptal edin.";
        else if (definition) {
          scriptState.persist(TRANSPORT_KEY, createTransportState(definition, state.instanceId, state.balance) as unknown as SceneJsonValue);
          notice = "Deneme profili seçildi. İş henüz kabul edilmedi.";
          host.save();
        }
      }
      else {
        const result = transitionTransport(state, action === "accept" ? { type: "accept", contractId: state.contract.id } : { type: "cancel" });
        if (!result.ok) notice = action === "accept" ? "İkinci aktif iş kabul edilemez." : "Yalnız yükleme öncesindeki kabul edilmiş iş iptal edilebilir.";
        else {
          scriptState.persist(TRANSPORT_KEY, result.state as unknown as SceneJsonValue);
          notice = action === "accept" ? "İş kabul edildi. Yükleme ayrı bir işlemdir." : "İş cezasız iptal edildi.";
          host.save();
        }
      }
      publish();
      return true;
    },
    /** The session supplies the live vehicle and verified pickup point, never UI payload data. */
    load(pointId: string, vehicleId: string, capacityKg: number): boolean {
      const state = readBoardState(scriptState?.get(TRANSPORT_KEY, null));
      if (!state || !scriptState) notice = "Görev kaydı okunamıyor; yükleme yapılamaz.";
      else {
        const result = transitionTransport(state, { type: "load", pointId, vehicleId, capacityKg });
        if (result.ok) {
          scriptState.persist(TRANSPORT_KEY, result.state as unknown as SceneJsonValue);
          notice = "Yük araca alındı. Hedef: yeşil teslim alanı.";
          host.save();
          publish(); host.publish({ "depot.notice": notice });
          return true;
        }
        notice = ({ "wrong-phase": state.phase === "loaded" ? "Yük zaten araçta; tekrar yüklenemez." : "Yüklemeden önce panodan işi kabul edin.", "wrong-point": "Bu işin yük alma noktasında değilsiniz.", "over-capacity": "Yük nominal deneme kapasitesini aşıyor; yüklenmedi.", "invalid-vehicle": "Bu araç için taşıma kapasitesi tanımlı değil.", "wrong-contract": "Sözleşme uyuşmuyor.", "wrong-cargo": "Yük kimliği uyuşmuyor." })[result.reason];
      }
      publish(); host.publish({ "depot.notice": notice });
      return false;
    },
    updateHud(live: TransportTelemetry) { telemetry = live; publish(); },
    deliveryNotice(message: string) { notice = message; publish(); },
    /** Called only from the parked delivery screen after live point/vehicle validation. */
    deliver(pointId: string, vehicleId: string): boolean {
      let state = readBoardState(scriptState?.get(TRANSPORT_KEY, null));
      if (!state || !scriptState) { notice = "Görev kaydı okunamıyor; teslim yapılamaz."; publish(); return false; }
      if (state.phase === "completed") { notice = "Bu iş zaten tamamlandı; tekrar ücret eklenmedi."; publish(); return false; }
      if (pointId !== state.contract.deliveryPointId) { notice = "Yanlış teslim noktası; yük teslim edilmedi."; publish(); return false; }
      if (!Number.isSafeInteger(state.balance + state.contract.fee)) { notice = "Bakiye sınırı nedeniyle sonuç tamamlanamıyor; görev kaydı korundu."; publish(); return false; }
      if (state.phase !== "delivered") {
        const delivered = transitionTransport(state, { type: "deliver", pointId, vehicleId, cargoId: state.cargo?.id ?? "" });
        if (!delivered.ok) {
          notice = delivered.reason === "invalid-vehicle" ? "Görev yükünü taşıyan aynı araçla teslim edin."
            : delivered.reason === "wrong-cargo" ? "Yük kimliği sözleşmeyle uyuşmuyor."
            : "Araçta teslim edilebilir görev yükü yok. Önce işi kabul edip yükleyin.";
          publish(); return false;
        }
        state = delivered.state;
        scriptState.persist(TRANSPORT_KEY, state as unknown as SceneJsonValue);
        host.save(); // A crash here leaves a delivered receipt, never a second cargo.
      }
      const completed = transitionTransport(state, { type: "complete" });
      if (!completed.ok) { notice = "Sonuç tamamlanamadı; mevcut görev kaydı korundu."; publish(); return false; }
      scriptState.persist(TRANSPORT_KEY, completed.state as unknown as SceneJsonValue);
      notice = "Teslim başarılı. Sözleşme ücreti bir kez bakiyeye eklendi.";
      host.save();
      publish();
      return true;
    },
    reset() { scriptState = null; entityId = null; reason = false; terms = false; notice = ""; telemetry = null; },
  };
}
