import type { BehaviorUpdate, ScriptState } from "@engine/behavior/behaviorSubsystem";
import type { SceneJsonValue } from "@engine/scene/entity";
import { createTransportState, transitionTransport, type TransportState } from "./transport";

export const BOARD_SCRIPT = "ridgebound-contract-board";
export const TRANSPORT_KEY = "ridgebound.transport.v1";
export const CONTRACT_WIDGET_ID = "ridgebound-contract";

/** Explicit test content, not final Gaz52 capacity or economy tuning. */
export const DEMO_CONTRACT = {
  id: "m0-demo-supplies", cargoId: "m0-demo-cargo",
  profile: { id: "m0-demo-light", kind: "light", massKg: 500 },
  pickupPointId: "pickup", deliveryPointId: "delivery", fee: 100,
} as const;

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

/** Reject incompatible/corrupt progress without replacing it with a fresh job. */
export function readBoardState(value: unknown): TransportState | null {
  if (!object(value) || value.schema !== 1 || value.instanceId !== "m0-demo-1"
    || !object(value.contract) || !object(value.contract.profile)) return null;
  const contract = value.contract;
  const profile = value.contract.profile;
  if (Object.entries(DEMO_CONTRACT).some(([key, expected]) => key !== "profile" && contract[key] !== expected)
    || Object.entries(DEMO_CONTRACT.profile).some(([key, expected]) => profile[key] !== expected)
    || !["offered", "accepted", "loaded", "delivered", "completed"].includes(String(value.phase))
    || !Number.isSafeInteger(value.balance) || (value.balance as number) < 0
    || typeof value.rewardPaid !== "boolean") return null;
  if (value.phase === "loaded") {
    if (!object(value.cargo) || value.cargo.id !== DEMO_CONTRACT.cargoId || value.cargo.profileId !== DEMO_CONTRACT.profile.id
      || typeof value.cargo.vehicleId !== "string" || !value.cargo.vehicleId.trim()) return null;
  } else if (value.cargo !== null) return null;
  if (value.rewardPaid !== (value.phase === "completed") || (value.rewardPaid && (value.balance as number) < DEMO_CONTRACT.fee)) return null;
  return value as unknown as TransportState;
}

export type BoardAction = "open" | "accept" | "cancel" | "reason" | "terms";
export interface ContractBoardHost {
  publish(fields: Record<string, string | number | boolean>): void;
  save(): void;
  saveStatus?(): string;
}

/** ScriptState is the only authoritative record; no second in-memory job store. */
export function createContractBoard(host: ContractBoardHost) {
  let scriptState: ScriptState | null = null;
  let entityId: string | null = null;
  let reason = false;
  let terms = false;
  let notice = "";
  const publish = (): void => {
    const state = readBoardState(scriptState?.get(TRANSPORT_KEY, null));
    const phase = state?.phase;
    host.publish({
      "contract.summary": "Yerleşime erzak · 500 kg · Hafif yük",
      "contract.points": "Yük alma: Depo yük alanı (turuncu) · Varış: Teslim alanı (yeşil)",
      "contract.fee": "Sabit ücret: 100 deneme kredisi · Deneme sözleşmesi",
      "contract.risk": "Arazi riskleri: Bilgi mevcut değil. Güzergâhlar henüz ölçülmedi.",
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
      if (action === "open") { reason = false; terms = false; notice = ""; publish(); return true; }
      if (action === "reason") reason = !reason;
      else if (action === "terms") terms = !terms;
      else if (!state) notice = "Kayıt bozuk veya uyumsuz; mevcut ilerleme değiştirilmedi.";
      else {
        const result = transitionTransport(state, action === "accept" ? { type: "accept", contractId: DEMO_CONTRACT.id } : { type: "cancel" });
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
    reset() { scriptState = null; entityId = null; reason = false; terms = false; notice = ""; },
  };
}
