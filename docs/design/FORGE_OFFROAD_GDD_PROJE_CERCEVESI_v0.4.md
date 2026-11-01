# FORGE OFFROAD — Oyun Tasarımı ve Geliştirme Çerçevesi


**Belge sürümü:** v0.4 (Aşama 1 kapanışı + Aşama 2 karar senkronizasyonu)  
**Tarih:** 23 Ekim 2026  
**Proje adı:** Geçici — *Forge Offroad* (nihai oyun adı henüz seçilmedi)  
**Platform:** Forge editörü ve web tabanlı oyun çalışma zamanı  
**Belgenin rolü:** Oyun tasarımı ana indeksi, kapsam kontrolü, karar ve test yönetimi  
**Durum:** Yaşayan GDD. **Aşama 1 tasarım kararları tamamlandı; Aşama 2 sürüyor.** Kesin kararlar aşağıda ve Aşama 1 kapanış belgesinde kayıtlıdır; Aşama 2 alt başlıkları yalnız açık onayla kesinleştirilir.  
**Aşama 1 vizyon dosyası:** `01_GAME_VISION_AND_PILLARS_v0.4.md`  
**Aşama 1 kesin kapanış kaydı:** `FORGE_OFFROAD_ASAMA_1_KAPANIS_VE_D010_v1.0.md`  
**Aşama 2 karar kaydı:** `02_CORE_GAMEPLAY_LOOP_v0.1.md`


---


## GÜNCEL KESİN KARAR ÖZETİ — 23 Ekim 2026

**Aşama 1 tamamlandı.** En son Aşama 1 kapanış kaydı, bu belgenin v0.3 sürümündeki eski `[ÖNERİ]` ifadelerinden üstündür. Kararlar geriye dönük olarak değiştirilmedi; yeni onaylar işlendi.

| ID | Onaylanan karar | Durum |
|---|---|---|
| D-003 | Ana deneyim: lojistik ve taşımacılık | [KESİN] |
| D-011 | Dünya: izole dağ yerleşimleri | [KESİN] |
| D-015 | Oyuncu rolü: bağımsız nakliyeci; iş, hazırlık ve güzergâhta karar sahibi | [KESİN] |
| D-008 | Onaylı ana vizyon, temel vaat ve oyuncu fantezisi | [KESİN] |
| D-009 | Planlama özgürlüğü, fiziksel arazi mücadelesi, yükün sürüş fiziğine etkisi, kurtarılabilir sorunlar | [KESİN] |
| D-010 | İlk oynanabilir sürüm B yaklaşımı: M0 + M1 + M2; geliştirme ve kabul sırası M0 → M1 → M2 | [KESİN] |

> **Temel vaat [KESİN]:** Önemli olan yalnızca hedefe ulaşmak değil, yükünü oraya ulaştırabilmektir.

**Aşama 2'de ayrıca onaylananlar:** Depodaki fiziksel iş panosu ve açılan iş ekranı; ayrıntılı nakliye sözleşmesi; kısa iş özeti + aynı ekranda açılıp kapanan ayrıntı bölümleri; lojistik odaklı özet; yük adının özette doğrudan gösterilmesi. Hibrit araç/depo kamerası ve A2-CAM-01–04 kararları da geçerlidir. Ayrıntılar `02_CORE_GAMEPLAY_LOOP_v0.1.md` içindedir.

**Henüz açık:** Coğrafya, dönem, yerleşim isimleri ve anlatı; iş özetindeki diğer alanlar; yük ağırlığının gösterimi; kabul/iptal koşulları; rota bilgisinin sınırı; ödül türü; detaylı kamera kontrolleri ve teknik uygulama yöntemi. Tasarım onayı, Forge özelliğinin uygulandığı anlamına gelmez.

---


## 0. Kullanım ilkeleri


Bu belge tek seferde doldurulacak bir şartname değildir. Oyun vizyonunu, uygulamanın gerçekten desteklediği teknik sınırları ve her yeni testin ortaya çıkardığı kararları birlikte taşıyan yaşayan bir GDD'dir.


