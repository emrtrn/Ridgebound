# Ridgebound M0 — uygulama ve kabul kontrol listesi

Tarih: 01.11.2026. P2 teknik ve kullanıcı kabulü tamamlandı.
M0 durumu: **KISMİ — A kural dilimi, B saha bağlantısı ve C depo/kamera akışı hazır; görev runtime'ı ve kullanıcı kabulü henüz yok.**
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
- [ ] Runtime bağlanınca tek otoriter görev kaydını kullan; paralel kayıt oluşturma.

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

- [ ] Fiziksel panodan sözleşme aç; özet: yük adı, kg, çıkış/varış, ücret, bilinen riskler.
- [ ] Gerekçe ayrıntıda; birden fazla bölüm açık kalabilsin, hepsini okumak zorunlu olmasın.
- [ ] Kabul ve yüklemeyi ayır; tek aktif iş ve yükleme öncesi iptali bağla. M0-03–05.

### E — Yükleme ve HUD

- [ ] Hafif/ağır içerik profilleri ve nominal kapasite için etiketli test değerleri seç.
- [ ] Doğru noktada açık yükleme; kapasite üstü yüklenmesin, kimlik korunsun.
- [ ] HUD: iş, yük/durum, hedef/yön, hız, eylem ve anlaşılır hata mesajı.
- [ ] Sade rota kıyasında yalnız tanımlı/ölçülmüş mesafe ve riskleri göster;
  bilgi yoksa bunu belirt. Tam GPS veya güvenlik garantisi yok. M0-06–08.

### F — Teslim ve sonuç

- [ ] Aktif iş + doğru kargo + aynı taşıyıcı araç + doğru nokta + açık teslimi bağla.
- [ ] Yanlış nokta/yük/boş araç ve art arda komutları sınayarak reddet.
- [ ] Teslim/tamamlanma ve bir defalık sabit ücreti bağla; yeni iş otomatik başlamasın.
- [ ] Sonuç ekranından tekrar ödeme yapılamasın. M0-09–12.

### G — Kayıt ve kurtarma

Kayıt bağlantısını her dilimde geliştir; bu bölüm son ana ertelenmez.

- [ ] Mevcut save capability ve `flags` içinde görev örneği/sözleşme snapshot'ı,
  aşama, kargo/profil/araç kimlikleri, bakiye ve ödeme işaretini birlikte sakla.
- [ ] Restore öncesi oyun verisini doğrula; eski/bozuk/uyumsuz veriyi sessizce
  yeniden yorumlama. Şema/migrasyon ihtiyacını Forge kayıt sözleşmesine göre ele al.
- [ ] Kabul/yüklü/teslim edilmiş/tamamlanmış aşamalarda save/load round-trip yap.
- [ ] Restore sonrası HUD'u kayıt durumundan türet; bildirimi ücret ekleme tetikleyicisi yapma.
- [ ] Güvenli konuma reset görev/kargoyu korusun; tamamlanan işi yeniden ödeme.
- [ ] Storage hatası ve restore sırasında komut sırasını sınayarak sonucu raporla.
- [ ] Yeni authored alan varsa loader/normalizer/`tools/saveValidator.ts` allowlist'ini kontrol et.
  Runtime save localStorage'dır; sahne/dev save endpoint'lerine ilerleme yazılmaz.
- [ ] M0-12–14 için gerçek Forge save/load kanıtı üret; JSON kopyası bunu kanıtlamaz.

### H — Kapanış

- [ ] Tam oturumu Ridgebound üzerinden Playwright ile doğrula; UI/console/asset hatalarını kaydet.
- [ ] Kullanıcı manuel nakliye oturumunu tamamlasın; süre, kontrol/kamera hissi ve sorunlar kaydedilsin.
- [ ] 15 kabul maddesinin her birine kanıt bağla; teknik ve kullanıcı kabulünü ayrı yaz.
- [ ] Ridgebound `npm.cmd run check`, `build`, `verify:build` sonuçlarını kaydet.
- [ ] Forge değiştiyse `npx.cmd tsc --noEmit`, ilgili regresyon ve uygun motor gate'ini çalıştır.
- [ ] Test edilen iki kaynak durumunu, dirty farklarını ve build kimliğini kaydet.

## 5. Bağlayıcı M0 kabul listesi

Kaynak şablondaki kimlikler korunur. Tamamı şimdilik **TEST EDİLMEDİ**.

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

- [ ] Kapasite, yük kg, ücret/para birimi ve yük adları: gerçek içerik henüz seçilmedi.
- [ ] Arazi boyutu, seed, depo/teslim koordinatları ve rota ölçüleri: test/kalibrasyon.
- [ ] Kamera sınırları, durma eşiği, etkileşim menzili ve tuşlar: prototipte kalibre edilecek.
- [ ] Otomatik kayıt politikası: öneri kritik geçişler sonrası mevcut capability ile kayıt.
- [ ] Reset hedefi: öneri aktif görev/kargo korunarak güvenli noktaya dönmek.
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

Sıradaki dilim D: iş panosu ve sözleşme. Görev/kargo UI/save bağlantıları ve
M0-01–15 hâlâ açık. B/C için yeni production build üretilmedi.
