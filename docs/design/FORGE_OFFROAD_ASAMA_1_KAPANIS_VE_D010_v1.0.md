# FORGE OFFROAD — Aşama 1 Kapanış ve Kesinleşen Tasarım Kararları

**Belge sürümü:** v1.0  
**Tarih:** 23 Ekim 2026  
**Proje:** Forge Offroad (geçici çalışma adı)  
**Durum:** AŞAMA 1 TAMAMLANDI — Tasarım kararları onaylı; uygulama ve testler ayrıca yapılacak.  
**İlişkili ana belgeler:** `FORGE_OFFROAD_GDD_PROJE_CERCEVESI_v0.3.md`, `01_GAME_VISION_AND_PILLARS_v0.3.md`, `FORGE_OFFROAD_FORGE_TEKNIK_DURUM_RAPORU_2026-10-23.md`  
**Belge rolü:** Onaylanmış Aşama 1 kararlarının GDD'ye aktarılabilecek kapanış kaydı ve Aşama 2'ye devir notu. Bu dosya Drive'daki ana dosyaların yerini almaz.

---

## 1. Aşama 1 sonucu

Forge Offroad, bağımsız bir nakliyecinin izole dağ yerleşimlerine yük ulaştırdığı; lojistik kararlar, yükün fiziksel etkileri ve araziyle mücadele üzerine kurulu bir oyun olarak tanımlandı. Oyuncunun rolü, temel vizyonu, oyuncu fantezisi, dört tasarım sütunu ve ilk oynanabilir sürümün kapsamı kesinleştirildi.

**Vizyon cümlesi — [KESİN; D-008]**

> Forge Offroad, oyuncunun bağımsız bir nakliyeci olarak izole dağ yerleşimlerinin ihtiyaçlarını karşılamak için zorlu arazi koşullarında taşımacılık yaptığı bir arazi lojistiği oyunudur. Oyuncu nakliye işlerini seçer, aracının ve yükünün özelliklerini değerlendirir, güzergâhını planlar ve değişken arazi şartlarıyla mücadele ederek teslimatlarını tamamlamaya çalışır. Başarı yalnızca sürüş becerisine değil; hazırlığa, doğru kararlar almaya ve karşılaşılan sorunlara çözüm geliştirmeye bağlıdır.

**Temel vaat — [KESİN; D-008]**

> Önemli olan yalnızca hedefe ulaşmak değil, yükünü oraya ulaştırabilmektir.

**Oyuncu fantezisi — [KESİN; D-008]**

> Kendi kararlarımla zorlu yolları aşan, yükümü güvenle ulaştıran ve her başarılı teslimatla daha büyük işlerin üstesinden gelebilen bir nakliyeciyim.

Oyuncu fantezisinin üç boyutu: **özgürlük** (planı kendisi yapar), **ustalık** (arazi ve araç bilgisiyle ilerler), **başarı** (yükü ihtiyaç duyulan yere ulaştırır).

## 2. Karar defteri — güncel

| ID | Konu | Kesinleşen karar | Durum |
|---|---|---|---|
| D-003 | Ana oyun deneyimi | Lojistik ve taşımacılık | **[KESİN]** |
| D-011 | Dünya seçimi | İzole dağ yerleşimleri; afet sonrası ikmal ve uzak bölge taşımacılığı ana dünya olarak seçilmedi | **[KESİN]** |
| D-015 | Oyuncunun rolü | Bağımsız nakliyeci; iş, hazırlık ve rota tercihlerinde karar sahibi | **[KESİN]** |
| D-008 | Ana vizyon ve oyuncu fantezisi | Yukarıdaki onaylı vizyon, vaat ve fantezi | **[KESİN]** |
| D-009 | Tasarım sütunları | 1. Özgürlük ve lojistik planlama; 2. Araziyle fiziksel mücadele; 3. Yükün sürüş fiziğine etkisi; 4. Problem çözme ve kurtarılabilir zorluklar | **[KESİN]** |
| D-010 | İlk oynanabilir sürüm | B yaklaşımı: **M0 + M1 + M2**, sıralı geliştirme ve ayrı kabul kapıları | **[KESİN]** |

**Karar kapsamına girmeyenler:** Oyuncunun aracına ilk günden sahip olup olmadığı, şirket/kooperatif yapısı, para ve itibar ekonomisinin ayrıntıları, ülke ve dönem, hikâye olayları, yerleşim isimleri, grafik tarzı, hedef FPS/donanım. Bunlar bu aşamada kesinleştirilmedi.

## 3. D-009 — Kesinleşmiş tasarım sütunları

### 1. Özgürlük ve lojistik planlama

Oyuncu işi, hazırlığı ve güzergâhı üzerinde anlamlı kararlar verir. Özgürlük, ilk sürümde sınırsız içerik sunmak değil; sınırlı sayıda ama sonuçları farklı seçenekler sunmaktır.

