# M0 C — Depo modu ve hibrit kamera

01.11.2026. C teknik dilimi tamamlandı; kullanıcı C görsel kabulünü onayladı.
İş panosu/sözleşme ve M0-02'nin bütünü açık.

## Forge eşlemesi ve sahiplik

| İhtiyaç | Kullanılan Forge kaynağı | Ridgebound bağlantısı |
|---|---|---|
| Araç sürüşü | `src/game/gameModes/vehicleGameMode.ts`, `vehicleEntry.ts` | Mevcut session compose edilir; gaz/fren/direksiyon/reset/fizik kopyalanmaz. `stoppingInput` ve `PARKED_VEHICLE_INPUT` park için kullanılır. |
| Kamera | `rtsCameraControl.ts`, `playerCameraManager.ts` | Depo referansı, sınırları ve düğme eylemleri oyuna özgüdür; konum/zoom/pan hesabı ortak yardımcıları kullanır. |
| Girdi | `engine/input/actionMap.ts`, Game Mode input/cursor sözleşmesi | E `ridgebound.depot`, R mevcut `interact` resetine bağlanır. Teardown canonical bağları geri yükler. |
| UI | `runtimeUiModule.ts`, `uiPresenterService`, `uiViewModelService`, `ui-action` mesajları | İpucu HUD'u ve depo ekranı `.ui.json` asset'leridir. Yeni ekran/input altyapısı kurulmaz. |
| İçerik/kayıt | Mevcut layout placement rolleri ve `worldSettings.hudWidget` | Yük alanı `logistics.pickup`, kamera referansı `building.transport.depot`; yeni genel layout alanı yok. `hudWidget` mevcut validator allowlist'inde. |

Forge kaynaklarında değişiklik yapılmadı. İki depodaki eşzamanlı Forge AO/water
çalışmaları ve kullanıcı içerikleri korundu. Kontrol sırasında Ridgebound HEAD
`f68d583`, Forge HEAD önce `c1a790c3`, son kontrolde `ca0dcf1d` idi; Forge ağacı
eşzamanlı çalışmayla değişti. Önceki B browser kanıtı C için yeni kabul sayılmadı.

## Davranış

- Etkin araç yük alanının menzilindeyken ve durma eşiğindeyken E ile depo açılır.
  Otomatik sensör girişi veya araç reseti tetiklenmez. Hareketli/uzak giriş reddedilir.
- Aynı Forge sürüş session'ı ve pawn korunur. Depoda sürüş tick'i yerine mevcut
  park/fren girdisi uygulanır; W/S/A/D/Space/R sürüş/reset komutuna geçmez.
- Depo paneli açıkken Forge input mode `ui`, cursor görünür, pointer lock bırakılır.
  Kamera panel düğmeleriyle kontrol edilir; bu dilimde mouse-wheel/serbest RTS
  kontrolü veya runtime nesne seçimi eklenmedi. Dünya tıklaması odağı değiştirmez.
- Sürüş kartı depo görünümünde gizlenerek araç/alanın önü açılır.
- Sola/sağa döndür, yakınlaş/uzaklaş, dört yönde kaydır ve merkeze dön düğmeleri
  mevcut kamera yardımcılarına gider. `Merkeze dön` özgün depo referansına döner.
- Açık “Sürüşe dön (Esc)” veya ekranın Back/Escape eylemi aynı araca döner.
  Yeni araç seçilmez/spawn edilmez. UI sırasında basılı tutulan sürüş tuşları
  bırakılmadan sürüşe aktarılmaz.
- Araç kaybolursa başka araca sessizce geçilmez; hata gösterilir. Ekran açılamazsa
  depo moduna girilmez. Teardown UI/message aboneliğini ve input bağlarını temizler.
- Depo ekranı/kamera durumu geçicidir; reload başlangıç sürüş görünümünü kurar.
  M0 görev/kargo/ödül save modeli bu dilimde bağlanmadı.

## Prototip ayarları

| Ayar | Test değeri |
|---|---|
| Fiziksel giriş noktası | Landscape `logistics.pickup` placement konumu |
| Menzil / dikey tolerans | 10 m / 3 m |
| Durma eşiği | 0.25 m/s; ayrıca yanal konum değişimi kontrol edilir |
| Referans | Depo binasının XZ merkezi, yük alanının Y yüksekliği |
| Kamera eğimi / başlangıç yönü | 55° / 45° |
| Yön sınırı | 10°…80° |
| Mesafe | Başlangıç 36 m; sınır 24…50 m |
| Kaydırma | Referansa göre X/Z ayrı ayrı ±8 m |

Bunlar nihai tasarım veya kullanıcı kabulü değildir; mevcut graybox sahaya göre
kalibre edilir. Hızlı kamera geçişi vardır; ayrıca sinematik geçiş geliştirilmedi.

## Doğrulama

- `npm.cmd run check`: son kaynakla GEÇTİ; TypeScript ve import sınırları.
- `node --test tests/m0/depotSession.test.mjs tests/m0/depot.test.mjs tests/m0/transport.test.mjs`:
  12/12 GEÇTİ. Session testleri gerçek Forge Vehicle Game Mode ve kamera
  yardımcılarını bundle ederek sahte host/araç köprüsüyle giriş/çıkış, park,
  menzil/hız, sınırlar, basılı tuş, eksik araç/ekran ve teardown'ı sınar.
- Gerçek Ridgebound browser: park halindeki E girişi, 7.8 km/sa hareketli girişin
  reddi, uzakta girişin reddi; düğmelerle mesafe 24/50, yön 10/80 ve pan sınırları;
  merkezleme; W/R basılıyken park; dönüşte aynı `actor:0` ve 0 km/sa; tekrar giriş
  ve Escape dönüşü gözlendi. Son kontrolde page/console/HTTP asset hatası yok.
- Görsel kontrol: 1440×900 ve 1100×720. Panel (x=24, width=350, height≈448)
  ekrana sığar; dönüş düğmesi görünür. Depo/araç çerçevesi incelendi.
- Save/reload: gerçek sahne test fixture'ı yapılmadı. `.forge/m0-c-validation/`
  bağımsız kopyası, ayrı proje adı ve 5197 portu kullanıldı. UI ile araç adı
  değiştirildi; Save Layout ok=true, changed=true, dropped=[], removedTerrain=[].
  Reload `hudWidget: ridgebound-depot-hud` ve QA adını korudu. Play'de depo
  giriş/dönüş de çalıştı; gerçek sahnenin Gaz52 adı değişmedi.
- İlk UI manifest denemesinde eksik `placement` metadata'sı yüklemeyi durdurdu;
  mevcut manifest sözleşmesine göre düzeltildi. İlk geçici editor açılışları
  timeout oldu; yeniden açılış/save/reload/Play başarıyla tamamlandı. Bu başarısız
  denemeler başarı kanıtı sayılmadı.

Git dışı browser kanıtları `.forge/m0-depot/`: `qa.md`, `depot-open.png`,
`depot-small.png`, `browser-result.json`. Test bundle'ı da aynı geçici alandadır;
ikinci motor geliştirme kaynağı değildir. Yeni production build/verify-build ve
genel Forge gate'i çalıştırılmadı; Forge TypeScript'i bu çalışma tarafından değişmedi.

## Kalan kabul

D dilimi fiziksel pano/sözleşme/kabul-iptal akışını bağlayacak. C'nin teknik
kutuları kapatıldı ve kullanıcı C görsel kabulünü onayladı (01.11.2026).
M0-02 ve diğer M0 kabul kutuları açık bırakıldı; tam nakliye oturumu
tamamlanmış sayılmaz.
