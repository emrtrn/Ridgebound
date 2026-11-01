# Ridgebound M0 — uygulama ve kabul kontrol listesi

Tarih: 02.11.2026. P2 teknik ve kullanıcı kabulü tamamlandı.
M0 durumu: **KISMİ — A–G teknik dilimleri hazır; H kapanış açık. Kullanıcı kabul/yükleme/sürüş ile gerçek teslim noktasına ulaşmayı doğruladı; F teslim/sonuç ve G kurtarma kullanıcı kabulü henüz yok.**
Bu belge canlı çalışma listesidir; tarihsel tasarım belgeleri değiştirilmez.
`[x]` yalnız satırda belirtilen işi doğrular; bir uygulama kutusunun kapanması
ilgili M0 oyun kabulünün geçtiği anlamına gelmez.

## 1. Kaynak ve kullanıcı kararları

- [x] [AGENTS.md](../AGENTS.md), [entegrasyon rehberi](FORGE_INTEGRATION.md),
  [README](../README.md), [GDD](GDD.md) ve ilgili Forge kaynakları incelendi.
- [x] Bağlayıcı kapsam: [D-010](design/FORGE_OFFROAD_ASAMA_1_KAPANIS_VE_D010_v1.0.md).
- [x] İşleyiş: [v0.2 toplu kararlar](design/02_CORE_GAMEPLAY_LOOP_v0.2_TOPLU_KARAR_KAYDI.md).
  Eski ana GDD'deki açık işleyiş alanlarında bu daha güncel kayıt esas alınır.
- [x] Kabul kapısı: [M0 v0.5, bölüm 6–7](design/FORGE_OFFROAD_M0_UYGULAMA_VE_KABUL_RAPORU_v0.5.md).
- [x] Kullanıcı içerik kararı: araç **Gaz52**; Forge'daki
  `public/assets/vehicles/gaz52/` içeriği kullanılacak.
- [x] Kullanıcı sahne kararı: mevcut **`public/assets/Maps/Landscape.level.json`**
  üzerinde arazi kurulacak; ayrı bir M0 sahnesi açılmayacak.
- [x] Terrain materyalleri Forge'dan seçilerek alınacak. Bina/çevre graybox olabilir.
  World Builder ile yol ve yerleşim kurulacak; yeni dünya üreticisi yazılmayacak.

## 2. Çalışma ağacı ve sahiplik

İnceleme başlangıcı: Ridgebound `4031ea6`, Forge `0bc3643d`.
`tools/forge.mjs` seçim kuralı kontrol edildi; seçili Forge kökü
`C:/Users/emret/Desktop/Forge`. Bu yerel yol runtime içeriğine yazılmaz.

- [x] İki deponun Git durumu kontrol edildi; Forge başlangıçta temiz.
- [x] Ridgebound'daki mevcut README, manifest, Prototype, proje manifesti,
  `.vscode/`, AGENTS/CLAUDE, entegrasyon belgesi, Maps ve sunucu aracı çalışmaları
  mevcut kullanıcı/eşzamanlı çalışma olarak ayrıldı.
- [ ] Her sonraki dilimden önce durumu yeniden kontrol et; mevcut çalışmayı ezme.
- [x] Landscape'in mevcut ışık, Sky/Cloud/PostProcess ve environment ayarlarını koru (B öncesi/sonrası JSON karşılaştırması).
- [ ] Genel motor/editör düzeltmesi gerekirse Forge'da yap; izin gereksinimini bildir.
- [ ] Oyun kuralları `src/game/`, içerik `public/`, belgeler `docs/` içinde kalsın.

Branch/commit/push/merge/yayın yetkisi bu listeden türetilmez. Forge kaynakları,
bağımlılıkları, editörü veya save altyapısı Ridgebound'a kopyalanmaz.

## 3. Mevcut Forge sistemleriyle eşleme

Aşağıdaki Forge yolları seçili köke göredir.