**Tasarım testi:** Aynı teslimatı tamamlamanın birden fazla anlamlı yolu var mı?

### 2. Araziyle fiziksel mücadele

Zemin koşulları, eğim ve engeller aracın davranışını değiştirir; çamur yalnızca farklı renkli bir görsel katman değildir.

**Tasarım testi:** Zemin türü değiştiğinde sürüş stratejisinin de değişmesi gerekiyor mu?

### 3. Yükün sürüş fiziğine etkisi

Yük, sadece teslimat verisi değil; aracın kütlesini, ağırlık merkezini ve sürüş tepkisini etkileyen bir oyun unsurudur.

**Tasarım testi:** Yükün ağırlığı değişince fren, ivmelenme, denge ve rota tercihi anlamlı biçimde değişiyor mu?

### 4. Problem çözme ve kurtarılabilir zorluklar

Saplanma, devrilme veya yokuşta zorlanma anlaşılabilir nedenlere dayanmalı; oyuncuya yaklaşımını değiştirme veya yeniden deneme olanağı verilmelidir.

**Tasarım testi:** Başarısızlıktan sonra oyuncu farklı ne yapabileceğini anlayabiliyor mu?

**Kapsam filtresi:** İlk sürüme eklenecek her özellik en az bir sütunu güçlendirmeli; teknik maliyeti, görsel cazibesi veya referans oyunda bulunması tek başına gerekçe değildir.

## 4. D-010 — İlk oynanabilir sürüm kapsamı [KESİN]

**Seçilen yaklaşım: B — Lojistik, sürüş ve temel deformasyon.**

İlk oynanabilir sürüm tamamlandığında M0, M1 ve M2 birlikte bulunacak; buna karşın uygulama **M0 → M1 → M2** sırasıyla ve bağımsız kabul adımlarıyla geliştirilecek. Bir basamağın tamamlanması tek başına ilk oynanabilir sürümün bittiğini göstermez.

### M0 — Nakliye ve görev döngüsü

- Bir sürülebilir nakliye aracı.
- Bir başlangıç deposu ve bir teslimat noktası.
- Bir nakliye işi: yükü al → taşı → teslim et → görevi tamamla/ödül geri bildirimi al.
- En az hafif ve ağır yük profilini tanımlayabilecek veri yapısı.
- Yük kimliği, aktif görev ve tamamlanma bilgisinin save/load sırasında korunması.
- Oyuncuya görev, yük ve teslim durumunu gösteren temel HUD.

**Kabul kapısı:** Tek teslimat uçtan uca yapılabiliyor; yeniden yüklemede görev/yük/ödül sonucu tutarlı ve ödül yanlışlıkla ikinci kez verilmiyor.

### M1 — Yük, yüzey ve rota farkı

- Aynı araçta boş/hafif/ağır yük koşullarının karşılaştırılması.
- Yük kütlesi ve ağırlık dağılımının sürüş davranışına bağlanması.
- En az üç zemin sınıfı: sert zemin, toprak, çamur.
- En az iki rota: kısa ama riskli ve uzun ama daha güvenli.
- Arazi koşullarının tutuş/direnç veya başka ölçülebilir mekaniklerle sürüşü etkilemesi.
- Eğim ve zorlu yüzeylerin anlaşılabilir sürüş tepkileri.

**Kabul kapısı:** Yük ve zemin farklılıkları sadece görsel değil, tekrarlanabilir fizik/oynanış farkı yaratıyor; iki rota arasında gerekçelendirilebilir seçim var.

### M2 — Temel deformasyon ve batma prototipi

- Tekerlek geçişinin algılanması ve temel görsel iz üretimi.
- Yumuşak zeminde direnç/batma hissini oluşturan sürüş tepkisi.
- Aynı zeminden tekrarlı geçiş etkisinin prototip kapsamında ayrı sınanması.
- Görsel iz ve fiziksel tepkinin oyuncuyu yanıltmayacak düzeyde tutarlılığı.
- FPS, fizik adımı, bellek ve iz alanı maliyetlerinin ölçülebilmesi.

**Kabul kapısı:** Çamur sadece renk farkı yaratmıyor; araç davranışı üzerinde gözlenebilir etki üretiyor. İz ve batma yaklaşımının maliyeti/test sınırları raporlanıyor.

**Teknik sınır:** M2, ilk aşamada her tekerlek izinde gerçek zamanlı collision mesh yeniden şekillendirmeyi zorunlu kılmaz. Görsel iz, batma/direnç simülasyonu, collider güncellemesi ve izlerin kalıcı save/load desteği ayrı teknik düzeylerdir. Kalıcı iz kaydı şu an kesin MVP zorunluluğu olarak onaylanmadı; T04 kapsamında açık test/karar konusu olarak kalır.

### İlk test sahasının sınırları

