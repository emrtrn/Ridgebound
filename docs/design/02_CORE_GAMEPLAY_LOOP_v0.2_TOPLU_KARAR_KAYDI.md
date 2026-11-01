# FORGE OFFROAD — Aşama 2 Toplu Karar Kaydı

**Belge:** `FORGE_OFFROAD_02_CORE_GAMEPLAY_LOOP_v0.2_TOPLU_KARAR_KAYDI.md`  
**Tarih:** 23 Ekim 2026  
**Temel referans:** Google Drive `02_CORE_GAMEPLAY_LOOP_v0.1.md`, ana GDD v0.4, Vision v0.4, Aşama 1 kapanış v1.0, Forge teknik durum raporu (23.10.2026).  
**Durum:** Kullanıcının “Aşama 2'de kalan tüm seçenekleri listele, önerilerini uygula” talebiyle Aşama 2 işleyişine yönelik **toplu tasarım kararları**. Bu belge **Offroad Google Drive klasörüne yeni v0.2 karar kaydı olarak eklendi**. Önceki v0.1 ve ana GDD v0.4 içerikleri değiştirilmedi. Mevcut D-003/D-008/D-009/D-010/D-011/D-015 korunmuştur.  
**Durum sözlüğü:** `[KESİN]` = bu çalışma kapsamında kabul edilen tasarım kuralı; `[AÇIK]` = hâlen karar/parametre bekler; `[TEST GEREKİYOR]` = çalışan özellik olduğu iddia edilemez; `[KAPSAM DIŞI]` = ilk sürüme alınmaz. Kod uygulaması bu kayıtla başlamış sayılmaz.

## 1. Değiştirilmeyen kararlar

- **D-003:** Lojistik ve taşımacılık ana oynanış.
- **D-011:** İzole dağ yerleşimleri.
- **D-015:** Bağımsız nakliyeci.
- **D-008:** Onaylı vizyon, vaat ve oyuncu fantezisi.
- **D-009:** Özgürlük/lojistik planlama; fiziksel arazi mücadelesi; yük fiziği; kurtarılabilir zorluklar.
- **D-010:** İlk oynanabilir sürüm **M0 + M1 + M2**, geliştirme ve kabul sırası **M0 → M1 → M2**.
- **A2-01 + A2-CAM-01–04:** Fiziksel depo iş panosu; ayrı sözleşme ekranı; kısa özet + aynı ekranda accordion ayrıntıları; sürüş/depo hibrit kamerası, FPS karakter yok; fiziksel depo etkileşim noktası; sınırlı 3/4 kamera; depo merkezi odak.
- **A2-01-F01–F07:** Özette yük adı, toplam ağırlık, varış noktası, yük alma noktası, ödül bilgisi, bilinen arazi risklerinin kısa açıklaması; taşıma gerekçesi sadece açılabilir sözleşme ayrıntılarında.

## 2. Kalan seçenekler ve uygulanan öneriler

Aşağıdaki her seçim **[KESİN — TASARIM]** durumundadır; alternatiflerin seçilmesi örnek sayıları, içerikleri, otomatik teknik entegrasyonu veya belirtilmeyen alt parametreleri kesinleştirmez.

### 2.1 İş panosu, sözleşme ve iş kabulü