| İhtiyaç | Mevcut kaynak | Ridgebound verisi/bağlantısı ve eksik |
|---|---|---|
| Araç | `engine/physics/vehicle/`, `src/game/gameModes/vehicleDriver.ts`, `vehicleGameMode.ts` | Gaz52 GLB/Vehicle/actor ve manifest bağımlılıkları; sahnede tek araç. Genel sürüş tekrar yazılmaz. |
| Açık etkileşim | `src/game/behaviors.ts` içindeki `interact` + `inputAction`, script mesajları | Depo/pano/yükleme/teslim işaretleri; etkin araç ve menzil doğrulaması; oyuna özgü komutlar. |
| Hibrit kamera | `PlayerCameraManager`, `rtsCameraControl.ts`, `GameModeContext` | Depo merkezli sınırlar ve sürüş/depo modu; mevcut yardımcıları compose et. RTS modu tek başına hazır depo akışı değil. |
| HUD/sözleşme | `runtimeUiModule.ts`, `engine/ui/uiWidget.ts`, `uiViewModel.ts` | `.ui.json` asset'leri, ekran mesajları ve oyun ViewModel alanları. |
| İş/kargo/ücret | Ortak game module, behavior registry ve mesajlaşma genişletme noktaları | `src/game/m0/` içinde oyun kuralları. Hazır nakliye akışı bulunmadı; genel objective sistemi M0 kabulü sayılmaz. |
| Kayıt | `engine/persistence/`, `saveGameModule.ts`, `ScriptState.persist` | Görev/kargo/ücret durumunu tek tutarlı script değeriyle mevcut flags kanalına bağla. İkinci storage sistemi kurma. |
| Kurtarma | `GameModeVehicles.reset`, `VehicleDriver.resetUpright` | Güvenli nokta ve görevi/kargoyu koruyan yeniden deneme politikası. |
| Terrain | `engine/terrain/`, terrain editor/generation araçları | Landscape'e World Terrain definition/tile verisi; seçilmiş Forge katmanları ve texture bağımlılıkları. |
| World Builder | `engine/worldbuilder/stages/`, `src/editor/worldBuilderSession.ts` | Landscape recipe, küçük plan, yollar, depo/teslim yerleşimi ve graybox profile. Dry Run → Apply → Save. |

World Builder mevcut aşamaları: planBlockout, roads, settlementSites, streets,
parcels, landUse, buildings, furniture, fences. Taban heightfield üreten ayrı bir
terrain stage'i varsayılmaz. Önce Forge terrain araçlarıyla zemin hazırlanır;
roads spline üretir, deform/boya ve bina pedleri açık bake işlemleriyle uygulanır.
Yeni genel motor değişikliği şu an zorunlu olarak kanıtlanmış değil.

## 4. Sıralı uygulama dilimleri

### A — Görev ve kargo veri sözleşmesi

- [x] Hafif/ağır profili, nominal kg sınırı, iş/yük/nokta/araç kimliklerini tanımla.
- [x] `offered → accepted → loaded → delivered → completed` geçişlerini ayır.
- [x] Tek durum kaydında ikinci kabulü engelle; kabul otomatik yüklemesin.
- [x] Yükleme öncesi cezasız iptal; yüklüyken iptali reddet.
- [x] Yanlış nokta/yük/araç, boş teslim ve kapasite aşımını reddet.
- [x] Tamamlanma, ödeme işareti ve bakiyeyi tek durum değişikliğiyle üret.
- [x] Odaklı kural testlerini ve Ridgebound type-check sonucunu doğrula (günlükte).
- [x] D kabul/iptal ve E yükleme/HUD runtime'ında tek otoriter görev kaydını kullan; paralel kayıt oluşturma. F bağlantısı henüz yok.

Kod: `src/game/m0/transport.ts`; testler: `tests/m0/transport.test.mjs`.
Bu dilim fizik/input/UI/save uygulamaz. Sayılar yalnız test fixture'larında;
Gaz52'nin gerçek taşıma kapasitesi veya oyun ekonomisi kararlaştırılmış değildir.

