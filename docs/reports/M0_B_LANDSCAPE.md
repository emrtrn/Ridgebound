# M0 B — Landscape ve içerik bağlantısı

01.11.2026. Teknik saha bağlantısı tamamlandı; kullanıcı görsel/oynanış kabulü açık.
Bu rapor M0 görev döngüsü veya M1 yüzey/yük fiziği kabulü değildir.

## Değişiklikler

- Mevcut `assets/Maps/Landscape.level.json` kullanıldı. Işıklar, sky atmosphere,
  height fog, cloud layer, post process ve world environment alanları önceki
  değerleriyle korundu. Karşılaştırma yedeği `.forge/m0-landscape/before/` altında.
- Terrain: 512×512 m; 2×2 tile; tile başına 128 quad; spacing 2 m;
  f32 yükseklik; aralık -16…96 m. Bunlar prototip içerik değerleridir.
  Dağ eteği/vadi relief'i oyuna ait içeriktir; oluşturma, codec, normalizer,
  deform/boya ve ped uygulaması Forge fonksiyonlarıdır.
- World Builder recipe seed 52, `ridgebound-m0`; bölge profili
  `Landscape.regionprofile.json`. Roads → settlementSites → streets → parcels →
  landUse → buildings → furniture → fences mevcut aşamaları çalıştırıldı.
- Sonuç: 2 yol spline'ı, 2 yerleşim çekirdeği, 7 parsel, 3 graybox bina,
  4 çevre işareti; ayrıca pano/yük alma/teslim için 3 elle tanımlı graybox.
  Depo çekirdeği (-155,-65), teslim çekirdeği (170,50); araç başlangıcı (-180,-50).
- Ana yol genişliği 8 m, kısa yol 5 m. Ayrı yol mesh'i yok; mevcut spline
  deform/boya ile terrain üzerinde yollar var. M1 risk/güvenlik farkı kanıtlanmadı.
- Çim, toprak, kaya ve ıslak çamur materyalleri ile texture bağımlılıkları
  Forge'dan alındı. Dört katmanın fizik profili şimdilik `default`; materyal
  aktarımı M1 çamur/tutuş kabulü sayılmaz.
- Gaz52 actor/Vehicle/GLB ve placeholder motor sesi mevcut Forge asset'lerinden
  geldi. Kimlikler ve kaynak/lisans metadata'sı korundu; GLB harici URI içermiyor.
  Model mevcut haliyle kabin/şasidir; kasa/kargo görseli bu dilimde eklenmedi.
- Ortak module/catalog bileşimi korundu. `gameModule.ts`, mevcut Vehicle Game
  Mode factory'sini Gaz52 kamera ayarlarıyla compose eder: 12 m uzaklık,
  5 m yükseklik, 1.6 m bakış yüksekliği. Yeni sürüş/fizik/kamera motoru yok.
  Kontrol kartı W/S, A/D, Space, E ve F8 için güncellendi.

## Plan ve uygulama güvenliği

`tools/prepare-m0-landscape.mjs` yalnız bu ilk içerik kurulumuna aittir.
Varsayılan çalışması `.forge/m0-landscape/files/` altında içerik ve `plan.json`
üretir; public'i değiştirmez. `--apply` tüm hedeflerin önceki hash'lerini ve
staged byte hash'lerini kontrol eder, değişen girdide durur; önceki düzenlenmiş
dosyaları yedekler. Uygulanmış sahnenin üstüne yeniden üretim yapmayı reddeder.
Sonraki düzenlemeler Forge editör/World Builder araçlarıyla yapılır.

İlk uygulama 23 dosya, runtime global harita tamamlamasıyla toplam 24 içerik
dosyasıdır; 14 manifest asset'i eklendi (toplam 15). Yaklaşık 7.2 MiB içerik.
Forge kaynaklarına veya aktif Forge sahnelerine yazılmadı. Prototype, proje
manifesti, VS Code ve önceki kullanıcı çalışmaları korunur.

## Doğrulama

