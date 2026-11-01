# M0 D — İş panosu ve sözleşme

01.11.2026. D teknik dilimi tamamlandı; kullanıcı görsel/oynanış kabulü açık.
Sıradaki dilim E: yükleme ve HUD. Tam M0 kabulü değildir.

## Forge eşlemesi ve sahiplik

| İhtiyaç | Mevcut Forge kaynağı | Ridgebound bağlantısı |
|---|---|---|
| Sözleşme ekranı | `runtimeUiModule.ts`, `engine/ui/uiWidget.ts`, `uiBinding.ts`, ekran yığını | `M0_Contract.ui.json`, ViewModel alanları ve `ui-action`; yeni renderer/ekran altyapısı yok. |
| Etkileşim | C dilimindeki mevcut Vehicle Game Mode session'ı, ScriptMessageBus | Duran etkin araç + fiziksel depo alanı; depo panelindeki sarı pano düğmesi. Panonun `logistics.board` rolü ve behavior bağlantısı, pickup/delivery kimlikleri kontrol edilir. |
| Görev durumu | `engine/behavior/behaviorSubsystem.ts`, `ScriptState.persist` | `contractBoard.ts`, mevcut `transport.ts` geçişleri, panoda tek `ridgebound.transport.v1` değeri. |
| Kayıt | `saveGameModule.ts`, `save:write:quick`, `save:load:quick` | Kabul/iptal sonrası hızlı kayıt; elle yeniden kayıt/yükleme; hata mesajı. İkinci storage veya dev-save ilerleme yazımı yok. |
| UI katman sırası | Forge `src/style.css` | Genel düzeltme Forge'da: ekran kökü z-index 2, dünya etiketi katmanı 1. |

Ortak game module/catalog korunur. Behavior factory, ortak modül kaydında
compose edilir; servis ikinci kez provide edilmez. `common.update` de iletilir.
Manifest oyun girişlerini seçmeye devam eder; yeni widget mevcut UI loadGroup'a
eklenir. Sahnedeki tek değişiklik panoya mevcut `behavior.script` alanıdır.
Bu alan loader ve Forge `tools/saveValidator.ts` içinde zaten desteklenir;
yeni authored alan veya validator değişikliği yoktur.

## Davranış ve içerik

- E ile depoya gir; “Sarı iş panosu — Sözleşmeyi aç” ayrı sözleşme ekranını açar.
- Özette yük, kg, çıkış/varış, sabit ücret ve risk bilgisi vardır. Rota mesafesi
  uydurulmaz; risk bilgisi yoksa açıkça belirtilir. Gerekçe yalnız ayrıntıdadır.
- Gerekçe ve koşullar bağımsız açılıp kapanır. Ayrıntı açmak kabul koşulu değildir.
- Açık kabul `offered → accepted`; kargo null, bakiye değişmez. Tekrar kabul reddedilir.
- Yükleme öncesi iptal `accepted → offered`; ceza/ödül yoktur. Yüklü iş iptal edilemez.
- Sözleşmeden Back/Esc depoya; depodan dönüş aynı sürüş session'ına gider.
  Sözleşme mesajları ekran açık değilken, araç yokken, uzaktayken veya hareketliyken işlenmez.
- Tek kalıcı değer sözleşme snapshot'ı, aşama, kargo/profil/araç, bakiye ve ödeme
  işaretini birlikte taşır. UI bu kayıttan türetilir. Restore otomatik ücret veya kayıt tetiklemez.
- Şema, demo sözleşme kimliği/içeriği ve durum tutarlılığı doğrulanır. Bozuk veya
  uyumsuz değer korunur, komutlar engellenir; yeni işe sessizce çevrilmez.
- 500 kg hafif erzak / 100 deneme kredisi açıkça deneme sözleşmesidir.
  Gaz52 nominal kapasitesi, ağır profil ve nihai ekonomi bu dilimde kararlaştırılmadı.