### B — Landscape, World Builder ve içerik

- [x] Gaz52'nin yalnız gereken model/actor/vehicle ve varsa ses/texture
  bağımlılıklarını Forge'dan seç; kaynak kimliklerini ve lisans bilgisini koru.
- [x] Forge terrain katman/material/texture bağımlılıklarını seçerek al;
  tüm starter-content veya Forge örnek sahnesini taşımadan manifesti birleştir.
- [x] Mevcut Landscape üzerinde küçük World Terrain alanı oluştur; tile ve
  definition tutarlılığını koru; boyut/seed/yükseklikleri test parametresi olarak kaydet.
- [x] Landscape'e ait World Builder recipe ve bölge profilini kur.
- [x] Depo ve teslim konumlarını, ana yol ve ileride M1 karşılaştırmasına uygun
  alternatif yol taslağını planla. Rotalar zorunlu koridor olmasın.
- [x] Dry Run diff'ini incele; mevcut/manual öğeleri koruyarak uygula (Forge `planStage` çıktısı).
- [x] Yol deform/boya ve gerekli bina pedlerini mevcut bake/undo işlemleriyle uygula.
- [x] Depo/pano/yükleme/teslim ve çevre binalarını graybox ile kur.
- [x] Tek Gaz52, sürüş Game Mode'u ve güvenli başlangıç noktası bağla.
- [x] Editör save/reload ve Play'de asset, collision, terrain ve araç bağlantısını doğrula
  (save geçici bağımsız proje kopyasında; gerçek Landscape salt okunur browser kontrolü).

B kanıtı: [saha raporu](reports/M0_B_LANDSCAPE.md). Kullanıcı görsel/sürüş kabulü açık.

Çıkış: Landscape üzerinde sürülebilir araç ve erişilebilir iki nokta.
M0-01 ancak tek iş de runtime'a bağlanınca kapanır. M1 fizik kabulü burada aranmaz.

### C — Depo modu ve hibrit kamera

- [x] Duran etkin araç + menzil + açık eylem ile depo moduna gir.
- [x] Sınırlı 3/4 kamera; depo merkezi odak, dünya tıklaması odağı değiştirmesin.
- [x] Mevcut araç modundaki E/interact reset çakışmasını gider; E depo, R upright reset.
- [x] UI açıkken sürüş girişini kes; güvenli frenleme/park davranışını doğrula.
- [x] Açık “Sürüşe dön” ve etiketli Esc eylemiyle aynı araca dön; giriş/çıkışı tekrarla.

C kanıtı: [depo/kamera raporu](reports/M0_C_DEPOT_CAMERA.md). Kamera kontrolleri
Forge UI düğmeleridir; zoom/orbit/pan sınırları prototip değeridir. Pano/sözleşme
D diliminde olduğundan **M0-02 tam kabulü hâlâ açık**. Kullanıcı C görsel kabulünü onayladı.

### D — İş panosu ve sözleşme

- [x] Fiziksel panodan sözleşme aç; özet: yük adı, kg, çıkış/varış, ücret, bilinen riskler.
- [x] Gerekçe ayrıntıda; birden fazla bölüm açık kalabilsin, hepsini okumak zorunlu olmasın.
- [x] Kabul ve yüklemeyi ayır; tek aktif iş ve yükleme öncesi iptali bağla. M0-03–05 teknik kanıtı.

D kanıtı: [pano/sözleşme raporu](reports/M0_D_CONTRACT_BOARD.md). Depo panelinden
sahnedeki sarı panoya bağlı ayrı sözleşme ekranı açılır. 500 kg erzak ve 100 deneme
kredisi açıkça **deneme içeriğidir**; gerçek ekonomi/kapasite kararı değildir.
Kabul/iptal mevcut Forge `flags` ve hızlı kayıt kanalına bağlıdır; iki durumun
gerçek browser save/load turu geçti. D kullanıcı görsel kabulü henüz alınmadı.

