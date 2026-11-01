# M0 G — Kayıt ve kurtarma

02.11.2026. G kayıt/kurtarma bağlantıları tamamlandı. Tam M0 kullanıcı kabulü ve H kapanışı ayrıdır.

## Forge eşlemesi

| İhtiyaç | Mevcut Forge kaynağı | Ridgebound bağlantısı |
|---|---|---|
| Kalıcı görev/sözleşme/kargo/ödül | `ScriptState.persist`, `engine/persistence/saveGameState.ts`, `saveGameModule.ts` | Mevcut tek `ridgebound.transport.v1` değeri ve Forge slotları kullanılır. Yeni storage veya scene save endpoint'i yok. |
| Restore öncesi oyun doğrulaması | `gameplaySaveStateService`, `RuntimeContext.entities`, mevcut capture/restore köprüsü | `transportPersistence.ts` sözleşme snapshot'ını, aşama/ödeme tutarlılığını, tek pano kaydını ve yüklü taşıyıcıyı doğrular. Genel restore yalnız doğrulamadan sonra çağrılır. |
| Güvenli yeniden deneme | `GameModeVehicles.reset`, `actorInstanceTransform` | T aynı Gaz52'yi sahnede tanımlı başlangıca, upright ve durur halde döndürür. Görev/kargo/bakiye değiştirilmez; fizik güncellemesinden sonra mevcut quick save çağrılır. R yerinde upright reset olarak kalır. |
| Hata ve komut sırası | Mevcut save command servisi ve UI ViewModel | Yükleme boyunca görev komutları ve yeni kayıt bloke edilir. Boş/geçersiz load kilidi bırakır; aynı anda ikinci load kabul edilmez. |

Forge kaynakları değiştirilmedi. Servisler yeniden kaydedilmez; mevcut köprünün
metotları compose edilir. Capability servisi runtime başlangıcından sonra hazır
olduğundan komut bağlantısı ilk level hook'unda bir kez kurulur.

## Kayıt uyumluluğu ve hata davranışı

- Mevcut schema-1 görev snapshot'ı korunur; sessiz migrasyon yapılmaz. Forge
  envelope schema'sı değiştirilmedi.
- Pano entity kimliği güncel türetilmiş sahneyle uyuşmalıdır. Eski World Partition
  öncesi indeksler uyuşmazsa kayıt uygulanmaz. Eksik/çift görev, farklı görev
  anahtarı veya bilinmeyen şema da reddedilir.
- Yüklü kayıtta taşıyıcı güncel Gaz52 kimliklerinden biri olmalı ve Forge araç
  restore listesinde bulunmalıdır. Başka araca sessiz taşıma yapılmaz.
- Reddedilen restore bütün olarak uygulanmaz; HUD nedeni gösterir, yeni görev
  ilerlemesi başlatılmaz ve capture `null` döndürür. Mevcut slotun üstüne boş
  başlangıç yazılmaz. Başka geçerli bir slot yüklenebilir.
- Geçerli restore HUD'u kayıttan türetir. Restore bildiriminde ücret eklenmez.
  Delivered makbuzu mevcut açık sonuç onayıyla tamamlanır; completed restore
  ve kurtarma ikinci ücret üretmez.
- Kritik görev geçişlerinin mevcut quick save politikası korunur. T sonrasında
  da aynı slot kaydedilir. Storage hatası oturum durumunu geri almaz; hata görünür,
  son başarılı kalıcı kayıt korunur, tekrar kaydetme kullanılabilir.
- Yeni authored alan eklenmedi. UI'da yalnız mevcut Text içeriği değişti;
  loader/normalizer veya `tools/saveValidator.ts` allowlist değişikliği gerekmedi.

## Doğrulama

- Ridgebound `npm.cmd run check`: geçti. Sandbox'taki ilk deneme Forge/esbuild
  erişiminde durdu; erişimli tekrar ve son kaynak kontrolü geçti.