- Kayıt hatası ilerlemeyi oturumdan silmez. Türkçe hata, yeniden kaydetme ve yükleme
  düğmeleri vardır. Sayfa açılışı yeni oturumdur; eski hızlı kayıt açık yükleme ile alınır.

## Doğrulama

- Ridgebound `npm.cmd run check`: GEÇTİ. İlk sandbox/esbuild erişim engeli başarı sayılmadı;
  izinli çalıştırma kullanıldı. Forge TypeScript'i değiştirilmedi.
- `node --test tests/m0/contractBoard.test.mjs tests/m0/depotSession.test.mjs tests/m0/depot.test.mjs tests/m0/transport.test.mjs`:
  16/16 GEÇTİ. Gerçek Forge BehaviorSubsystem, collector, SaveGameStore ve restore
  kullanılır; yalnız JSON kopyası kanıtı değildir. Kayıt testinin storage adapter'ı memory'dir.
- Filtreli Forge `test:engine`: 30 geçti, 2160 filtreyle atlandı. UI şema/render/binding,
  ViewModel ve dünya etiketi grubu; tam motor gate'i veya green build değildir.
  İlk isim filtresi yalnız 2 test seçti; kapsam gerçek test adlarıyla genişletildi.
- Ayrı proje `.forge/m0-d-validation/`, ayrı isim `Ridgebound D Validation`, port 5198:
  normal klavye/düğmelerle depo → sözleşme → ayrıntısız kabul → tekrar kabul reddi →
  iptal → yeniden kabul → Back/Esc sürüş; tümü geçti.
- Browser localStorage kaydında tek görev flags girdisi, cargo=null, balance=0,
  rewardPaid=false görüldü. Kabul edilmiş ve iptal edilmiş durumlar gerçek Forge
  level travel/load ile geri geldi; kabul kaydı sayfa reload'undan sonra da yüklendi.
- Fixture tarayıcısında storage yazımı hata verecek şekilde sınandı: iptal oturumda
  kaldı, eski kayıt bozulmadı, hata gösterildi; engel kaldırılıp “Hızlı kaydet” ile
  tekrar kayıt ve offered restore geçti. Hata metni başarılı kayıttan sonra temizlendi.
- 1440×900 ve 1100×720: iki ayrıntı birlikte açıkken panel ve alt eylemler ekrana sığar.
  Küçük görünümde sözleşme başlığı üstteki DOM öğesidir; dünya etiketleri örtmez.
  İsteğe bağlı F8 geliştirici telemetrisi görsel QA'da kapatıldı.
- Son fixture browser turunda page/console/HTTP hatası yoktu. İlk gerçek proje
  açılışındaki favicon 404 ve servis bileşim hatası başarı sayılmadı; servis bileşimi düzeltildi.

Git dışı kanıtlar: `.forge/m0-contract/qa.md`, `contract-open.png`,
`contract-small.png`, `browser-result.json`. Gerçek Landscape'e otomatik
Save Layout testi yapılmadı; fixture ayrı proje alanında kaldı.

## Kaynak durumu ve sınırlar

Kontrol edilen HEAD'ler: Ridgebound `2a0bd3f`, Forge `995b7132`; bu D değişiklikleri
commit edilmemiş çalışma ağacındadır. Forge'un eşzamanlı
`public/assets/starter-content/Levels/Terrain.level.json` değişikliği korunmuştur.
Ridgebound oyun/veri/belgeleri ve Forge genel CSS düzeltmesi ayrı depolardadır.

Yeni production build/verify-build ve tam Forge build gate'i çalıştırılmadı.
M0-02–05 için teknik kanıt oluştu; kullanıcı kabul kutuları açık kaldı.
Yükleme, görev HUD'u, teslim/ödül, diğer görev aşamalarının browser save/load'u,
kurtarma ve tam manuel nakliye oturumu sonraki dilimlerdir.