### E — Yükleme ve HUD

- [x] Hafif/ağır içerik profilleri ve nominal kapasite için etiketli test değerleri seç.
- [x] Doğru noktada açık yükleme; kapasite üstü yüklenmesin, kimlik korunsun.
- [x] HUD: iş, yük/durum, hedef/yön, hız, eylem ve anlaşılır hata mesajı.
- [x] Sade rota kıyasında yalnız tanımlı/ölçülmüş mesafe ve riskleri göster;
  bilgi yoksa bunu belirt. Tam GPS veya güvenlik garantisi yok. M0-06–08.

E kanıtı: [yükleme/HUD raporu](reports/M0_E_LOADING_HUD.md). Hafif 500 kg,
ağır 1500 kg, sınır üstü denemesi 2500 kg; Gaz52 için 2000 kg **deneme kapasitesi**.
Yükleme mevcut depo ekranında ayrı eylemdir; gerçek fizik kütlesi/COM değişmez (M1).
Yol çizgileri Forge spline örneklemesiyle yatay ölçüldü: ana 533 m, alternatif
435 m; depo/teslim bağlantıları ve sürüş riski bu ölçüme dahil değildir.
Yüklü hafif/ağır browser save/load geçti. Kullanıcı gerçek sahnede işi kabul edip
yüklediğini ve teslim noktasına ulaştığını bildirdi. Bu ana akış kullanıcı kanıtıdır;
her deneme profili/kapasite olumsuz senaryosunun manuel sınandığı anlamına gelmez.

### F — Teslim ve sonuç

- [x] Aktif iş + doğru kargo + aynı taşıyıcı araç + doğru nokta + açık teslimi bağla.
- [x] Yanlış nokta/yük/boş araç ve art arda komutları sınayarak reddet.
- [x] Teslim/tamamlanma ve bir defalık sabit ücreti bağla; yeni iş otomatik başlamasın.
- [x] Sonuç ekranından tekrar ödeme yapılamasın. M0-09–12 teknik kanıtı.

F kanıtı: [teslim/sonuç raporu](reports/M0_F_DELIVERY_RESULT.md). Yeşil alanda
durunca E ekranı açar; ayrı “Teslim et” onayı yükü teslim eder. Bölgeye giriş
otomatik teslim/ödeme değildir. Mevcut tek görev kaydı delivered makbuzunu,
ardından completed/ödeme işareti/bakiyeyi saklar. Tekrar onay veya completed
restore ek ücret üretmez. Delivered restore açık onayla tamamlanabilir.
F kullanıcı kabulü ve H kapanış kanıtı açık kalır; G teknik kanıtı aşağıdadır.

### G — Kayıt ve kurtarma

Kayıt bağlantısını her dilimde geliştir; bu bölüm son ana ertelenmez.

- [x] Mevcut save capability ve `flags` içinde görev örneği/sözleşme snapshot'ı,
  aşama, kargo/profil/araç kimlikleri, bakiye ve ödeme işaretini birlikte sakla.
- [x] Restore öncesi oyun verisini doğrula; eski/bozuk/uyumsuz veriyi sessizce
  yeniden yorumlama. Şema/migrasyon ihtiyacını Forge kayıt sözleşmesine göre ele al.
- [x] Kabul/yüklü/teslim edilmiş/tamamlanmış aşamalarda save/load round-trip yap.
- [x] Restore sonrası HUD'u kayıt durumundan türet; bildirimi ücret ekleme tetikleyicisi yapma.
- [x] Güvenli konuma reset görev/kargoyu korusun; tamamlanan işi yeniden ödeme.
- [x] Storage hatası ve restore sırasında komut sırasını sınayarak sonucu raporla.
- [x] Yeni authored alan varsa loader/normalizer/`tools/saveValidator.ts` allowlist'ini kontrol et.
  Runtime save localStorage'dır; sahne/dev save endpoint'lerine ilerleme yazılmaz.