- M0 regresyon grubu: 31/31 geçti. Gerçek Forge BehaviorSubsystem, collector,
  store, restore, save capability ve runtime service host kullanılır. Kabul,
  loaded, delivered, completed turları; bozuk/eksik/çift/eski kayıtlar; storage
  hatası/tekrar kayıt; restore sırasında komutlar ve güvenli reset sınanır.
- Browser: ayrı `Ridgebound G Validation` projesi, port 5201. Gerçek UI ile kabul
  ve yükleme yapıldı; accepted ve loaded quick save/load sonrası HUD korundu.
- Browser: T sonrası loaded kargo/görev flag'leri aynı kaldı; kaydedilmiş araç
  pozu başlangıcın yaklaşık `[-180, 9.69, -50]` konumuna döndü. Storage quota
  hatasında kayıt alınamadığı HUD'da gösterildi.
- Teslim kaydı için yalnız fixture save'indeki araç/player pozu yeşil alanın
  yanına taşınıp Forge load kullanıldı. Gerçek UI açık teslimi completed/100
  üretti. Completed load ve T sonrasında bakiye 100, kargo null kaldı.
  Bu uçtan uca rota sürüşü kanıtı değildir.

Kanıtlar: `.forge/m0-persistence/`. Görsel ve son kontrol sonuçları aşağıda tutulur.

- Browser eski pano kimliği denemesinde uyumsuzluk HUD'da gösterildi; kalıcı
  slotun ham içeriği değişmedi. Son kaynakla geçerli completed kayıt tekrar
  yüklendi ve bakiye 100 kaldı. Son browser turunda page/console error yoktu.
- `recovered.png`, `storage-error.png`, `incompatible.png`,
  `incompatible-small.png`, `final-completed-small.png` incelendi. 1440×900 ve
  1100×720 HUD'larında metin/tuşlar okunur; kırpılma, taşma veya UI katman örtüşmesi
  görülmedi. Küçük ekranda hata paneli x=24, y≈400, 350×296 px ve viewport içinde.
- İlk browser denemesinde duplicate servis kaydı hatası görüldü; mevcut servis
  metotlarını compose eden düzeltme sonrası bu hata kalktı ve regresyon gerçek
  Forge servis konteyneriyle güçlendirildi. Bir otomasyon adımı terrain yüklemesi
  bitmeden E bastığı için timeout oldu; yükleme bitince aynı akış geçti. Timeout
  veya ilk hatalı açılış başarı kanıtı sayılmadı.
- Otomatik testteki `fixture quota` uyarısı kasıtlı storage hatası senaryosudur;
  son 31/31 sonuçta başarısız test yoktur. Son check ve kapsamlı diff whitespace
  kontrolü de geçti.

## Sahiplik ve sınır

İncelenen kaynak HEAD'leri Ridgebound `53d27e4`, Forge `995b7132`.
Forge'daki mevcut `src/style.css` ve `Terrain.level.json` farklarına dokunulmadı.
Çalışma sırasında Ridgebound Landscape cell/global/tile farkları oluştu;
bu sahne dosyaları bu dilimde yazılmadı, geri alınmadı. Ayrıca Chromium GPU
günlüğü `debug.log` görüldü ve korundu; günlükte ReadPixels GPU stall ve terrain
shader compiler uyarısı var. Bunlar page/console error kontrolünden ayrı
bulgulardır; G, terrain shader veya performans kabulü iddia etmez.

G için açılan son Playwright oturumu ve 5201 doğrulama sunucusu kapatıldı.
Fixture ve kanıt dosyaları inceleme için bırakıldı.

H tam oturum, 15 kabul maddesinin kapanışı, kullanıcı sürüş/kamera/sonuç kabulü,
production build ve verify-build açık kalır. Bu dilimde build üretilmedi;
eski production artifact G değişikliklerini içermez. Branch/commit/push yapılmadı.