**Karar durumları**
- **[DOĞRULANDI]:** Kullanıcının açık ifadesi veya güncel çalışma/test kaydıyla desteklenmiş bilgi.
- **[ÖNERİ]:** Üzerinde konuşulacak tasarım tercihi; henüz kabul edilmiş sayılmaz.
- **[TEST GEREKİYOR]:** Teknik uygunluğu veya oynanış etkisi ölçülmesi gereken konu.
- **[AÇIK]:** Henüz karar verilmedi.
- **[ERTELENDİ]:** İlk oynanabilir hedefe dahil olmayan özellik.


Her aşamada önce karar, sonra küçük bir prototip/test, ardından kabul veya revizyon süreci izlenir. Temel belgenin yanında zaman içinde ayrı GDD, teknik mimari (TDD) ve test kayıtları açılabilir.


## 1. Bugün bildiklerimiz


| Alan | Bilgi | Durum |
|---|---|---|
| Geliştirme ortamı | Forge adlı web tabanlı editör/oyun motoru kullanılacak | [DOĞRULANDI] |
| Teknik çalışma | Açık dünya arazi özellikleri üzerinde geliştirme ve test yapılıyor | [DOĞRULANDI] |
| Fizik çalışması | Arazi deformasyonu için geliştirme ve test yapılıyor | [DOĞRULANDI] |
| Referans oyun türü | MudRunner / SnowRunner / Expeditions benzeri arazi sürüş deneyimi inceleniyor | [DOĞRULANDI] |
| Hedef oyuncu deneyimi | **Lojistik ve taşımacılık ana deneyim**; keşif/kurtarma sürüşü destekleyebilir | [DOĞRULANDI] |
| Tek oyunculu/çok oyunculu | Belirlenecek | [AÇIK] |
| Hedef tarayıcı ve cihazlar | Belirlenecek | [AÇIK] |
| Grafik stili | Belirlenecek | [AÇIK] |
| Açık dünya boyutu | Oyun vizyonu ve teknik testlere göre belirlenecek | [AÇIK] |
| Dünya / hikâye zemini | **A — İzole dağ yerleşimleri**, nakliye gerekçesi olarak seçildi | **[DOĞRULANDI]** |
| Somut coğrafya, dönem ve hikâye | Ülke/bölge, dönem, yerleşim adları ve olay örgüsü henüz belirlenmedi; **oyuncunun rolü bağımsız nakliyeci** | [AÇIK] / rol [KESİN] |
| Oyuncunun rolü | Bağımsız nakliyeci | [KESİN; D-015] |


### Önceki Forge dokümanlarından devralınacak teknik bağlam


Daha önceki Forge araştırma belgelerinde Three.js mimarisi, heightfield yaklaşımı, `Float32Array` verisi, editör/runtime ayrımı, chunk yenileme ve veri odaklı proje yaklaşımı bulunuyor. Procedural heightmap planında arazi üretiminin editör sırasında yapılması; çalışma zamanında sürekli arazi yeniden üretiminin ayrı konu olması öngörülmüştü.


**Önemli:** Bunlar önceki dokümanlarda yer alan açıklama/planlardır. Güncel repository ve çalışan prototip incelenmedikçe bugün eksiksiz uygulandıkları kabul edilemez.


**Teknik sınır:** *Editör yüksekliği/oluşturulmuş statik arazi* ile *oyun sırasında lastiğin meydana getirdiği dinamik deformasyon* aynı veri ve güncelleme yoluna zorlanmamalı. Bu ayrım tasarım kararıdır; nihai uygulama yöntemi testlere bağlıdır.


## 2. Vizyon ve tasarım sütunları — Aşama 1 [TAMAMLANDI]

### Onaylanan vizyon [KESİN; D-008]