- [x] M0-12–14 için gerçek Forge save/load kanıtı üret; JSON kopyası bunu kanıtlamaz.

G kanıtı: [kayıt/kurtarma raporu](reports/M0_G_PERSISTENCE_RECOVERY.md).
Tek kayıt korunur; restore güncel pano/taşıyıcı ve sözleşmeyle doğrulanır.
Uyumsuz eski indeksler sessiz taşınmaz; işlem/kayıt bloke edilerek slot korunur.
T aynı aracı authored güvenli başlangıca döndürür; görev/kargo/bakiye korunur.
31/31 regresyon ve check geçti; browser accepted/loaded/completed load,
loaded/completed kurtarma ve storage/uyumsuz kayıt ekranları doğrulandı.
Delivered için F browser kanıtı ve G gerçek Forge store/restore regresyonu vardır.
Bu teknik kanıtlar H tam manuel oturum ve kullanıcı kabulünü kapatmaz.

### H — Kapanış

- [ ] Tam oturumu Ridgebound üzerinden Playwright ile doğrula; UI/console/asset hatalarını kaydet.
- [ ] Kullanıcı manuel nakliye oturumunu tamamlasın; süre, kontrol/kamera hissi ve sorunlar kaydedilsin.
- [ ] 15 kabul maddesinin her birine kanıt bağla; teknik ve kullanıcı kabulünü ayrı yaz.
- [ ] Ridgebound `npm.cmd run check`, `build`, `verify:build` sonuçlarını kaydet.
- [ ] Forge değiştiyse `npx.cmd tsc --noEmit`, ilgili regresyon ve uygun motor gate'ini çalıştır.
- [ ] Test edilen iki kaynak durumunu, dirty farklarını ve build kimliğini kaydet.

## 5. Bağlayıcı M0 kabul listesi

Kaynak şablondaki kimlikler korunur. Tam M0 kabulü henüz yoktur. M0-02–12 için
D/E/F/G teknik kanıtı vardır; M0-13–14 kayıt/kurtarma teknik kanıtı da eklendi.
Tüm kabul koşulları kapanmadığından kutular kapatılmadı.

- [ ] M0-01 — Tek araç sürülür; depo, teslimat ve tek iş sahnede tanımlıdır.
- [ ] M0-02 — Depo/pano açılır, yönetim görünümünden sürüşe dönülür.
- [ ] M0-03 — Onaylı sözleşme özeti ve isteğe bağlı ayrıntılar görünür.
- [ ] M0-04 — Açık kabul durum değiştirir, otomatik yüklemez.
- [ ] M0-05 — İkinci aktif iş engellenir; yükleme öncesi iptal sınanır.
- [ ] M0-06 — Hafif/ağır profiller vardır; kapasite üstü yüklenmez.
- [ ] M0-07 — Doğru noktada açık yükleme ve kargo kimliği korunur.
- [ ] M0-08 — HUD görev/hedef/yük/teslim durumunu anlaşılır gösterir.
- [ ] M0-09 — Yanlış konum/yük ve boş araç teslimatı reddedilir.
- [ ] M0-10 — Doğru yük doğru noktada açık teslimle işi tamamlar.
- [ ] M0-11 — Sabit sözleşme ücreti ve sonuç geri bildirimi oluşur.
- [ ] M0-12 — Tekrar etkileşim/save/load/restart ikinci ücret üretmez.
- [ ] M0-13 — Kabul/yüklenme/teslim/tamamlanma save/load tutarlıdır.
- [ ] M0-14 — Yeniden deneme görev/kargoyu bozmadan işler.
- [ ] M0-15 — Tam manuel oturum ve gözlenen süre kaydedilir.

## 6. Açık kararlar ve kapsam sınırı