| ID | Değerlendirilen alternatifler | Uygulanan tercih ve gerekçe |
|---|---|---|
| **A2-01-F08** | A: mesafe özette; B: mesafe ayrıntıda; C: mesafe rota planlamada | **C.** Güzergâha bağlı mesafeler rota karşılaştırması sırasında gösterilir; sözleşmeye yanıltıcı tek yol mesafesi konmaz. |
| **A2-01-F09** | Tek accordion açık / birden çok açık / ayrı sayfalar | **Birden çok bölüm gerektiğinde aynı anda açık kalabilir.** Okumayı zorlamaz, karşılaştırmaya elverişlidir. Başlık/sayı açık. |
| **A2-01-F10** | Tüm ayrıntıları açma zorunluluğu / isteğe bağlı inceleme | **İsteğe bağlı inceleme.** Kısa özet erişilebilir, ayrıntılar açıkça açılabilir; her bölümü açmak kabul önkoşulu değildir. |
| **A2-01-F11** | İş kabul edince otomatik yükleme / kabul ve hazırlama ayrı | **Ayrı.** Kabul, yükü fiziksel olarak araca bağlamaz veya görevi teslimata hazır hale getirmez. |
| **A2-01-F12** | Çoklu aktif iş / ilk sürümde tek aktif iş | **M0'da tek aktif iş.** Bağımsız nakliyeci rolü ileride çoklu işe kapatılmaz. |
| **A2-01-F13** | İptal yok / her an cezasız iptal / yükleme öncesi iptal, sonrası yeniden deneme | **Yükleme öncesi cezasız iptal; yükleme sonrası kontrollü yeniden deneme.** Kesin cezalar, iade/geri götürme ekonomisi kurulmaz. |
| **A2-01-F14** | Zorunlu zaman sınırı / ilk dilimde sınır yok | **M0–M2 ilk oynanabilir dilimde zorunlu süre baskısı yok.** Hedeflenen 5–10 dakikalık oturum, oyuncuya uygulanan teslimat son tarihi değildir. |
| **A2-01-F15** | Riskleri otomatik hesapla / yalnız tasarlanmış ve bilinen riskleri bildir | **Bilinen, görevde tanımlanmış riskleri bildir.** Bilgi yoksa “bilgi mevcut değil”; uydurma kesinlik veya otomatik güvenlik garantisi yok. Rota bağlantısının kapsamı açık. |

### 2.2 Yük ve araç hazırlığı

| ID | Alternatifler | Uygulanan tercih ve gerekçe |
|---|---|---|
| **A2-02-01** | Kabul anında otomatik yükleme / yük alma noktasında oyuncu etkileşimi | **Geçerli yük alma noktasında açık yükleme eylemi.** Sözleşmede görülen konumun oynanış karşılığı olur; FPS kontrol zorunlu değil. |
| **A2-02-02** | Ayrıntılı vinç/yerleştirme mini oyunu / tek sade yükleme işlemi | **Sade yükleme işlemi.** M0'da vinç, paketleri tek tek taşıma ve bağlama simülasyonu gerekmez. Görsel animasyon ve tetik komutu açık. |
| **A2-02-03** | Kapasite yok / yalnız nominal yük ağırlığı sınırı / ağırlık+hacim+geometri tam modeli | **İlk kapasite kavramı nominal taşınabilir yük kütlesi (kg).** Hazırlıkta toplam yük ağırlığıyla karşılaştırılır, aşan yük yüklenmez. Bu, dağ rotasında güvenli geçiş garantisi DEĞİLDİR. Sayısal kapasite ve hesap uygulaması açık. |
| **A2-02-04** | Serbest elle yük istifi ve dağılım / önceden tanımlanmış yükleme profili | **Başlangıçta tanımlı yükleme profili.** M1'de toplam kütle ve ağırlık merkezine bağlanır. Kullanıcının kargo yerleştirme editörü zorunlu değildir. Konum ve kuvvet hesapları test konusu. |

### 2.3 Rota değerlendirmesi

| ID | Alternatifler | Uygulanan tercih ve gerekçe |
|---|---|---|
| **A2-03-01** | Tam GPS/otomatik hesap / sade iki rota karşılaştırması | **İki farklı risk profilli güzergâhı karşılaştıran sade planlama görünümü.** Her rota için tanımlı yaklaşık mesafe ve bilinen zemin/engel riskleri; gerçek GPS yol ağı varsayılmaz. |
| **A2-03-02** | Seçilen rotayı zorunlu takip / rota önerisi, sürüşte serbest seçim | **Öneri, zorunlu koridor değil.** Oyuncu rotayı değerlendirir, dünya içinde farklı bir yol izleyebilir. |
| **A2-03-03** | Ayrıntılı mini harita+adım adım navigasyon / temel hedef-yön bilgisi | **M0 için temel hedef/yön geri bildirimi.** Tam GPS/minimap ve otomatik yol hesaplama ilk gereklilik sayılmaz. |

### 2.4 Sürüş, sorunlar ve kurtarma