> Forge Offroad, oyuncunun bağımsız bir nakliyeci olarak izole dağ yerleşimlerinin ihtiyaçlarını karşılamak için zorlu arazi koşullarında taşımacılık yaptığı bir arazi lojistiği oyunudur. Oyuncu nakliye işlerini seçer, aracının ve yükünün özelliklerini değerlendirir, güzergâhını planlar ve değişken arazi şartlarıyla mücadele ederek teslimatlarını tamamlamaya çalışır. Başarı yalnızca sürüş becerisine değil; hazırlığa, doğru kararlar almaya ve karşılaşılan sorunlara çözüm geliştirmeye bağlıdır.

**Temel vaat [KESİN]:** Önemli olan yalnızca hedefe ulaşmak değil, yükünü oraya ulaştırabilmektir.

**Oyuncu fantezisi [KESİN]:** Kendi kararlarımla zorlu yolları aşan, yükümü güvenle ulaştıran ve her başarılı teslimatla daha büyük işlerin üstesinden gelebilen bir nakliyeciyim.

### Dört sütun [KESİN; D-009]

1. **Özgürlük ve lojistik planlama:** İş, hazırlık ve güzergâh seçimlerinde sonuçları farklı anlamlı alternatifler.
2. **Araziyle fiziksel mücadele:** Zemin, eğim ve engeller araç davranışını etkiler; çamur yalnızca görsel renkten ibaret değildir.
3. **Yükün sürüş fiziğine etkisi:** Kütle ve ağırlık merkezi, frenleme, ivmelenme, denge ve güzergâh seçimini değiştirir.
4. **Problem çözme ve kurtarılabilir zorluklar:** Anlaşılabilir saplanma/devrilme/yokuş sorunları için yaklaşım değiştirme veya yeniden deneme imkânı.

**Kapsam filtresi:** İlk sürüme alınan özellik en az bir onaylı sütunu güçlendirmeli. Ayrıntılı açıklama ve kaynak: `FORGE_OFFROAD_ASAMA_1_KAPANIS_VE_D010_v1.0.md`.


## 3. Çekirdek oynanış döngüsü — lojistik taslak


`Nakliye işi al → yükü ve aracı değerlendir/hazırla → güzergâh seç → sür / uyum sağla / gerekiyorsa kurtul → yükü teslim et → ödül ve yeni imkân kazan → yeni işe hazırlan`


Bu akışın ayrıntılı görev ve ekonomi kuralları Aşama 2'de karara bağlanacaktır.


### İlk oynanış kanıtı [ÖNERİ]


Bir nakliye aracı, başlangıç noktasından yük alıp kısa fakat çamurlu bir yol ile uzun fakat sert zeminli bir yol arasından birini seçerek teslimat yapar. Aynı görev boş, hafif yüklü ve ağır yüklü koşullarda sınanır. Tasarım hipotezi: farklı yük ve zemin koşulları, oyuncunun güzergâh ve sürüş kararını değiştirecek kadar anlamlı hissettirmelidir.


İlk testte ayrıntılı hasar, yük düşmesi, karmaşık ekonomi ve çok sayıda araç bulunması şart değildir. Bir mekanik testte kaydedilen başarı, ürün özelliğinin tamamlandığı anlamına gelmez.


## 4. Oyun elementleri ve öncelikler


| Sistem | Örnek alt bileşenler | Başlangıç durumu |
|---|---|---|
| Araç | Kütle, ağırlık merkezi, gaz, fren, direksiyon, tork, aktarma, süspansiyon | Temel test için gerekli [ÖNERİ] |
| **Yük ve taşımacılık** | Yük alma/teslim, kapasite, ek kütle ve ağırlık merkezinin sürüşe etkisi | **M0 ve M1 gereği [KESİN; D-010], uygulama/test henüz eksik** |
| Lastik | Zemin teması, normal kuvvet, tutuş, kayma, batma, yuvarlanma direnci | Temel test için gerekli [ÖNERİ] |
| Arazi | Heightfield, eğim, kaya, sert zemin, toprak, çamur | Mevcut geliştirmeyle bağlanacak [TEST GEREKİYOR] |
| Deformasyon | Lastik izi, batma, sıkışma, fizik–görsel tutarlılığı | Öncelikli Ar-Ge konusu [DOĞRULANDI] |
| Kurtarma | Vinç, çeki noktası, geri kazanım | İkinci kademe [ÖNERİ] |
| Navigasyon | Mini harita/harita, rota, işaretleyici | Oyun döngüsü kararından sonra [AÇIK] |
| Araç yönetimi | AWD/4WD, diferansiyel kilidi, vites, lastik basıncı | Kademeli [ÖNERİ] |
| Kaynak/hasar | Yakıt, bakım, motor ve lastik hasarı | Oyun vizyonundan sonra [AÇIK] |
| Dünya koşulları | Su, hava durumu, gün-gece, akıntı | İleri aşama [ERTELENDİ] |
| Görev ve ilerleme | **Nakliye işleri** ana içerik; keşif/kurtarma ikincil; ödül ve yükseltme ayrı tasarlanacak | Ana yön [DOĞRULANDI], ayrıntılar [AÇIK] |
| Trafik ve çok oyunculu | Diğer sürücüler, senkronizasyon | İlk prototipin dışında [ÖNERİ] |


