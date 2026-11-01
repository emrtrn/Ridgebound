# M0 E — Yükleme ve görev HUD'u

01.11.2026. E teknik dilimi tamamlandı. Kullanıcı daha sonra gerçek sahnede işi
kabul edip yüklediğini ve teslim noktasına ulaştığını doğruladı. Bu ana akış
kanıtıdır; tüm profil/kapasite olumsuz koşullarının manuel kabulü değildir.
Bu rapor E kanıtını kaydeder; sonraki F için ayrı teslim/sonuç raporuna bakın.

## Forge eşlemesi ve sahiplik

| İhtiyaç | Mevcut Forge kaynağı | Ridgebound bağlantısı |
|---|---|---|
| Etkin araç, konum/hız ve park | `GameModeVehicles`, `vehicleGameMode.ts`, `vehicleEntry.ts` | Mevcut depo session'ı aynı aracı tutar; yükleme için canlı araç, fiziksel pickup, hız/menzil ve açık depo ekranı tekrar kontrol edilir. |
| Araç/içerik kimliği | `engine/scene/actorInstance.ts` içindeki `actorInstanceEntityId`, mevcut scene entities | Nominal kapasite yalnız sahnedeki Gaz52 actor sınıfı + gerçek Vehicle bileşeni için tanımlanır. UI'dan kapasite/araç kimliği alınmaz. |
| Hedef yönü | `vehicleCameraControl.ts` içindeki `planarHeadingFromQuaternion`, mevcut Object3D dünya pozu | Oyun HUD'u mevcut yönü hedef vektörüyle karşılaştırır; yol bulucu veya kamera/sürüş altyapısı yazılmaz. |
| UI ve ekranlar | `runtimeUiModule.ts`, `uiBinding.ts`, ViewModel ve `ui-action` | Mevcut HUD/depo/sözleşme asset'leri ve yeni `M0_Routes.ui.json`. Önceki elle üretilen prototip HTML kartı yerine Forge HUD'u kullanılır. |
| Görev/kayıt | `ScriptState.persist`, `saveGameModule.ts`, mevcut quick slot | Aynı `ridgebound.transport.v1` kaydında profil/kargo/taşıyıcı/aşama; yükleme sonrası kayıt. İkinci görev veya storage sistemi yok. |
| Yol ölçüsü | `engine/scene/landscape.ts` içindeki `splineToPolyline` | İki authored terrain spline'ının XZ çizgi uzunluğu; içerik `m0Content.ts`, güncellik kontrolü mevcut veriye karşı regresyon testinde. |

Forge kaynakları bu dilimde değiştirilmedi. Önceden mevcut Forge
`src/style.css` ve `public/assets/starter-content/Levels/Terrain.level.json`
çalışmaları korundu. Yeni authored layout alanı yok; oyun sahnesi değiştirilmedi.
Yeni UI asset'i manifestin mevcut `ridgebound-ui` grubuna bağlıdır.
UI props/bindings mevcut normalizer ve validator sözleşmesini kullanır.

## İçerik ve davranış

- Hafif 500 kg, ağır 1500 kg ve sınır üstü 2500 kg deneme profilleri panodan
  **iş kabulünden önce** seçilir. Gaz52 deneme kapasitesi 2000 kg'dır.
  100 deneme kredisi aynı kalır. Bunlar gerçek araç/ekonomi kararı değildir.
- D'nin hafif sözleşme kimliği, snapshot'ı ve schema-1 kayıt biçimi korunur;
  ağır/sınır üstü sözleşmeler açık tanımlar olarak eklenir. Aktif işin profili değişmez.
- İş kabulü araca yük eklemez. Depodaki “Yükü araca al” düğmesi ayrı komuttur.
  Duran etkin araç doğru pickup alanında olmalıdır; başka ekran açıkken komut işlenmez.
- Başarılı yükleme `accepted → loaded`; cargo id, profile id ve gerçek taşıyıcı
  entity id tek kayda yazılır. Aynı komut ikinci kargo oluşturmaz, yüklü iş iptal edilmez.
- Kapasite aşımı kabul edilmiş işi ve boş kargoyu değiştirmeden anlaşılır hatayla
  reddedilir. Yükleme öncesi iptal ve başka deneme profiline geçiş mümkündür.
- HUD: iş/aşama, boş veya yüklü araç, hedef, kuş uçuşu mesafe, araca göre yön,
  canlı hız, eylem/hata ve kayıt durumu. Yüklenince hedef yeşil teslim alanıdır.
  Taşıyıcı başka araçsa uyarılır; konum/hız yoksa bilgi uydurulmaz.
- HUD restore sonrasında kalıcı görev kaydından türetilir; restore yüklemeyi
  yeniden çalıştırmaz. Yükleme sonrası kayıt hatasında ilerleme oturumda kalır;
  mevcut kaydet düğmesiyle tekrar denenebilir.