| ID | Alternatifler | Uygulanan tercih ve gerekçe |
|---|---|---|
| **A2-04-01** | Karmaşık telemetri HUD / temel sürüş ve iş HUD'u | **Temel HUD:** etkin iş, taşınan yük/durum, hedef, hız ve gerektiğinde anlaşılır eylem/uyarı. Fizik telemetrisi ayrı geliştirici debug görünümünde. |
| **A2-04-02** | Vinç/yardım aracı zorunlu / güvenilir yeniden deneme | **M0–M2 ilk kapsamda güvenilir yeniden deneme.** Konum, reset cezası ve teknik akış ayrıca test edilir; vinç hazır varsayılmaz. |
| **A2-04-03** | Sürüş sırasında süre baskısı / açık uçlu sürüş | **Süre baskısı yok.** Rotanın, yükün ve zeminin kendisi zorluk kaynağıdır. |
| **A2-04-04** | Hasar/düşen yük/ayrıntılı yük bütünlüğü / ilk dilimde yok | **İlk dilimde fiziksel yük düşmesi ve ayrıntılı hasar cezası yok.** M1'de yük kütle/COM etkisi mutlaka olacak. |

### 2.5 Teslimat ve sonuç

| ID | Alternatifler | Uygulanan tercih ve gerekçe |
|---|---|---|
| **A2-05-01** | Teslimat alanına girince otomatik bitiş / oyuncunun teslimi onaylaması | **Doğru teslimat noktasında açık 'Teslim et' etkileşimi.** Teslimat yanlışlıkla tetiklenmez. |
| **A2-05-02** | Kısmi/miktarlı teslimat / tek yükün tam teslimi | **İlk dilimde tek sözleşmenin tanımlı yükünün tam teslimi.** Bölünebilir yük, ara durak ve kısmi ödeme ileri aşama. |
| **A2-05-03** | Teslimat için sadece konuma erişim / doğru aktif iş ve yük kontrolü | **Etkin iş + doğru yükün taşınıyor olması + doğru teslim noktası gerekli.** Boş araçla teslim sayılmaz. |

### 2.6 Ödül, ilerleme ve kayıt

| ID | Alternatifler | Uygulanan tercih ve gerekçe |
|---|---|---|
| **A2-06-01** | Karmaşık sözleşme ekonomisi / sabit iş karşılığı | **M0'da sözleşmede belirtilen sabit nakliye ücreti ve başarılı teslimat bildirimi.** Ödül türü nakit/ücret olarak seçilir; para birimi, miktarı, harcanabileceği sistemler ve ikincil ödüller açık. |
| **A2-06-02** | Otomatik sonraki görevi başlat / iş panosuna geri dön | **Tamamlamadan sonra iş sonucu gösterilir, yeni iş ancak oyuncu panodan seçerse başlar.** Özgürlük korunur. |
| **A2-06-03** | Yalnız tamamlama kaydı / aşamalı görev-yük-ödül durumunu koruma | **Aşamalı save/load:** sunulan/kabul edilen/yüklü/teslim edilmiş/tamamlanmış iş durumları, ilgili kargo kimliği ve ödülün bir kez verilmesi korunur. Otomatik kayıt sıklığı henüz açık. |

### 2.7 Depo yönetim kamerasında kalan davranışlar

| ID | Alternatifler | Uygulanan tercih ve gerekçe |
|---|---|---|
| **A2-CAM-05** | Araç hareket hâlindeyken mod değişimi / durup fiziksel noktadan giriş | **Aracın durduğu ve etkileşim menzilinde olduğu durumda oyuncu depo modunu açar.** Durma eşiği ve kontrol tuşu açık. |
| **A2-CAM-06** | Otomatik sürüşe atma / açık 'Sürüşe dön' eylemi | **Açık dönüş eylemiyle önceki etkin araca geri dönülür.** Depo ekranı kabul/yüklemeyi otomatik sürüşe bağlamaz; araç değiştirme işlevi kaldırılmaz. |
| **A2-CAM-07** | Şimdi sayısal zoom/orbit/pan/tween kilitle / deneyip kalibre et | **Sınırlı kamera ilkesi korunur, sayısal sınırlar ve kontrol eşlemeleri prototip testine bırakılır.** Bu alt parametreler **[AÇIK / TEST GEREKİYOR]**. |

## 3. Tek örnek 5–10 dakikalık oyun oturumu (tasarım akışı; süre taahhüdü değil)