### Şimdilik kapsam dışı tutma önerisi


**[KESİN; D-010 kapsam sınırı]** İlk oynanabilir dilimde çoklu araç filosu, geniş kesintisiz dünya, karmaşık ekonomi, çok oyunculu, gelişmiş trafik yapay zekâsı, ağır su simülasyonu, gerçekçi yük bağlama/düşürme ve uzun sinematik hikâye kapsam dışıdır. Nihai oyunda tümüyle yasaklanmış değildir.


## 5. Arazi ve sürüş teknolojisi mimarisi — çalışma hipotezi


```
[Forge Editor]
  Authored / Procedural Heightfield + Material/Soil Zones
                      |
                      v
[Runtime: Base Terrain + Collision]
                      |
   [Tire Ground Contact / Normal Load / Slip]
                      |
   [Soil Response: Grip, Sink, Resistance, Compaction]
                      |
   [Vehicle Forces + Suspension + Chassis Motion]
                      |
    [Dynamic Deformation Overlay / Wheel Ruts]
                      |
   [Visual Surface + Collision/Physics Consistency]
```


**Bu şema uygulanmış mimari değil; araştırma/uygulama ayrımı için öneridir.**


### Kritik teknik sorular


- Zemin fiziğinin otoritesi nedir: base heightfield, materyal bilgisi, dinamik deformasyon alanı veya hibrit model?
- Çamur batması fiziksel mi, yalnızca görsel mi? İkisi nasıl senkron tutulacak?
- Simülasyon yalnız araç yakınında mı çalışacak? Uzakta oluşan izler korunacak mı?
- Deformasyon kalıcılığı görev süresi boyunca mı, oturum boyunca mı, kayıt dosyasında mı olacak?
- Birden çok teker aynı izden geçtiğinde zemin daha fazla mı sıkışacak, yoksa tutuş mu artacak?
- Çarpışma/zemin teması arazi görsellemesindeki değişimi hangi doğrulukta izleyecek?
- Frame rate değişiminde sonuçlar tutarlı mı? Fizik zaman adımı ve iş parçacığı bütçesi nasıl yönetilecek?
- Konsolda değil, tarayıcıda çalışan bir proje için bellek ve GPU bütçesi ne olmalı?


### Teknik kabul göstergeleri — ilk öneriler


- Aynı test senaryosunda lastik ve zemin davranışı tekrarlanabilir, açıklanabilir.
- Sert zemin ve çamur farklı hissedilir; fark yalnızca renkten kaynaklanmaz.
- Görsel lastik izi ile fiziksel sonuç arasında belirgin kopukluk yoktur.
- Uzun sürüşte bellek tüketimi sınırsız büyümez.
- FPS, fizik adım süresi ve aktif deformasyon bölgesi debug çıktısında ölçülebilir.
- Hedef cihaz ve FPS değerleri kullanıcı kararı ve ölçüm sonrası belirlenir; varsayılmaz.


## 6. Hikâye ve dünya — seçilen dünya: izole dağ yerleşimleri


