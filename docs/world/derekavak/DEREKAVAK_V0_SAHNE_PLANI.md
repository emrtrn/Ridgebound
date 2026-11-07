# V0 Derekavak — greybox sahne planı

**Tarih:** 7 Kasım 2026. **Durum:** Onay 1 (sahne planı) verildi; Onay 2 soruları yanıtlandı (7 Kasım), dağ rölyefli greybox son bakışta; sırada Onay 3 (Blender greybox modeller).

Konseptten sahne üretiminin ilk gerçek uygulaması. Sıra: [1] sahne planı → [2] greybox
sahne → [3] Blender greybox modeller, aile başına onay → [4] detay + kaplama. Sahne
kullanıcıya teslim edildikten sonra elle sürdürülür; yeniden üretim hedeflenmez.

## Kaynak

- Koordinatlar: [`RIDGEBOUND_SPATIAL_MASTER_v0.3.json`](RIDGEBOUND_SPATIAL_MASTER_v0.3.json),
  SHA-256 `04bf826f5a11724ee15995c482e45abdc3928564f52b2f91d6361c6db9b2c80a`. Drive'daki
  dosyayla bayt bayt aynı: v0.2 masterdan (`72afa23b…`) Drive'daki
  `RIDGEBOUND_generate_v0_site_v0.3.py` konut katmanı mantığıyla yeniden üretildi.
- Arazi: masterın analitik fonksiyonu (v0.2 üretici, v0.3 betiğindeki `z()`); yükseklik
  resmi yeniden örneklenmez.
- Stil (konum kaynağı değil): Drive `ConceptDesign/Görsel Stil.png`, `Derekavak Aile Evi
  Tasarım Panosu.png`, `99_Style_Only_Archive/*`.
- Plan görseli: [`DEREKAVAK_V0_SAHNE_PLANI.png`](DEREKAVAK_V0_SAHNE_PLANI.png), ölçümler
  [`derekavak_plan_measurements.json`](derekavak_plan_measurements.json), üretici
  `tools/world/derekavak_plan.py`.

## Kapsam

V0 köy alanı, 1010 × 920 m (X 3290–4300, Y 790–1710): H-01 ana dere, R01 ve B1 köprüsü,
R03'ün alan içi kısmı, yerel yollar, POI-01…06, 24 konut + 12 müştemilat (v0.3 aday
katmanı). Kapsam dışı: V1–V4, R02/R04–R06, B2, H-02, cami/minare (sonra karar).

## Kararlar (7 Kasım 2026, kullanıcı)

| Konu | Karar |
|---|---|
| Kapsam | Yalnız V0 köyü |
| Aile evi POI-01 | Tasarım panosu ölçüsü ~12 × 7,5 m (master 16 × 12 değil); parsel 34 × 25 m masterdan |
| Cami/minare | Eklenmez; sonra karar |
| Sahnenin yeri | Ridgebound deposu |
| Yapı zemini | Her yapı kendi düz setinde; set kenarında taş istinat duvarı. Master arazisi korunur |
| POI-06 meydan | Master ölçüsü 95 × 60 m korunur, merdiven/rampa ile bağlı 2–3 sete bölünür |
| Yol eğimi | XY çizgisi masterdaki gibi; boyuna kot hedef eğime göre tasarlanır, yarma/dolgu ve istinat |
| Yönlenme | Uzun kenar eş yükseltiye paralel, ön cephe vadiye bakar |

## Varsayımlar (masterda yok)

- Dere su genişliği ~10 m.
- Yerel yollar 4,5 m; depo/servis kolları 5 m ve hedef eğim %10; diğer yerel yollar %12.
- Ped = ayak izi + 2 m düz alan, kotu zemin ortalaması.
- Yapı yükseklikleri greybox içindir: ev 2 kat, müştemilat 1 kat.

## Plan ölçümleri (ham arazide)

- Köy %12–17 eğimli tek yamaçta; masterda teras yok. 24 evin 23'ünde zemin farkı 2,5 m'den
  fazla (en çok 3,7 m); POI'lerde 2,8–7,3 m; meydanda 17,6 m.
- Hedef eğimi aşan yollar (~900 m): R01 köprü inişi %24 (hedef %10), R03 %14 (%12),
  Konut terası %16 (%12), İşletme kolu %16 (%10).

## Greybox sahne (Onay 2 bekliyor)

`node tools/world/build-derekavak.mjs` (Forge kaynağını canlı kullanır; `--force` yeniden
kurar ve editör değişikliklerini siler). Çıktı `public/assets/Maps/Derekavak.level.json`
(+ `.landscapes/`, `.foliage.json`), manifestte `derekavak-level`. Rapor:
[`derekavak_build_report.json`](derekavak_build_report.json). Görüntüler:
`greybox-01-genel.png`, `greybox-02-merkez.png`, `greybox-03-oyun.png`, `greybox-04-kopru.png`.

- Arazi: 2048 × 2048 m, 1 m aralık, 8 × 8 tile (256 m); masterın analitik arazisi + H-01'e ~10 m yatak
  + köyün dışında dağ rölyefi (aşağıda).
