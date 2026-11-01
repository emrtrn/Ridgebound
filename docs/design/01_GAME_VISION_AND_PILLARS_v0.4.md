# FORGE OFFROAD — 01 Oyun Vizyonu ve Tasarım Sütunları


**Dosya:** `01_GAME_VISION_AND_PILLARS.md`  
**Sürüm:** v0.4 (Aşama 1 kapanış kararı eşitlemesi)  
**Tarih:** 23 Ekim 2026  
**Ana GDD:** `FORGE_OFFROAD_GDD_PROJE_CERCEVESI_v0.4.md`  
**Durum:** **Aşama 1 tamamlandı.** D-003, D-011, D-015, D-008, D-009, D-010 kesinleşti. Eski v0.3 sürümündeki öneri durumlarını `FORGE_OFFROAD_ASAMA_1_KAPANIS_VE_D010_v1.0.md` güncelledi. Aşama 2 ayrı `02_CORE_GAMEPLAY_LOOP_v0.1.md` dosyasında yürütülüyor.


---


## 1. Karar protokolü


- **[KESİN]** Kullanıcının açık kararı veya güncel doğrulanmış uygulama.
- **[ÖNERİ]** Tasarımcı önerisi, kabul bekliyor.
- **[TEST]** Oynanış veya motor testinden sonra karar verilecek.
- **[AÇIK]** Alternatifler değerlendiriliyor.
- **[KAPSAM DIŞI / MVP]** İlk oynanabilir dilimde yapılmayacak; nihai ürün için tümüyle reddedilmiş değil.


Bu belgede referans oyunların özellikleri otomatik olarak Forge'da mevcut kabul edilmez. Editor statik terrain generation ve runtime araç kaynaklı deformasyon ayrıdır. Gerçekleştirilmiş/planlanan teknik özellikler repo ve kullanıcı test kaydıyla doğrulanır.


## 2. Oyun kimliği, vizyon ve oyuncu fantezisi — [KESİN]

**D-003:** Ana deneyim lojistik ve taşımacılıktır. **D-011:** Dünya izole dağ yerleşimleridir. **D-015:** Oyuncu bağımsız nakliyecidir; iş, hazırlık ve rota seçimlerinde karar sahibidir.

**D-008 — Onaylı vizyon:**

> Forge Offroad, oyuncunun bağımsız bir nakliyeci olarak izole dağ yerleşimlerinin ihtiyaçlarını karşılamak için zorlu arazi koşullarında taşımacılık yaptığı bir arazi lojistiği oyunudur. Oyuncu nakliye işlerini seçer, aracının ve yükünün özelliklerini değerlendirir, güzergâhını planlar ve değişken arazi şartlarıyla mücadele ederek teslimatlarını tamamlamaya çalışır. Başarı yalnızca sürüş becerisine değil; hazırlığa, doğru kararlar almaya ve karşılaşılan sorunlara çözüm geliştirmeye bağlıdır.

**Temel vaat [KESİN]:** Önemli olan yalnızca hedefe ulaşmak değil, yükünü oraya ulaştırabilmektir.

**Oyuncu fantezisi [KESİN]:** Kendi kararlarımla zorlu yolları aşan, yükümü güvenle ulaştıran ve her başarılı teslimatla daha büyük işlerin üstesinden gelebilen bir nakliyeciyim.

Fantezinin boyutları: **özgürlük, ustalık, kazanılmış başarı**.

**Açık:** Ülke, dönem, yerleşim adları, olay örgüsü, anlatı tonu, hedef cihaz/FPS, görsel stil. Bağımsız nakliyeci rolü açık değildir; kesinleşmiştir.

## 3. Onaylı tasarım sütunları — [KESİN; D-009]

1. **Özgürlük ve lojistik planlama:** Oyuncu işi, hazırlığı ve güzergâhı üzerinde anlamlı kararlar verir; aynı teslimatın farklı yöntemleri olabilir.
2. **Araziyle fiziksel mücadele:** Zemin, eğim ve engeller sürüşü değiştirir; çamur sadece bir renk değildir.
3. **Yükün sürüş fiziğine etkisi:** Yük kütle ve ağırlık merkezini, dolayısıyla fren, ivmelenme ve dengeyi etkiler.
4. **Problem çözme ve kurtarılabilir zorluklar:** Saplanma/devrilme rastgele ceza değil, anlaşılabilir ve yaklaşımı değiştirilerek aşılabilir sorunlardır.