**[DOĞRULANDI]** Ana dünya seçimi kesinleşti: **A — İzole dağ yerleşimleri**. Dağ köyleri ve erişimi zor yerleşimlere nakliye yapma çerçevesi seçilmiş olmakla birlikte evrenin ülke/coğrafyası, dönemi, anlatı tonu ve ana olay örgüsü henüz kararlaştırılmamıştır.


**Seçilmeyen alternatifler:** B — Afet sonrası lojistik ve C — Uzak bölge taşımacılığı, ana dünya çerçevesi olarak seçilmedi. Bu seçeneklerin bazı unsurları ancak sonradan verilmiş açık tasarım kararlarıyla oyuna eklenebilir.


**[DOĞRULANDI]** Kullanıcı **A — İzole dağ yerleşimleri** seçeneğini ana dünya olarak seçti. B ve C, şu an ana seçenek olarak seçilmiş değildir; ileride ancak ayrı bir tasarım kararıyla yan görev veya bölge esin kaynağı olabilir.


### 6.1 Dünya önermesi — [ÖNERİ]


Dağlarla ayrılmış küçük yerleşimlerin gündelik yaşamı, dışarıdan gelen teslimatlara bağlıdır. Dar geçitler, bozulmuş patikalar ve farklı zemin koşulları nakliyeyi zorlaştırır. Oyuncunun işi, ihtiyaç duyulan yükleri zamanında ve güvenli biçimde ulaştırabilmektir. Bu önerme ana dünyanın seçiminden türetilmiştir; **hikâye kanonu olarak henüz onaylı değildir**.


### 6.2 Oyun mekaniğine doğal etkileri — [ÖNERİ]


| Dünya unsuru | Oynanış olasılığı | Henüz karar verilmemiş sınır |
|---|---|---|
| Dağ köyleri ve izole tesisler | İkmal ve teslimat noktaları | Sayı, isim, konum, yerleşim ölçeği |
| Geçitler, yamaçlar, dar yollar | Rota karşılaştırması ve sürüş becerisi | Uçurum/çığ/heyelan gibi sistemlerin uygulanması |
| Çamur, gevşek zemin, sert kaya | Farklı tutuş ve ilerleme direnci | Fizik modelinin uygulanma seviyesi |
| Gıda, yakıt, inşaat/onarım malzemesi | Görev çeşitleri için aday yükler | Hangi yük sınıflarının ilk sürüme gireceği |
| Uzak köylerin ihtiyaçları | Teslimatların hikâyesel gerekçesi | Ekonomi, zaman baskısı, nüfus ve ihtiyaç simülasyonu |
| Yeni bağlantı yolları | Keşif, alternatif rota ve olası ilerleme | Yol inşası veya dinamik dünya değişimi henüz onaylı değil |


### 6.3 Anlatı ilkeleri — [ÖNERİ]


- Hikâye, esas olarak **taşınan yükün kime ve neden gerekli olduğu** üzerinden hissedilebilir.
- İlk prototipin hikâye anlatımı için uzun sinematik sahnelere ihtiyacı yoktur.
- Gerçekçi ve sakin bir ton, araziyle mücadeleyi öne çıkarabilir; ton kararı henüz açık.
- Belirli bir ülke, tarih, doğal afet, gizem, karakter veya büyük olay örgüsü **uydurulmuş kanon** olarak eklenmeyecektir.


### 6.4 İlk test bölgesi için bağlamsal örnek — [ÖNERİ]


Bir **dağ lojistik deposundan** bir **yüksek rakımlı yerleşime** tek teslimat: kısa ama yumuşak/çamurlu geçit ve uzun fakat sert zeminli yol. Oyuncu hafif/ağır yük seçeneklerinde fiziksel sürüş farkını deneyimler. Bu, ana dünya kararını büyük bir harita gerektirmeden prototipe bağlar. Yer adları ve kilometreler şimdilik belirlenmez.


## 7. Doğru üretim sırası ve çıkış kapıları