1. **Depoya yaklaş:** Oyuncu aracı etkileşim noktasında durdurup depo yönetim görünümüne geçer.
2. **İşi incele:** Fiziksel panodan sözleşmeyi açar. Kısa özette yük adı/ağırlığı, yük alma ve varış noktaları, ödül ücreti, bilinen arazi riskleri; ayrıntılarda taşıma gerekçesi bulunur. Rota bazlı mesafe henüz burada gösterilmez.
3. **Kabul et:** Ayrıntıların hepsini açma zorunluluğu olmadan oyuncu işi açıkça kabul eder; M0'da ikinci aktif iş açılamaz.
4. **Hazırla:** Tanımlı yük alma noktasında nominal kapasiteyi değerlendirir; açık işlemle yükü alır. Kabul etme eylemi kendiliğinden yükleme yapmaz.
5. **Güzergâhları karşılaştır:** Kısa riskli ile uzun güvenli iki rota için yaklaşık mesafe ve bilinen koşulları görür; bunlar öneridir, araç zorunlu koridorda tutulmaz.
6. **Sür ve uyum sağla:** M0 teslimat döngüsünü doğrular; M1 yük/zemin/rota fiziğini; M2 iz/batma etkisini sonraki bağımsız kabul aşamalarında ekler. Saplanma durumunda güvenilir yeniden deneme vardır.
7. **Teslim et:** Doğru teslimat bölgesinde doğru yükle açık teslim eylemi yapar.
8. **Sonuç ve devam:** Bir kez nakliye ücreti/başarı geri bildirimi verilir; görev/kargo/ödül save/load ile tutarlı kalır. Sonraki iş otomatik başlamaz.

## 4. Kesinleşenler ile henüz açık/testlik olanların ayrımı

**[KESİN — TASARIM]:** Yukarıdaki 28 yeni alt kararın işlem/arayüz düzeyi tercihleri, yeni tek nakliye oturumu akışı. Önceden onaylı tüm kararlar ve M0→M1→M2 kapsamı korunmuştur.

**[AÇIK — SAYI/İÇERİK/UX]:** İş adları, gerçek yükler ve kütleler, araç nominal kg kapasitesi, para birimi/ücret miktarı/ücretin ekonomik kullanımı, teslim noktası/yerleşim adları, fiziksel yük alma noktası geometrisi, zaman-süre hedefleri ve kıyaslama yollarının ölçüleri, risklerin nasıl güncellendiği, accordion başlıkları ve düzeni, kamera tuşları/sınırları/animasyon süreleri, iptalden sonra kargo durumunun özel durumu, otomatik kayıt sıklığı, HUD piksel tasarımı, oyuncu ilk karşılaşma öğreticisi, teknik yapı/algoritma detayları.

**[TEST GEREKİYOR / HAZIR DEĞİL]:** Özgün nakliye sözleşmesi ve görev akışı; load/cargo kimliği ve nominal kapasite kontrolü; kütle/COM'u yükten türetme; oyuncuya yönlendirme/rota kıyası; zemin tutuş/batma/iz; depo yönetim modu geçişi; uçtan uca ödül tekillik/save; 5–10 dakika oynanış hissi ve test kapıları. Forge'un genel etkileşim, UI, raycast araç, authored kütle/COM, kayıt temelleri var ama bunlar nihai sistemler değil.

**[KAPSAM DIŞI — İLK SÜRÜM]:** FPS karakter, gelişmiş vinç/römork, karmaşık şirket ekonomisi, düşen-yük/ileri hasar, çoklu aktif sözleşme, dinamik hava/afeti, büyük kesintisiz dünya, gerçek zamanlı collider iz deformasyonu; kalıcı lastik izi kaydı için ayrıca T04 kararı gerekir.

## 5. Teknik görev adayları — henüz açılmadı

1. **FORGE-INT-01 [ADAY]:** Depo etkileşim giriş/çıkış + kontrollü 3/4 kamera; input ve kamera limitleri teknik prototipte belirlenecek.
2. **FORGE-M0-01 [ADAY]:** Sözleşme/pano, iş durumu, yük alma/teslim etme, ödül tekilliği ve save/load entegrasyonu.
3. **FORGE-M1-01 [ADAY]:** Yük kütlesi/ağırlık merkezinin araç fiziğine etkisi, üç zemin ve iki rota A/B testleri.
4. **FORGE-M2-01 [ADAY]:** Görsel iz, yumuşak zemin direnç/batma, tekrarlı geçiş ve performans ölçümleri.

Bu kayıt **kodun yazıldığı, testlerin geçildiği veya Aşama 2'nin tüm sayısal ayrıntılarının kapandığı** anlamına gelmez. Aşama 2'nin **işlevsel çekirdek tasarım akışı** toplu kararlarla tarif edilmiştir; kalan açık ve testlik maddeler uygulama kabul kapılarına taşınacaktır.