**Tasarım filtresi:** İlk sürümdeki her özellik en az bir sütunu güçlendirmelidir. **Tasarım kararı, motorun özelliği uyguladığı anlamına gelmez.**

## 4. Aşama 1'deki tamamlanma kaydı

Aşama 1, 23 Ekim 2026 tarihli `FORGE_OFFROAD_ASAMA_1_KAPANIS_VE_D010_v1.0.md` ile kapatıldı. Bu belgede yer alan vizyon/sütun/kapsam kararları Aşama 2 sırasında sessizce değiştirilmez. Uygulama ve test kabulü ayrıca yapılır.


## 5. Dünya seçiminin tasarıma etkisi


**[KESİN] Ana bağlam:** Oyunun taşımacılık görevleri, izole dağ yerleşimlerinin ulaşım ihtiyaçları çevresinde şekillenir.


**[ÖNERİ]** Dağ deposundan köye nakliye; hafif/ağır kargo; dar geçit ve uzun güvenli alternatif güzergâh; yakıt, gıda ve bakım malzemesi gibi yükler. Bunların hiçbiri henüz görev kanonu, ekonomik sistem veya tamamlanmış teknik özellik değildir.


**[AÇIK]** Ülke ve dönem, köy isimleri, oyun tonu, mevsim ve hava koşulları, hikâye akışı. **[KESİN]** Oyuncunun kimliği bağımsız nakliyecidir.


## 6. Ana oynanış döngüsü — Aşama 2 ayrıntıları açık


1. **İş seç:** Teslim edilecek malzeme, çıkış/varış noktası ve temel koşulları incele.
2. **Hazırlan:** Mevcut aracın kapasitesini ve yükün etkisini değerlendir.
3. **Planla:** Haritada en az iki rotanın avantaj/dezavantajını tart.
4. **Taşı:** Gaz, fren, direksiyon, çekiş ve araziye göre sürüşü yönet.
5. **Uyum sağla:** Batma, kayma veya geçit sorunu oluşursa yöntem değiştir.
6. **Teslim et:** Yük hedefe ulaşır; sonuç kaydedilir.
7. **İlerle:** Ödül/erişim/araç geliştirme seçenekleriyle bir sonraki göreve hazırlan.


**Not:** Ödül türleri, para birimi, yakıt maliyeti, bakım ve oyun sonu koşulları henüz belirlenmedi.


### Bu tasarımdan türeyen temel oyun elementi sınıfları


| Sınıf | MVP için öneri | İleri sürüm olasılıkları |
|---|---|---|
| Araç | 1 nakliye aracı; gerçek kütle ve süspansiyon | Çoklu araç sınıfı, modifikasyon |
| Yük | 2 farklı kütle sınıfı | Hacim, kırılganlık, yük bağlama, hasar |
| Arazi | Sert yol, toprak, çamur | Kaya/kum/kar/nehir/çoklu biyom |
| Çamur | Çekiş/direnç + ölçülebilir deformasyon denemesi | Gelişmiş sıkışma/çok geçişli değişim |
| Görev | Al → götür → teslim et | Çok duraklı, koşullu, kurtarma/ikmal |
| Rota | 2 farklı risk profili | Keşif, kapanan yollar, harita gelişimi |
| Kurtarma | Reset veya mevcutsa temel mekanik | Vinç, destek araçları, servis noktaları |
| Ekonomi | Basit görev tamamlama ödülü | Yakıt, bakım, şirket yönetimi |


## 7. Kapsam sınırları — D-010 [KESİN]

İlk oynanabilir sürüm **M0 + M1 + M2** tamamlandığında elde edilir. Uygulama sırası **M0 → M1 → M2**; her basamağın kabul kapısı ayrıdır.

- **M0:** 1 araç, 1 depo, 1 teslimat noktası, tek nakliye işi; yük al/taşı/teslim/ödül geri bildirimi; hafif/ağır yük profili için veri; görev/yük/tamamlanma save/load; tek seferlik ödül ve temel HUD.
- **M1:** Boş/hafif/ağır araç sürüş farkı, yükten kütle ve ağırlık merkezi etkisi, sert/toprak/çamur yüzeyleri, iki farklı riskli rota, eğim ve sürüş tepkileri.
- **M2:** Temel tekerlek izi, batma/direnç hissi, tekrar geçiş etkisi deneyi, görsel/fizik tutarlılığı ve performans ölçümleri.