- [ ] Kapasite, yük kg, ücret/para birimi ve yük adları: gerçek içerik henüz seçilmedi. E: 500/1500/2500 kg erzak, 2000 kg kapasite, 100 deneme kredisi; etiketli test içeriği.
- [ ] Arazi boyutu, seed, depo/teslim koordinatları ve rota ölçüleri: test/kalibrasyon.
- [ ] Kamera sınırları, durma eşiği, etkileşim menzili ve tuşlar: prototipte kalibre edilecek.
- [x] Prototip kayıt politikası: kritik geçişler ve T kurtarma sonrası mevcut capability ile quick slot; hata görünür, manuel tekrar kayıt var.
- [x] Prototip reset hedefi: T ile aynı aracın authored başlangıcı; görev/kargo/bakiye korunur. R yerinde düzeltir. Kullanıcı kabulü H'de.
- [ ] Tamamlanmış işi yeniden sunma: açık; otomatik yeniden başlatma yok.

M1: yükün kütle/COM etkisi, üç yüzey ve iki rotanın ölçülebilir sürüş farkı.
M2: iz/batma/deformasyon. Materyallerin alınması bu kabulleri kapatmaz.
5–10 dakika oturum hedefidir, zorunlu teslim süresi değildir. FPS karakter,
vinç/römork, çoklu aktif iş, karmaşık ekonomi ve büyük dünya M0 kapsamı değildir.

## 7. Uygulama ve kanıt günlüğü

| Tarih | İş | Kanıt / sınır |
|---|---|---|
| 01.11.2026 | Liste ve güncel içerik kararları kaydedildi; Forge eşlemesi incelendi | Gaz52 actor/vehicle/GLB Forge'da var; Ridgebound'a aktarım henüz yok. Landscape mevcut haliyle korundu. |
| 01.11.2026 | A dilimi saf oyun kuralları eklendi | `src/game/m0/transport.ts`, `tests/m0/transport.test.mjs`; runtime/save bağlantısı yok. |
| 01.11.2026 | Odaklı kurallar | `node --test tests/m0/transport.test.mjs`: 6 geçti, 0 kaldı. Kapasite eşitliği/aşımı, hafif/ağır, yanlış teslimler, iptal ve tekrar ödeme reddi. JSON kopyası gerçek save/load kanıtı değildir. |
| 01.11.2026 | TypeScript ve import sınırları | `npm.cmd run check`: GEÇTİ. İlk sandbox denemesi Forge/esbuild dizin erişiminde durdu; izinli tekrar exit 0. İlk deneme başarı sayılmadı. |

A diliminde Forge kaynağı ve mevcut sahne/manifest içerikleri değiştirilmedi.
A sırasında build/browser/manuel oyun kabulü yapılmadı; M0-01–15 açık kaldı.

| Tarih | İş | Kanıt / sınır |
|---|---|---|
| 01.11.2026 | B saha/içerik bağlantısı | 14 Forge asset'i; mevcut Landscape'te 512×512 m World Terrain, 4 tile + global map, 2 yol, 3 bina, 7 parsel; mevcut World Builder ve bake API'leri. |
| 01.11.2026 | B teknik doğrulama | Son `npm.cmd run check` geçti; browser Gaz52 sürüşünde 16 km/sa, direksiyon/el freni/reset, World Builder profil yükleme; fixture save 200, dropped=[] ve reload/Play. Ayrıntı: `reports/M0_B_LANDSCAPE.md`. |