- Depoda iki güzergâh bilgi ekranı: ana yol yaklaşık 533 m, alternatif 435 m.
  Ölçümler mevcut spline çizgisinin yatay uzunluğudur; depo/teslim bağlantıları
  dahil değildir. Koşul/risk bilgisi henüz yoktur; kısa yol güvenli ilan edilmez.
  Rota seçimi sürüşü zorlamaz; GPS ve otomatik güvenlik değerlendirmesi yoktur.
- Yük bu dilimde mantıksal görev kargosudur. Araç modeline yük mesh'i eklenmedi;
  fizik kütlesi ve COM değiştirilmedi (M1). Teslim/ücret komutları henüz bağlı değildir (F).

## Doğrulama

- Ridgebound `npm.cmd run check`: GEÇTİ. İlk denemede optional pickup kimliği
  TypeScript hatası bulundu; açık `pickup` seçimiyle düzeltildi. Başarısız deneme
  başarı sayılmadı. Forge TypeScript'i değiştirilmedi.
- `node --test tests/m0/contractBoard.test.mjs tests/m0/depotSession.test.mjs tests/m0/depot.test.mjs tests/m0/transport.test.mjs`:
  21/21 GEÇTİ. Gerçek Forge BehaviorSubsystem/Vehicle session/collector/store/restore
  modülleri bundle edilir; oyun state/host sınırları kontrollü test ortamındadır.
  Hafif/ağır yükleme, yanlış nokta/araç, üst kapasite, ikinci yükleme, yüklü iptal,
  aktif işte profil kilidi, loaded restore, HUD ve rota sayılarının kaynakla uyumu sınandı.
- Ayrı `.forge/m0-e-validation/` projesi, `Ridgebound E Validation` kimliği ve
  5199 portunda normal klavye/düğmelerle browser QA yapıldı. Gerçek kullanıcı
  sahnesine otomatik Save Layout uygulanmadı.
- Browser: kabul öncesi yükleme reddi; 500 kg açık yükleme; aktif profil değiştirme,
  ikinci yükleme ve yüklü iptal reddi; kayıt cargo/profile/`actor:0` kimlikleri geçti.
- Browser: 2500 kg > 2000 kg reddedildi; kalıcı durum accepted/cargo=null,
  balance=0 ve rewardPaid=false kaldı. İptal → 1500 kg seçim/kabul/yükleme geçti.
- Browser: yüklü hafif kayıt sayfa reload'u + Forge load ile; ağır kayıt Forge
  level travel/load ile geri geldi. HUD doğru yük/hedefi gösterdi; yeni kargo/ücret yok.
- Browser: ağır yükleme sırasında storage yazımı hata verdiğinde yük oturumda
  kaldı ve Türkçe hata gösterildi. Engel kaldırılıp yeniden kayıt/yükleme yapıldığında
  loaded durum ve kimlikler korundu. R upright reset sonrasında da yük kaldı;
  bu, G'deki tüm kurtarma/safe-location kabulü değildir.
- Browser kısa sürüş: görev yükü korunurken HUD 3.2 km/sa canlı hız gösterdi;
  frenle duruşa döndü. Tam güzergâh sürüşü veya M1 fizik farkı kabulü değildir.
- Görsel: 1440×900 ve 1100×720; sözleşmede üç profil ve iki ayrıntı birlikte,
  depo yükleme/kapasite mesajı, rota ekranı ve sürüş HUD'u kontrol edildi.
  İsteğe bağlı F8 telemetrisi görsel QA'da kapatıldı.
- Son 1100×720 kontrolde HUD 350×255, depo 350×622, sözleşme 820×576,
  rota paneli 720×332 px; tüm panel sınırları viewport içindeydi. Son browser turunda
  page/console/HTTP hatası yoktu; ilk açılıştaki favicon 404 başarı kanıtına dahil edilmedi.

Git dışı kanıtlar `.forge/m0-hud/` altında: `qa.md`, `contract-small.png`,
`routes-small.png`, `over-capacity-small.png`, `loaded-hud-small.png`,
`heavy-restored-small.png`, final ekran görüntüleri ve `browser-result.json`.

## Kabul sınırı

M0-06–08 için teknik kanıt vardır; kullanıcı görsel/oynanış kabulü açık kalır.
Kabul/yüklü kayıt kanıtı tüm görev aşamalarını veya ödeme tekilliğini kanıtlamaz.
Teslim/sonuç/ücret (F), kalan kayıt/kurtarma (G), tam manuel oturum ve üretim
build/verify-build (H) açık. Yeni production build üretilmedi; eski artifact değişmez.
Başlangıç Ridgebound HEAD `77d49a0`, Forge HEAD `995b7132`; E farkları commit edilmedi.