| Aşama | Hedef | Çıkış koşulu |
|---|---|---|
| **0. Teknik envanter** | Mevcut Forge sistem ve testlerini fotoğraflamak | “Çalışıyor / kısmen / plan / sorunlu” matrisi tamam |
| **1. Vizyon** | **Tamamlandı:** D-003, D-011, D-015, D-008, D-009, D-010 | `FORGE_OFFROAD_ASAMA_1_KAPANIS_VE_D010_v1.0.md` kesin kapanış kaydı |
| **2. Çekirdek döngü** | Tekrar eden 5–10 dakikalık oyun deneyimi | Örnek oyun oturumu adım adım anlatılabiliyor |
| **3. Mekanik kapsamı** | P0/P1/P2, içerik sınırları ve bağımlılıklar | İlk dilim için sınırlı özellik listesi net |
| **4. Fizik doğrulama** | Tek araç + farklı zemin + deformasyon | Karşılaştırmalı test ve performans verisi mevcut |
| **5. Dünya/hikâye** | Mekanikleri destekleyen çevre, motivasyon ve görevler | İlk bölge, oyuncu rolü ve 2–3 görev türü belirli |
| **6. Sunum/ilerleme** | Kontroller, UX, ses, görsel stil, ödüller | Oyuncu sorunu ve ilerlemeyi anlayabiliyor |
| **7. Vertical slice** | Kısa fakat tamamlanmış oynanış kesiti | Tasarım ve teknik kabul kriterleri test edilmiş |


**Süre tahmini yapılmadı.** Her aşama tamamlanmış sayılmadan bir sonrakinin kapsamı büyütülmez; mevcut teknik geliştirme testleri paralel ilerleyebilir.


## 8. İlk oynanabilir sürüm kapsamı — D-010 [KESİN]

**Seçim:** B yaklaşımı; **M0 + M1 + M2 birlikte ilk oynanabilir sürümü oluşturur**. Geliştirme/kabul sıra düzeni M0 → M1 → M2'dir. Ara basamakların tamamlanması tüm ilk sürümün bitmesi anlamına gelmez.

- **M0 — Nakliye ve görev:** Bir araç, başlangıç deposu ve teslimat noktası; tek nakliye işinin yük alma → taşıma → teslim etme → tamamlanma/ödül geri bildirimi döngüsü. En az hafif/ağır yük veri profilleri, aktif iş/yük/tamamlanma için save/load; ödül yalnız bir kez uygulanır. Görev/yük/durum HUD'u.
- **M1 — Yük, yüzey, rota farkı:** Aynı araç için boş/hafif/ağır koşulları; sürüşe bağlanan ek kütle/ağırlık merkezi; sert zemin/toprak/çamur; kısa-riskli ve uzun-daha güvenli iki rota; fiziksel, tekrarlanabilir çekiş/direnç ve eğim farkları.
- **M2 — Temel deformasyon/batma:** Tekerlek izi algısı ve görsel iz; yumuşak zeminde sürüşe etki eden batma/direnç hissi; tekrar geçiş prototipi; görsel/fizik tutarlılığı; FPS/fizik/bellek/iz alanı ölçümü.

**İlk test sahası:** 1 araç, 1 küçük bölge, 1 depo, 1 teslimat noktası, 2 yük profili (+ boş karşılaştırması), 2 rota, 3 yüzey; vinç yoksa güvenilir reset/yeniden deneme; görev-yük-yön/hız-teslimat geri bildirimi ve teknik debug.

**Kesin olmayan teknik ayrıntı:** Kalıcı tekerlek izi save/load, dinamik collider yeniden şekillendirme, nihai kilometrelik dünya ve ürün performans hedefi henüz zorunlu MVP özelliği veya tamamlanmış teknik sonuç değildir. Uygulama kabulü ve T01–T05 testleri ayrıca yapılır.

**Kaynak ve tam kabul kapıları:** `FORGE_OFFROAD_ASAMA_1_KAPANIS_VE_D010_v1.0.md`, Bölüm 4–5.


## 9. Her test için kayıt şablonu