- **1 araç, 1 küçük test bölgesi, 1 depo, 1 teslimat noktası.**
- **2 yük profili** (hafif/ağır), ayrıca boş araç karşılaştırması.
- **2 rota**, **3 yüzey tipi**.
- Vinç bulunmuyorsa güvenilir reset/yeniden deneme.
- Görev, yük, yön/hız/teslimat geri bildirimi ve basit teknik debug görünümü.
- Dünya ölçeği, performans testinden sonra artırılacak; kilometrelik açık dünya ilk dilimin teslim koşulu değil.

### İlk kapsamın dışında / ileri aşama

Çoklu araç filosu, gelişmiş römork ve vinç sistemi, ayrıntılı araç hasarı/yakıt/bakım, karmaşık ekonomi, çok oyunculu, gelişmiş trafik AI, ağır su simülasyonu, kapsamlı dinamik mevsim/hava durumu, uzun sinematik hikâye, büyük kesintisiz dünya ve gerçek zamanlı collider deformasyonu. Bunlar nihai oyundan çıkarılmış değil; ilk dilimin dışındadır.

## 5. Tasarım ve teknik doğrulama ayrımı

**Onaylanmış tasarım ≠ çalışan motor özelliği.** 23 Ekim 2026 teknik durum raporu Forge'da sürülebilir araç, temel araç fiziği, editör arazisi, spline yol, genel etkileşim/HUD/save altyapısının bulunduğunu; fakat nakliye yükünün fiziksel entegrasyonu, tamamlanmış teslimat döngüsü, zemine göre lastik tepkisi ve araç kaynaklı dinamik deformasyonun henüz hazır olmadığını gösteriyor.

Oyun hedefi olan M0–M2'nin başarısı ancak sonraki geliştirme ve kabul testleriyle doğrulanacak.

Öncelikli testler:

- **T01:** Aynı araç ve rotada boş/hafif/ağır kütle koşullarında ivmelenme, frenleme, süspansiyon ve denge farkı.
- **T02:** Sert/toprak/çamur yüzeylerinin tutuş ve direnç karşılaştırması.
- **T03:** Eğimli/taşlı zeminde çekiş, stabilite, geri kazanım.
- **T04:** İz ve deformasyonun tekrarlı geçiş davranışı; kalıcılık/save gereksinimi ayrıca karara bağlanacak.
- **T05:** Temsilî sürüşte FPS dağılımı, fizik adımı ve bellek/kaynak maliyeti.
- **GÖREV-01:** Yük alma → teslim → tek seferlik ödül → save/load tutarlılığı.

## 6. Aşama 1 kapanış denetimi

- [x] Ana deneyim onaylandı — D-003.
- [x] Dünya çerçevesi seçildi — D-011.
- [x] Oyuncu rolü belirlendi — D-015.
- [x] Ana vizyon ve oyuncu fantezisi onaylandı — D-008.
- [x] Dört tasarım sütunu onaylandı — D-009.
- [x] İlk oynanabilir sürümün kapsam sınırı seçildi — D-010 (B: M0 + M1 + M2).

**Aşama 1 durumu: TAMAMLANDI (tasarım kararları düzeyinde).**

## 7. Aşama 2'ye devir — Çekirdek oynanış döngüsü

Aşama 2'de yanıtlanacak sorular:

1. Bağımsız nakliyeci yeni işi **nereden ve nasıl alır**? (görev panosu, depo görevlisi, vb.)
2. Yük seçimi nasıl çalışır? Araç kapasitesi, paket türü ve başlangıç miktarı nasıl gösterilir?
3. Rota bilgisi ne zaman ve hangi araçla verilir? İki rota arasındaki risk oyuncuya ne kadar açık anlatılır?
4. Tek teslimatın 5–10 dakikalık örnek oyun oturumu hangi sırada gelişir?
5. Hatalı teslimat, saplanma, geri dönüş, reset ve yeniden deneme ne anlama gelir?
6. Teslimat sonrası **ödül** ilk dilimde ne sağlar? Para/erişim/itibar gibi ilerleme seçeneklerinden hangisi ilk dilimde gerekli?
7. Aynı görevin hafif ve ağır yükle tekrar oynanması oyuncuya hangi farkı gösterecek?
8. Ekranda hangi minimum görev ve sürüş bilgileri olacak?

**Aşama 2 çıkış ölçütü:** Tek bir 5–10 dakikalık nakliye oturumu, oyuncunun eylemleri ve oyun durumlarıyla adım adım tarif edilebilmeli; görev kabul/başarısızlık/ödül/save koşulları belirlenmiş olmalı.

---

## Değişiklik kaydı

- **v1.0 — 23 Ekim 2026:** D-015 bağımsız nakliyeci, D-008 ana vizyon ve fantezi, D-009 dört sütun ve D-010 B (M0+M1+M2) onaylarına dayanılarak Aşama 1 kapatıldı. Ana GDD v0.3 ile Vision v0.3 için karar güncelleme girdileri kaydedildi. Bu belge, Drive'daki mevcut dosyaların otomatik olarak değiştirildiği anlamına gelmez.