- Yollar: master XY; boyuna kot hedef eğimle tasarlandı, sıra R01 → R03 → yerel yollar
  (kesişim kotunu ilk geçen yol belirler). Yedi yolun hepsi hedefte: R01 %10 (yarma 3,3 m,
  dolgu 4,5 m), R03 %12 (yarma 5,5 m), Konut terası %12 (yarma 6,2 m), İşletme kolu %10
  (yarma 7,6 m), diğerleri hedefin altında.
- Masterda açık uçlu iki yol en yakın yola bağlandı (masterda yok, Onay 2'de kabul edildi): Konut terası
  güney ucu → R01 (33 m), Merkez erişimi başı → İşletme kolu (10 m).
- B1: güverte Z ≈ 215,3 m (dere tabanı + 5,5), ~42 m, iki ayak; köprü altı kazılmaz.
- Yapılar: 5 POI + 24 ev + 12 müştemilat kutu, eş yükseltiye paralel, önü vadiye. POI seti
  parselin tamamı (avlu), ev/müştemilat seti ayak izi + 2 m; 0,8 m'yi aşan kazı/dolguda taş
  istinat kutusu (61 duvar). Meydan üç set (257,6 / 254,4 / 251,3 m).
- Örtü: köy içi çayır (parsel kenarından 45 m, yoldan 20 m açıklık), ötesi iğne yapraklı
  orman (pilot foliage tipleri, Forge'dan kopyalandı), dik yamaç kaya, dere yatağı çamur.
- Depo avlusunda Gaz-52 ve oyuncu başlangıcı; `gameMode: forge.vehicle`.

## Onay 2 kararları (7 Kasım 2026, kullanıcı)

| Konu | Karar |
|---|---|
| Dağ havası | Köy, yollar ve dere korunarak çevreye dağ rölyefi eklenir |
| Masterda olmayan iki yol bağlantısı | İkisi de kalır |
| Yapı boyları | Ev 6,5 m, aile evi 7,5 m, depo 8 m, kahvehane 4,5 m; Blender modelleri bu boylarla |
| `npm run check` tip hatası | Düzeltildi (`transportPersistence.ts` eksik `destructibles`/`deformables` alanlarını boş verir) |

## Dağ rölyefi

Masterın arazisi tek düzgün yamaçtı; konseptteki dik dağ havası için köyün dışına sırtlar
eklendi. Sırt odaklı çok katmanlı gürültü (Perlin): keskin sırtlar, yumuşak dereler; omuzlar
vadiye doğru doğu-batı uzanır. Parametreler üreticideki `RELIEF` sabitinde.

- Korunan alanlar: yapı setleri (45 m içinde sıfır, 320 m'de tam; kenar tek pürüzsüz çizgi),
  yollar (18 m / 220 m) ve dere (22 m / 260 m). Üretici, rölyef bir sete ya da yola
  değerse uyarı verir; bu kurulumda uyarı yok.
- Zirve ~733 m (köy ~250 m). 30°'den dik yamaçlar kaya boyası alır, orman oradan çekilir.
- Forge'un `macroRelief.ts` çekirdeği denendi; bu ölçekte bloklu kabarcıklar ürettiği için
  kullanılmadı.
- Görüntüler: `greybox-05-dag.png` (güneybatıdan köy ve dağlar), `greybox-06-vadi.png`
  (dereden kuzeye), `greybox-07-koyden.png` (köyden doğuya); 01–04 yeni araziyle yeniden alındı.
- Sis ve ışık ayarına girilmedi (kullanıcının işi).

## Onay 3: Blender greybox modeller (örnekler, onay bekliyor)

Üretici: `tools/world/derekavak_greybox.py` (Blender 5.2,
`blender --background --factory-startup --python tools/world/derekavak_greybox.py [-- house|depot]`).
Model düz renkli; biçim, ölçü ve oran içindir. Kaplama Onay 4'te. Orijin ayak izinin ortası,
zemin 0, ön cephe -Y (Forge'da +Z, vadiye bakan yüz). Her modelin önizlemesi
`model-<ad>.png`, ölçek için 1,8 m figür (depoda Gaz-52 boyunda kutu).

| Aile | Dosya | Ölçü | Biçim |
|---|---|---|---|
| Köy evi (24 konut) | `public/assets/derekavak/structures/dk-house.glb` | ayak izi 12 × 9 m, mahya 6,5 m (baca 7,55) | taş zemin kat 2,3 m, sıvalı üst kat 2,3 m, ön cephede 1,5 m derin ahşap balkon, ~15° dört yana kırma kiremit çatı (önde 1,9 m saçak), taş baca |
| Depo (POI-02) | `public/assets/derekavak/structures/dk-depot.glb` | ayak izi 34 × 18 m, mahya 8 m | 1,2 m taş kaide, ahşap kaplama, oluklu sac beşik çatı, önde üç araç kapısı (4,5 × 4,5 m) ve sürgülü kanatlar, 6 m beton önlük, sağ uçta 7 m sundurma |

Not: 6,5 m mahya iki katı ancak ~15° çatıyla taşıyor; konseptteki çatı biraz daha dik.
Masterda konutların bir kısmı 13 × 10 m; o ölçü için aynı model ölçeklenir ya da ikinci
varyant yapılır. Modeller onaydan sonra sahnedeki kutuların yerine konacak.