```markdown
### TEST-000 — Kısa başlık
- Tarih / build / commit:
- Tarayıcı ve test cihazı:
- Test haritası / seed:
- Araç ve konfigürasyon:
- Zemin tipi ve parametreler:
- Hipotez (ne olmalı?):
- Test adımları:
- Gözlenen sonuç (ne oldu?):
- FPS / frame süresi / bellek / fizik step:
- Sorunlar / ekran görüntüsü / video:
- Karar: [KABUL] [REVİZYON] [ASKIYA AL]
- Sonraki test:
```


Önerilen ilk test matrisi: sabit hızla sert zemin, aynı koşullarda kuru toprak, aynı koşullarda çamur; aynı testin farklı araç yüküyle tekrarı; tekrarlı tekerlek geçişi; düşük FPS senaryosu; save/reload gerekiyorsa deformasyon devamlılığı.


## 10. Karar defteri — güncel

| ID | Konu | Karar | Durum |
|---|---|---|---|
| D-001 | Platform | Forge web editörü/motoru | [DOĞRULANDI] |
| D-002 | Teknik odak | Arazi/açık dünya/deformasyon çalışmaları sürüyor | [DOĞRULANDI] |
| D-003 | Ana oyun deneyimi | Lojistik ve taşımacılık | [KESİN] |
| D-008 | Vizyon/oyuncu fantezisi | Aşama 1 kapanış belgesindeki onaylı metin | [KESİN] |
| D-009 | Dört tasarım sütunu | Planlama özgürlüğü, arazi, yük fiziği, kurtarılabilir zorluklar | [KESİN] |
| D-010 | İlk oynanabilir kapsam | B yaklaşımı = M0 + M1 + M2, sırayla ayrı kabul | [KESİN] |
| D-011 | Dünya | İzole dağ yerleşimleri | [KESİN] |
| D-015 | Oyuncunun rolü | Bağımsız nakliyeci | [KESİN] |
| D-007 | Hedef donanım/FPS | Test ve dağıtım hedefinden sonra belirlenecek | [AÇIK] |
| D-013 | Ülke/dönem/yerleşim/hikâye | Ayrıntılar henüz belirlenmedi | [AÇIK] |
| A2-01 | İş kabul kanalı | Depodaki fiziksel iş panosu ve açılan iş ekranı | [KESİN] |
| A2-01-SÖZ | Sözleşme sunumu | Ayrıntılı sözleşme; kısa lojistik odaklı özet + aynı ekranda açılıp kapanan ayrıntı bölümleri | [KESİN] |
| A2-01-F01 | Yük adı | Yük adı iş özetinde doğrudan gösterilir | [KESİN] |
| A2-CAM-01 | Hibrit kamera | Sürüş kamerası + depoda 3/4 yönetim kamerası; ilk kapsamda FPS karakter yok | [KESİN] |
| A2-CAM-02 | Depo moduna giriş | Depodaki fiziksel etkileşim noktası | [KESİN] |
| A2-CAM-03 | Depo kamera kontrolü | Kontrollü 3/4; sınırlı döndürme/yakınlaştırma/kaydırma; serbest RTS değil | [KESİN] |
| A2-CAM-04 | Kamera odağı | Depo merkezini referans alır; nesne seçimi otomatik odağı değiştirmez | [KESİN] |

Eski D-004/D-006/D-012/D-014 önerileri ve henüz kararlaştırılmamış iş/ödül/rota ayrıntıları bağımsız kesin karar olarak devralınmaz; D-010 ile çakışan ilk kapsam başlıklarında D-010 geçerlidir. Ayrıntılı Aşama 2 kararları ve açık sorular `02_CORE_GAMEPLAY_LOOP_v0.1.md` içindedir.

## 11. Sıradaki tasarım kararı

**Aşama 2 — Çekirdek oynanış döngüsü sürüyor.** A2-01 iş panosu/sözleşme sunumu ve A2-CAM-01–04 alt kararları onaylandı. Sıradaki karar **A2-01-F02: Yük ağırlığının iş özetinde nasıl gösterileceği**. Ardından kalan iş verileri, iş kabul/iptal, yük hazırlama, rota planlama, sürüş, teslimat, ödül ve 5–10 dakikalık örnek oturum kararlaştırılacak.