| 01.11.2026 | C depo modu ve kamera | Duran araçla E girişi; Forge UI paneli, sınırlı RTS kamera yardımcıları, park ve aynı araca dönüş. Kaynak `src/game/m0/depotGameMode.ts`; rapor `reports/M0_C_DEPOT_CAMERA.md`. |
| 01.11.2026 | C doğrulama | 12 M0 testi geçti; son check geçti; browser hareketli/uzak giriş reddi, kamera sınırları, basılı tuş güvenliği, dönüş, küçük viewport; geçici proje save/reload/Play geçti. |
| 01.11.2026 | C kullanıcı kabulü | Kullanıcı depo/kamera görsel kabulünü onayladı. M0-02 pano/sözleşme nedeniyle açık. |
| 01.11.2026 | Saha işaretleri | Kullanıcı testinde yük alanı bulunamadı. Pano sarı, yük alanı turuncu, teslim yeşil; üçüne Forge `worldWidgets` etiketi (pano/yük 160 m'de söner, teslim her mesafede). Browser: 3 etiket yüklendi, başlangıçta yük alanı etiketi okunur, depo ipucu "E — Depo yönetimine geç", console/HTTP hatası yok. Görev yönü/HUD hâlâ E dilimi. |

| Tarih | İş | Kanıt / sınır |
|---|---|---|
| 01.11.2026 | D pano/sözleşme | Forge UI + mevcut Behavior/ScriptState ile ayrı sözleşme, bağımsız ayrıntılar, kabul/iptal; tek `ridgebound.transport.v1` kaydı. Rapor: `reports/M0_D_CONTRACT_BOARD.md`. |
| 01.11.2026 | D doğrulama | 16/16 M0 testi, Ridgebound check geçti. Ayrı 5198 projesinde kabul/iptal save/load, reload, storage hatası/tekrar kayıt, Back/Esc ve iki viewport doğrulandı. |
| 01.11.2026 | Forge UI katman düzeltmesi | `src/style.css`: ekran kökü dünya etiketlerinin üstünde. Ridgebound küçük ekran browser kanıtı + filtreli Forge UI grubunda 30 test geçti; tam motor/build gate'i değildir. |
| 01.11.2026 | E yükleme ve HUD | Mevcut Forge Vehicle session + UI/ViewModel + tek kalıcı görev kaydı. Hafif/ağır seçim, açık yükleme, nominal kapasite reddi, kargo/araç kimliği, canlı görev HUD'u ve rota bilgisi. Rapor: `reports/M0_E_LOADING_HUD.md`. |
| 01.11.2026 | E doğrulama | 21/21 M0 testi ve Ridgebound check geçti. Ayrı 5199 projesinde hafif/ağır yükleme, aşım reddi, loaded save/load, storage hatası/tekrar kayıt, canlı hız ve iki viewport doğrulandı. Forge kaynakları bu dilimde değiştirilmedi. |
| 01.11.2026 | E kullanıcı testi | Kullanıcı gerçek sahnede işi kabul etti, yükledi ve teslim noktasına ulaştı. Teslimin henüz yapılamaması o anda açık olan F kapsamıydı; tüm olumsuz koşulların manuel kabulü iddia edilmedi. |
| 01.11.2026 | F teslim/sonuç | Yeşil noktada duran aynı araç + E ekranı + açık onay; delivered makbuzu ve tek complete/ödeme güncellemesi; sonuç/bakiye ve yeniden açma. |
| 01.11.2026 | F doğrulama | 26/26 M0 testi ve check geçti. Ayrı 5200 projesinde boş teslim reddi, açık onay, storage hatasında delivered restore, completed save/load ve tekrar komutlarda bakiye 100 kaldı. Güncel cell düzeninde Forge merge bağlantısı ve salt okunur runtime/depo kontrolü de geçti. Rapor: `reports/M0_F_DELIVERY_RESULT.md`. |

| 02.11.2026 | G kayıt/kurtarma | Restore öncesi oyun doğrulaması, eski pano/taşıyıcı reddi, pending load komut kilidi ve Forge reset üzerinden T güvenli dönüş. Rapor: `reports/M0_G_PERSISTENCE_RECOVERY.md`. |
| 02.11.2026 | G doğrulama | 31/31 M0 regresyonu ve check geçti. Ayrı 5201 projesinde accepted/loaded/completed load, loaded/completed güvenli dönüş, storage hatası ve eski pano kaydını koruma doğrulandı. Forge kaynakları değiştirilmedi. |

Sıradaki dilim H kapanış.
M0-01–15 tam kabul kutuları açık. B–G için yeni production build üretilmedi.