**İlk sahaya özgü sınırlar:** 1 küçük test bölgesi, 1 depo, 1 teslimat, 2 yük profili + boş karşılaştırması, 2 rota, 3 yüzey, gerektiğinde reset/yeniden deneme.

**Dışarıda:** Çok araç filosu, vinç/römork sistemi, karmaşık ekonomi, ayrıntılı yakıt/hasar/bakım, çok oyunculu ve geniş kesintisiz dünya gibi ileri özellikler. Dinamik collider deformasyonu ve sürüş izlerinin kalıcı kaydı ilk sürüm için otomatik zorunluluk değildir; T04 açısından açık.

**Daha ayrıntılı ve bağlayıcı kapsam:** `FORGE_OFFROAD_ASAMA_1_KAPANIS_VE_D010_v1.0.md` Bölüm 4. Aşama 2 kararları: `02_CORE_GAMEPLAY_LOOP_v0.1.md`.


## 8. Teknoloji sınırına ilişkin ilkeler


- Forge'un mevcut Three.js tabanlı ve heightfield odaklı teknik geçmişi başlangıç bağlamıdır; bugün çalışan özellikler repo ve testlerle doğrulanır.
- Statik/üretilmiş terrain otoritesi ile runtime deformasyon durumu açıkça ayrılmalıdır. Bu henüz kesin mimari değil, araştırma ilkesi.
- Fizik sonuçları görsel izlerden bağımsız test edilebilir olmalıdır.
- Sabit fizik zaman adımı, tarayıcı performansı, aktif bölge boyutu ve bellek büyümesi ayrı teknik kalite konularıdır.
- Deformasyon ve yük fiziği henüz uygulanmış kabul edilmez; geliştirme/test konusudur.
- Bir özellik çalışsa bile kullanıcı oyun testinden geçmeden 'tamamlandı' sayılmaz.


## 9. İlk tasarım ve teknik hipotezler


| ID | Hipotez | Nasıl sınanacak? | Durum |
|---|---|---|---|
| H-001 | Ağır kargo, boş araçtan belirgin farklı sürüş yaratır | Aynı araç, rota ve koşullarda boş/hafif/ağır karşılaştırması | [TEST] |
| H-002 | Kısa çamurlu rota ile uzun sert rota arasında anlamlı tercih vardır | Farklı yük sınıflarıyla iki rota tekrarı | [TEST] |
| H-003 | Çamur, görselden fazlası olarak ilerleme direncini değiştirir | Aynı gaz ve yükle sert yüzey/çamur karşılaştırması | [TEST] |
| H-004 | Araç yakınındaki deformasyon sınırlı maliyetle çalışır | Aktif bölge, FPS, bellek ve uzun sürüş ölçümü | [TEST] |
| H-005 | Saplanmanın sebebi oyuncuya anlaşılır gelir | Debug gözlemi ve oyuncu geri bildirimi | [TEST] |


### Her ilk testte zorunlu kayıt


`Test ID | build/commit | tarayıcı/cihaz | harita/seed | araç/yük | yüzey koşulu | hipotez | gözlem | fizik/FPS/bellek | karar | sonraki adım`


**Önemli:** Sayısal FPS hedefi, harita büyüklüğü veya gerçekçi araç parametreleri kullanıcı testi ve hedef cihaz kararı alınmadan uydurulmayacaktır.


## 10. Dünya ve hikâye yönü — kesinleşen seçim


**[KESİN] A — İzole dağ yerleşimleri (D-011):** Ana dünya ve lojistik bağlamı olarak seçildi. Yiyecek, yakıt, inşaat malzemesi ve temel ekipmanı zorlu coğrafyadaki yerleşimlere ulaştırma olasılıkları, henüz onaylanmamış görev/içerik önerileridir.


**[SEÇİLMEDİ] B — Afet sonrası ikmal:** Ana dünya olarak seçilmedi. Afet veya altyapı onarımına ilişkin unsurlar, ancak ileride ayrı tasarım kararı alınırsa yan içerik olarak değerlendirilebilir.