**Kural:** Aşama 2 henüz tamamlanmadı. Onaysız alanlar `[AÇIK]`, teknik uygunluğu doğrulanmayan konular `[TEST GEREKİYOR]` kalır. `FORGE-INT-01` henüz açılmış veya uygulanmış görev değildir.


## Kaynak/proje bağlantıları


- `PROCEDURAL_HEIGHTMAP_RESEARCH_AND_PLAN.md` — Forge terrain üretimi için eski araştırma/uygulama planı; güncel gerçekleşme durumu repo/test ile teyit edilmeli.
- `GPT_PROJE_BAGLAM_DOKUMANI.md` — önceki Forge tabanlı oyun projesinin editör/runtime ve veri odaklı mimari yaklaşımı; yeni proje için birebir uygulama varsayılmamalı.
- Mevcut görüşme — MudRunner, SnowRunner, Expeditions, RoadCraft mekanik ve fizik sistemi analizi.
- `FORGE_OFFROAD_ASAMA_1_KAPANIS_VE_D010_v1.0.md` — Aşama 1 için onaylanmış kesin kaynak.
- `02_CORE_GAMEPLAY_LOOP_v0.1.md` — Aşama 2 onayları ve açık karar listesi.
- `FORGE_OFFROAD_FORGE_TEKNIK_DURUM_RAPORU_2026-10-23.md` — motorun doğrulanmış teknik sınırları.


## v0.4 Değişiklik özeti — 23 Ekim 2026

- Aşama 1 kapanış belgesi esas alınarak D-008/D-009/D-010/D-015 kesin durumuna geçirildi; eski metinlerdeki çelişkiler düzeltildi.
- M0/M1/M2 kabul kapsamı ve teknik gerçekleşme ayrımı işlendi.
- A2-01 iş panosu/sözleşme sunumu/A2-01-F01 ile A2-CAM-01–04 kesin kararları işlendi; açık alanlar korunuyor.
- Ayrı Aşama 2 karar kaydına bağlantı eklendi.

## v0.3 Değişiklik özeti — 23 Ekim 2026


- Kullanıcının **A — İzole dağ yerleşimleri** tercihi kesinleşmiş karar D-011 olarak işlendi.
- Önceki sürümde açık olan hikâye/dünya seçimi, ana GDD'nin başında ve vizyon/karar tablolarında güncellendi.
- Oyunun lojistik amacı, olası yük ve rota örnekleriyle ilişkilendirildi; **bunların henüz öneri olduğu** açıkça korundu.
- İlk oynanabilir bölge önerisi dağ deposundan izole yerleşime yapılacak teslimat olarak örneklendi.
- Ülke, dönem, yerleşim adları, oyuncu kimliği, hikâye tonu ve teknik yeteneklerin güncel uygulama durumları hâlâ açık olarak bırakıldı.
- Yeni ChatGPT projesine eklenmesi için üstte bağımsız karar özeti yerleştirildi.


## v0.2 Değişiklik özeti — 23 Ekim 2026


- Kullanıcı seçimiyle lojistik ve taşımacılık ana deneyim olarak kesinleşti.
- Oyun vizyonu, oyuncu fantezisi, dört tasarım sütunu ve lojistik görev döngüsü öneri olarak eklendi.
- Yük kütlesi ve ağırlık merkezinin sürüşe etkisi ilk teknik/oynanış doğrulama kapsamına alındı.
- Hikâye seçenekleri lojistik odağında yeniden çerçevelendi.
- Ayrı `01_GAME_VISION_AND_PILLARS.md` dosyası oluşturuldu.
- Teknik sistemlerin güncel tamamlanma durumu kullanıcı testine/repo kontrolüne bağlı kalıyor.


**Sürüm kuralı:** Yeni kararlar `Karar defteri`ne, test bulguları `Test` kayıtlarına, tasarım değişiklikleri sürüm notuna işlenir. Onaylanmış kararlar gerekçe ve değişiklik kaydı olmadan sessizce değiştirilmez.