| Kontrol | Sonuç ve sınır |
|---|---|
| Forge API dry run | Son aşamalarda hata/blocked yok. Yol mesh'inin olmaması, boş parseller ve fence tanımı olmaması beklenen raporlar; eksik teslim binası/yol bağlantısı ilk denemelerde düzeltildi. |
| Terrain | Forge normalizer + tile codec round-trip; mevcut bake fonksiyonları. İlk runtime global map eksiği Forge codec'iyle giderildi; kalıcı üretim aracına eklendi. |
| `node --check tools/prepare-m0-landscape.mjs` | GEÇTİ. |
| Son `npm.cmd run check` | GEÇTİ: TypeScript ve import sınırları. Forge TypeScript'i değişmedi. |
| Gerçek Ridgebound browser | `http://127.0.0.1:5175/` ve `?editor`: terrain, Gaz52, graybox ve region profile yüklendi. Son kontrolde page/HTTP asset/console error yok. |
| Sürüş | Normal klavye girdisiyle W/D/Space/E: gaz, dönüş, el freni ve upright reset. Son ölçümde Vehicle modu `actor:0`, 16 km/sa, 2. vites, 1626 rpm. Yalnız temsilî kısa sürüş; iki güzergâhın tümü manuel sürülmedi. |
| UI/görsel | 1440×900 runtime ve editor; 1100×720 kontrol kartı ekran içinde. Kamera daha geniş araç çerçevesiyle incelendi; kullanıcı sanat/kamera hissi kabulü değildir. |
| Save/reload | `.forge/m0-validation/` bağımsız içerik kopyası, ayrı proje adı/port 5196. UI ile Gaz52 adı değiştirildi; Save Layout HTTP 200, changed=true, dropped=[], removedTerrain=[]. Reload adı korudu; Play açıldı. Gerçek Landscape'e test kaydı yapılmadı. |
| Ortam korunması | Önceki Landscape ile ışık/sky/fog/cloud/postprocess/environment alanlarının JSON eşitliği doğrulandı. |

Browser QA envanteri ve görseller (Git dışı):

- `.forge/m0-landscape/qa.md`
- `.forge/m0-landscape/plan.json` — dry run ve dosya hash'leri.
- `.forge/m0-landscape/editor-worldbuilder.png` — üstten yollar/yerleşimler.
- `.forge/m0-landscape/runtime-start.png` — Gaz52 ve güncel kontrol kartı.
- `.forge/m0-landscape/runtime-drive-reset.png` — kısa sürüş/reset kontrolü.
- `.forge/m0-landscape/runtime-small.png` — küçük viewport.
- `.forge/m0-landscape/browser-result.json` — sürüş debug ölçümü ve browser sonuçları.

İlk sandbox/esbuild erişim hataları başarı sayılmadı; izinli çalışma kullanıldı.
İlk runtime map eksikliği ve ilk kamera bileşimi denemesi düzeltilmeden önce
başarılı kabul edilmedi. Uygulama kaydı Forge ortak fonksiyonlarının kullanımını
kanıtlar; bunlar yeni genel motor özelliği değildir.

## Açıklar

Depo yönetimi ve hibrit kamera, gerçek sözleşme/pano/yükleme/teslim davranışları,
M0 kalıcı kayıt bağlantısı ve görev HUD'u sonraki dilimlerdir. Graybox marker'lar
şimdilik görsel konum işaretidir. E hâlen Forge upright reset eylemidir; depo
etkileşim çakışması C diliminde ele alınacak. M0-01–15 kapatılmadı.

Üretim build/verify-build ve tam oturum/kullanıcı kabulü bu dilimde yapılmadı.
FPS hedefi veya performans kabulü iddia edilmez. Mevcut sis/ışık değerleri korundu;
uzak mesafe okunurluğu ve görsel sonlandırma kullanıcı kabulünde değerlendirilecek.

Son çalışma ağacı kontrolünde Forge `public/assets/starter-content/Levels/Terrain.level.json`
için eşzamanlı bir değişiklik görüldü; bu çalışma tarafından düzenlenmedi ve korundu.
Ridgebound Landscape'in son byte hash'i ilk planla farklıydı: semantik karşılaştırma
yalnız dört Y değerinin editörün üç ondalık normalizasyonuyla yuvarlandığını gösterdi
(en büyük fark 0.000401 m); konum kimlikleri, içerik ve ortam alanları değişmedi.
Bu son kayıt geri alınmadı. Gerçek sahneye otomatik Save testi uygulanmadı;
Save testi ayrı 5196 projesinde yapıldı.
Geçici doğrulama sunucusu kapatıldı; önceden açık olan 5175 sunucusu korundu.

## Commit öncesi kontrol — 01.11.2026

Kullanıcının commit + push isteği üzerine `npm.cmd run check` tekrar GEÇTİ;
`node --test tests/m0/transport.test.mjs` 6/6 GEÇTİ;
`node --check tools/prepare-m0-landscape.mjs` GEÇTİ. Tamamlanmamış M0 kabul
kutuları açık bırakıldı. Bu kontrolde build veya browser kabulü yeniden yapılmadı.