**[SEÇİLMEDİ] C — Uzak bölge taşımacılığı:** Ana dünya olarak seçilmedi. Endüstriyel/bilimsel sevkiyat gibi unsurlar, ancak ileride ayrı tasarım kararı alınırsa yan içerik olarak değerlendirilebilir.


**Kararın kapsamı:** Ana dünya seçimi ve bağımsız nakliyeci oyuncu rolü [KESİN] durumundadır; ülke, dönem, yerleşim adları, olay örgüsü ve anlatı tonu hâlâ [AÇIK] durumundadır. Dünya seçiminin kesinleşmesi, yukarıdaki görev örneklerinin veya ayrıntılı hikâyenin onaylandığı anlamına gelmez. Seçilen dünya ana mekaniklere gerekçe sağlamalı fakat onları gizlememelidir.


## 11. Aşama 1 çıkış koşulları — [TAMAMLANDI]

- [x] Ana deneyim: lojistik ve taşımacılık (D-003).
- [x] Dünya: izole dağ yerleşimleri (D-011).
- [x] Oyuncunun rolü: bağımsız nakliyeci (D-015).
- [x] Vizyon, vaat ve oyuncu fantezisi (D-008).
- [x] Dört tasarım sütunu (D-009).
- [x] M0 + M1 + M2 ilk sürüm sınırları (D-010).

**Kesin kapanış kaynağı:** `FORGE_OFFROAD_ASAMA_1_KAPANIS_VE_D010_v1.0.md`. Sıradaki çalışma Aşama 2'dir; GDD v0.4 ve `02_CORE_GAMEPLAY_LOOP_v0.1.md` izlenir.


## 12. Karar kayıtları — güncel

| Tarih | ID | Karar | Durum |
|---|---|---|---|
| 2026-10-23 | D-003 | Ana deneyim: lojistik ve taşımacılık | [KESİN] |
| 2026-10-23 | D-011 | Ana dünya: izole dağ yerleşimleri | [KESİN] |
| 2026-10-23 | D-015 | Bağımsız nakliyeci oyuncu rolü | [KESİN] |
| 2026-10-23 | D-008 | Vizyon, temel vaat, oyuncu fantezisi | [KESİN] |
| 2026-10-23 | D-009 | Dört onaylı oyun tasarım sütunu | [KESİN] |
| 2026-10-23 | D-010 | İlk sürüm B = M0 + M1 + M2 | [KESİN] |

Aşama 2'de onaylanan iş panosu/sözleşme/kamera/özet kararları burada tekrar ayrıntılandırılmaz; `02_CORE_GAMEPLAY_LOOP_v0.1.md` içinde tutulur. Belge bakım kuralı: kullanıcı onayı olmadan öneri kesinleşmez. Teknik doğrulama olmadan bir mekanik uygulanmış sayılmaz.

---

## v0.4 sürüm notu — 23 Ekim 2026

- Aşama 1 kapanış belgesi esas alındı; D-008, D-009, D-010, D-015 kesinleşmiş kararlarıyla çelişen eski açık/öneri etiketleri düzeltildi.
- M0/M1/M2 kapsamı ve onay/teknik doğrulama ayrımı işlendi.
- Aşama 2 ayrıntılarının ayrı karar kaydında izleneceği belirtildi.

---


## v0.3 sürüm notu — 23 Ekim 2026

- D-011 karar tablosunda **A — İzole dağ yerleşimleri** kesinleşmiş dünya seçimi olarak işlendi; B ve C'nin seçilmediği netleştirildi.
- Dünya seçimi bölümündeki eski **[AÇIK]** ifadesi güncellendi; coğrafya ve hikâye ayrıntıları [AÇIK] olarak korundu.
- Aşama 1 kontrol listesindeki dünya seçimi tamamlandı olarak işaretlendi; bekleyen diğer onaylar değiştirilmedi.
- Güncelliğini yitirmiş dünya seçimi sorusu, vizyon/oyuncu rolü/sütunlar ve MVP sınırlarına yönlendirildi; bölüm numaralandırması düzeltildi.

---

## v0.2 sürüm notu — 23 Ekim 2026


- Kullanıcının **A — İzole dağ yerleşimleri** dünya tercihi [KESİN] olarak eklendi.
- Ana GDD bağlantısı v0.3 olarak güncellendi; diğer öneriler henüz kesin kabul edilmedi.
