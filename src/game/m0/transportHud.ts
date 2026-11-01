import { cargoLabel } from "./m0Content";
import { DEPOT_LIMITS } from "./depotRules";
import type { TransportState } from "./transport";

export interface TransportTelemetry {
  readonly vehicleId: string | null;
  readonly position: readonly [number, number, number] | null;
  readonly heading: { readonly x: number; readonly z: number } | null;
  readonly speedMps: number | null;
  readonly depotActive: boolean;
}
export interface TransportPoints {
  readonly pickup: readonly [number, number, number];
  readonly delivery: readonly [number, number, number];
}

/** Game HUD only: straight-line target bearing, never road navigation. */
export function transportHud(state: TransportState | null, live: TransportTelemetry | null, points: TransportPoints | null): Record<string, string> {
  const speed = live?.speedMps;
  const fields = {
    "hud.job": !state ? "Görev kaydı okunamıyor." : state.phase === "offered" ? "İş bekleniyor · Depodaki panoyu açın." : state.phase === "completed" ? "İş tamamlandı." : `Etkin iş: ${cargoLabel(state.contract)}`,
    "hud.cargo": !state ? "Yük bilgisi kullanılamıyor." : state.cargo ? `Araçta: ${cargoLabel(state.contract)}` : "Araçta görev yükü yok.",
    "hud.target": "Hedef bilgisi mevcut değil.",
    "hud.speed": typeof speed === "number" && Number.isFinite(speed) ? `${(Math.abs(speed) * 3.6).toFixed(1)} km/sa` : "Hız bilgisi mevcut değil.",
    "hud.action": "",
  };
  if (!state || !points) return fields;
  const loaded = state.phase === "loaded";
  const target = loaded ? points.delivery : points.pickup;
  const targetName = loaded ? "Teslim alanı (yeşil)" : state.phase === "offered" ? "Depo / iş panosu" : "Yük alanı (turuncu)";
  fields["hud.target"] = `Hedef: ${targetName} · Konum bilgisi yok.`;
  const position = live?.position;
  if (position && position.every(Number.isFinite)) {
    const dx = target[0] - position[0], dz = target[2] - position[2];
    const distance = Math.hypot(dx, dz);
    const near = distance <= DEPOT_LIMITS.range && Math.abs(target[1] - position[1]) <= DEPOT_LIMITS.heightTolerance;
    let direction = "Yön bilgisi yok";
    if (near) direction = "Hedef alanındasınız";
    else if (live?.heading) {
      const angle = Math.atan2(live.heading.z * dx - live.heading.x * dz, live.heading.x * dx + live.heading.z * dz) * 180 / Math.PI;
      direction = Math.abs(angle) < 20 ? "↑ İleride" : Math.abs(angle) > 160 ? "↓ Arkada" : angle > 0 ? "→ Sağda" : "← Solda";
    }
    fields["hud.target"] = `${targetName} · ${Math.round(distance)} m kuş uçuşu · ${direction}`;
    const stopped = typeof speed === "number" && Number.isFinite(speed) && Math.abs(speed) <= DEPOT_LIMITS.stoppedSpeed;
    fields["hud.action"] = loaded ? near ? stopped ? "E — Teslim ekranını aç" : "Teslim etmek için aracı durdurun." : "Teslim alanına sürün; rota seçimi serbest."
      : !near ? "Yük alanına yaklaşın." : !stopped ? "İşlem yapmak için aracı durdurun." : live?.depotActive ? "Depo açık · Yüklemeyi ayrıca onaylayın." : "E — Depoyu aç";
  }
  if (state.cargo && live?.vehicleId !== state.cargo.vehicleId) {
    fields["hud.cargo"] = "Görev yükü başka araçta. Taşıyıcı araca dönün.";
    fields["hud.action"] = "Aynı taşıyıcı araçla devam edin.";
  }
  if (state.phase === "delivered" || state.phase === "completed") {
    fields["hud.target"] = "Teslim tamamlandı.";
    fields["hud.action"] = state.phase === "completed" ? "Yeni iş otomatik başlamaz. Teslim alanında E ile sonucu inceleyin." : "Teslim alanında E ile sonucu tamamlayın.";
  }
  return fields;
}
