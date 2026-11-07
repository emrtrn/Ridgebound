# RIDGEBOUND / FORGE — Deformable & Fracturable Sistemleri

**Belge türü:** Teknik araştırma, oyun tasarımı değerlendirmesi ve prototip planı  
**Sürüm:** v0.1  
**Tarih:** 2 Kasım 2026  
**Ürün:** Ridgebound (Forge oyun motoru üzerinde geliştirilen oyun)  
**Hedef okur:** Forge motor/editör geliştiricileri, Ridgebound tasarım ve teknik ekipleri  
**Karar durumu:** **[ÖNERİ / TEKNİK DEĞERLENDİRME]** — Bu doküman uygulama onayı veya tamamlanmış özellik kaydı değildir.  
**Kanıt sınırı:** Forge'un mevcut durumu, 23 Ekim 2026 tarihli teknik raporda incelenen `feat/open-world` / `84ff7cf877cf2338a54598afb9936cf291656c11` commit'ine dayanır. Daha sonraki değişiklikler burada doğrulanmadı.

---

## 1. Yönetici özeti

Ridgebound'un onaylı ana deneyimi **lojistik ve taşımacılık**, dünya çerçevesi ise **izole dağ yerleşimleri**dir. Oyunda arazi, yük, araç ve rota arasındaki ilişki kritik olduğundan, nesnelerin deforme olabilmesi ve kırılabilmesi yalnızca görsel kalite değil **oynanışta sonuç doğuran etkileşim** olarak ele alınmalıdır.

**Önerilen yaklaşım:**

1. Genel amaçlı bir soft-body simülatörüyle başlamamak.
2. `forge.deformable` ile ucuz görsel deformasyonu ve olay tabanlı kalıcı ezilmeyi geliştirmek.
3. `forge.fracturable` ile önceden parçalanmış modellerin kırılmasını, parça ayrılmasını ve bağlantı kopmasını geliştirmek.
4. Çamur, kar, toprak ve tekerlek izi gibi dünya yüzeyi değişimlerini **ayrı** `forge.terrain-deformation` hattında tutmak.
5. Uzun vadede bu özellikleri **Progressive Damage (kademeli hasar)** durum modeliyle birbirine bağlamak: `Sağlam → Esneme → Kalıcı deformasyon → Yapısal hasar → Kırılma`.

**İlk önerilen motor prototipi:** Esnek metal panel, rüzgâr/temas tepkili bitki, kırılabilir kasa, kırılabilir çit ve gerilen/kopan halat. Köprü, yük hasarı ve geniş kapsamlı soft-body fizik, ilk güvenilirlik/performans testlerinden sonra ele alınmalı.

> **Kritik ayrım:** Forge'un Rapier rigid-body altyapısının bulunması, araç hasarı, vinç, gerçek soft-body, fracturing veya canlı arazi deformasyonunun bugün hazır olduğu anlamına gelmez.

---

## 2. Kaynaklara dayalı mevcut durum

### 2.1. Onaylı oyun bağlamı

| Konu | Kaynakta yer alan karar | Durum |
|---|---|---|
| Oyunun adı | Bu projede **Ridgebound** olarak seçilmiştir. | [KESİN — proje kararı] |
| Ana deneyim | Lojistik ve taşımacılık | [KESİN] |
| Oyun dünyası | İzole dağ yerleşimleri | [KESİN] |
| Tasarım yönü | Zorlu zemin, yükün fiziğe etkisi, rota seçimi, kurtarma fırsatları | [ÖNERİ — GDD tasarım sütunları] |
| İlk oynanabilir dilim | Bir araç, iki rota, hafif/ağır yük, sert/toprak/çamur zemin, tek teslimat | [ÖNERİ — henüz kilitlenmiş MVP değil] |

**Kaynak:** `FORGE_OFFROAD_GDD_PROJE_CERCEVESI_v0.3.md` ve `01_GAME_VISION_AND_PILLARS_v0.2.md` (23 Ekim 2026). Belgelerde önceki geçici proje adı bulunabilir; bu raporda seçilmiş oyun adı Ridgebound kullanılmıştır.

### 2.2. Forge teknik envanteri — en son doğrulanmış rapor

| Yetenek | Rapora göre durum | Bu araştırmaya etkisi |
|---|---|---|
| Renderer | Three.js 0.184.0, WebGLRenderer, WebGL2 | Vertex shader, mesh güncelleme ve özel render yolları için temel mevcut. WebGPU compute varsayılmamalı. |
| Fizik | `@dimforge/rapier3d-compat` 0.19.3; sabit fizik adımı varsayılan 1/60 s | Rigid-body/constraint temelli çözümler için başlangıç noktası mevcut. |
| Sahne modeli | Entity/component ve Actor/prefab yaklaşımı | Yeniden kullanılabilir deformable/fracturable bileşenleri tasarlamaya uygun. |
| Kayıt | Level/asset sidecar yapısı ve oyun save/load temeli | Yeni component alanları ve kalıcı hasar durumu için şema entegrasyonu gerekecek. |
| Araç | Raycast araç, şasi, süspansiyon ve temel aktarma sistemi | Araç çarpışması görsel hasara bağlanabilir; bu bağlantı mevcut sayılmamalı. |
| Genel hasar | Health / `Damage.Apply` gibi davranış altyapısı | Araç ve kırılabilir çevre için özel hasar modeli yine geliştirilmeli. |
| Vinç/halat | Oyun seviyesinde hazır değil | Halat görünümü ve fiziksel çekme sistemi ayrı tasarlanmalı. |
| Araç hasarı | Hazır değil | Kaporta ezilmesi motor özelliği olarak yeni çalışma. |
| Runtime tekerlek izleri/batma | Planlı, uygulanmış değil | Nesne deformasyonu ile terrain deformasyonu karıştırılmamalı. |
| Terrain collision | Uygulama runtime'ında statik trimesh; tile heightfield temeli ayrı test edilmiş | Her darbe ve iz için collision mesh'ini yenilemekten kaçınılmalı. |
| Performans | Tam Ridgebound yük/çevre/araç sahnesi için kabul ölçümü yok | Önerilen maliyetler tahmindir; performans test edilmelidir. |

**Kaynak:** `FORGE_OFFROAD_FORGE_TEKNIK_DURUM_RAPORU_2026-10-23.md` (özellikle Bölüm 1, 2, 3, 5, 7). Bu tablo 23 Ekim tarihli anlık durumdur; implementasyona başlamadan depo tekrar incelenmelidir.

---

## 3. Kavramlar ve teknik kapsam

### 3.1. Deformable (deforme olabilen)

Nesnenin geometrisinin veya görünümünün rüzgâr, hareket, temas, yük veya darbe sonucu geçici ya da kalıcı değişmesidir.

| Seviye | Tanım | Örnek | Olası yöntem | Göreli çalışma maliyeti |
|---|---|---|---|---|
| **D1 — Visual** | Fizik simülasyonu olmadan görünüş değişir. | Ot, bayrak, çalı | Vertex shader | Çok düşük |
| **D2 — Reactive** | Temas/darbe olayı sonucu parametrik değişim. | Kaporta göçüğü, bükülen dal | Yerel vertex edit / kemik | Düşük–orta |
| **D3 — Simulated** | Parçacıklar veya kısıtlar çözümlenir. | Branda, kumaş, esnek hacim | XPBD / Verlet / shape matching | Orta–yüksek |

> Görsel deformasyon ile çarpışma geometrisinin deformasyonu aynı işlem değildir. İlk sürümde çoğu nesne için görsel değişim + sade collider yeterli olabilir; yalnız oynanışı etkileyen şekil değişimlerinde collision politikası ayrıca belirlenmelidir.

### 3.2. Fracturable (kırılabilen/parçalanabilen)

Bir nesnenin belirli bir kuvvet, gerilme veya birikmiş hasar sonrasında birden fazla parçaya ayrılması veya bağlı parçalarının kopmasıdır.

| Mod | Tanım | Örnek | Göreli geliştirme karmaşıklığı |
|---|---|---|---|
| **Prefractured** | Önceden hazırlanmış parçaları serbest bırak. | Kaya, ahşap kasa, cam | Düşük–orta |
| **Joint-break** | Rijit parça bağlantılarını kopar. | Köprü, çit, asılı yük | Orta |
| **Detach** | Ayrılabilir alt parçayı aktörden ayır. | Tampon, ekipman | Düşük–orta |
| **Swap-mesh** | Sağlam modeli hasarlı/kırık modelle değiştir. | Uzak bina detayı, hafif kırık | Düşük |

**Başlangıçta kapsam dışı öneri:** Herhangi bir üçgen mesh'i oyun sırasında keyfî kesen, gerçek zamanlı genel amaçlı fracture algoritması. Yüksek karmaşıklık, parça/collider üretimi ve perf riskleri nedeniyle ancak somut gereksinim varsa araştırılmalı.

### 3.3. Progressive Damage (kademeli hasar)

İki sistemin üstünde yer alabilen **durum/hasar modeli** önerisidir. Her nesnenin bütün aşamaları fiziksel simülasyonla gerçekleştirilmek zorunda değildir.

`INTACT → FLEXING → DEFORMED → DAMAGED → FRACTURED`

- **INTACT:** Sağlam.
- **FLEXING:** Geçici esneme; koşullar normale dönünce geri dönüş.
- **DEFORMED:** Kalıcı şekil değişimi.
- **DAMAGED:** Dayanım veya işlevde kayıp.
- **FRACTURED:** Parçalanma/bağlantı kopması.

Bu geçişler malzeme, olay şiddeti, gerilim süresi ve birikmiş hasara bağlı olabilir. Bunlar **önerilen oyun kurallarıdır**, motorun mevcut mekanikleri değildir.

---

## 4. Ridgebound kullanım alanları

### 4.1. Araçlar

| Nesne | Davranış | Önerilen teknik | Oyun etkisi | Öncelik |
|---|---|---|---|---|
| Kaporta | Çarpma noktasında kalıcı göçük | Impact vertex deformasyonu | Görsel hasar / ileride bakım | Yüksek |
| Tampon | Bükülme, gerekirse kopma | Lokal vertex + detach | Çarpışma geri bildirimi | Yüksek |
| Çamurluk | Kayaya sürtünmede lokal ezilme | Impact vertex | Hasar görünürlüğü | Orta |
| Lastik | Yük altında basılma | Shader/kemik; fizik ayrı | Ağırlık hissi | Orta |
| Süspansiyon parçası | Hasar sonrası eğrilme | Parametrik/kemik | İleri seviye araç hasarı | Düşük |
| Yük brandası | Sarkma ve rüzgârda dalgalanma | Shader, gerekirse XPBD | Yük/araç okunurluğu | Orta |

**Örnek — Kayaya çarpan kamyon:** Rapier'dan güvenilir çarpışma konumu, normal ve şiddet bilgisi elde edilir veya türetilir; görsel deformasyon yalnız uygun vertex bölgesine uygulanır. Hasar sistemine ayrı olay gönderilebilir. Araç collider'ının otomatik şekil değiştirdiği **varsayılmaz**.

### 4.2. Yük ve taşımacılık

| Yük | Tepki | Önerilen yöntem | Oynanış olasılığı |
|---|---|---|---|
| Çuvallar | Sıkışma/ezilme | Basitleştirilmiş kemik/shape matching | Yükün yumuşak görünmesi |
| Kumaş paketleri | Bükülme/sarkma | Basitleştirilmiş XPBD | Yük hareketinin okunması |
| Ahşap kasalar | Kırılma | Prefractured | Kırılgan kargo görevleri |
| Plastik bidon | Ezilme | Impact vertex | Kalıcı darbe izi |
| Metal varil | Lokal göçük | Impact vertex | Fiziksel hasar geri bildirimi |
| Cam malzeme | Parçalanma | Prefractured / swap-mesh | Hasarlı teslimat olasılığı |
| Bağlama halatları | Gerilme/gevşeme | Kısıt + görsel spline | Yük emniyeti |
| Yük brandası | Gerilme ve dalgalanma | Shader / XPBD | Taşıma görselliği |

**Örnek — Hassas teslimat:** Cam malzemeli bir kasanın çarpma/ivmelenme/devrilme gibi olaylardan hasar alması; teslimat sonucunun sağlam, hafif hasarlı, ağır hasarlı veya kullanılamaz durumlarına göre değerlendirilmesi. Ödül oranları ve başarısızlık koşulları **henüz onaylanmış oyun kararı değildir**.

**Bağımlılık:** Gerçek yük savrulması ve kütle etkisi için önce cargo–araç bağlantısı, toplam kütle/ağırlık merkezi ve fiziksel bağlama mekanikleri doğrulanmalıdır. İlk prototipte animasyon veya olay temelli görsel gösterim kullanılabilir, fakat fiziksel kargo simülasyonu gibi sunulmamalıdır.

### 4.3. Doğa ve çevre

| Nesne | Davranış | Teknik | Öncelik |
|---|---|---|---|
| Çalı, uzun ot | Aracın geçişinde eğilme ve toparlanma | Shader, etki alanı | Yüksek |
| Ağaç dalı | Araçla temas edince bükülme | Kemik/shader | Orta |
| Kuru dal | Şiddetli çarpmada kopma | Detach / prefractured | Orta |
| Yol kenarı bariyeri | Ezilme/bükülme | Yerel vertex veya segment bazlı rigid body | Orta |
| Ahşap çit | Kırılma ve devrilme | Prefractured / joint-break | Yüksek |
| Asılı tabela | Rüzgârda sallanma | Basit joint/animasyon | Orta |
| Elektrik kablosu | Sarkma ve salınım | Spline / Verlet | Düşük |
| Depo brandası | Dalgalanma | Shader / XPBD | Orta |

**Araç–bitki etkileşimi:** Yakın araçların konumu/hızı bir etki alanı olarak shader'a aktarılabilir. Bitkiler fizik gövdesi olmadan yönlü bükülür ve kademeli geri döner. Çok sayıda bitkiye ayrı CPU simülasyonu uygulanmamalı.

### 4.4. Parçalanabilir çevre

| Nesne | Kırılma / sonuç | Potansiyel oynanış katkısı | Öncelik |
|---|---|---|---|
| Ahşap çit | Darbeyle ayrılma | Geçiş açma veya engel hasarı | Yüksek |
| Palet/kasa | Ağır yük veya darbe ile kırılma | Yük hasarı ve depo etkileşimi | Yüksek |
| Kaya engeli | Önceden hazırlanmış parçalara ayrılma | Yol açma / geçit temizleme | Yüksek |
| Ahşap köprü | Yük altında aşamalı hasar/çökme | Kısa riskli rota / uzun güvenli rota | Yüksek, ancak ileri aşama |
| Yol tabelası | Direkten kırılma | Ortam tepkisi | Orta |
| Kuru ağaç | Kırılıp devrilme | Yeni yol engeli | Orta |
| Buz tabakası | Taşıma sınırı aşılınca kırılma | Rota riski | İleri aşama |
| Bina detayı | Parça kopması | Atmosfer | Düşük |

**Not:** Kaya parçalama, buz kırılması ve köprü çökmesi oyunun onaylı ana mekanikleri değildir; tasarım adaylarıdır.

---

## 5. Yüksek değerli oynanış senaryoları

### S-01 — Ağırlık altında hasar gören köprü

**Durum:** Dağ yolundaki kısa köprü, hafif araçta güvenli; ağır yüklü araçta riskli olabilir.  
**Oyun kararı:** Kısa riskli geçiş mi, daha uzun güvenli yol mu?  
**Fizik yaklaşımı:** Ana bölümler rigid body; kritik bağlantılar joint; sınırlı sayıda esneme animasyonu; belirli hasar eşiğinde bağlantı kopması.  
**Önemli:** Köprü kapasitesi yalnız tek anlık impact'e bağlanmamalı. Bölgesel yük, kuvvetin süresi ve birikmiş hasar dikkate alınabilir.  
**Risk:** Çöken köprünün araç collider'ı, parça sayısı, kurtarma ve kayıt mantığı birlikte test edilmelidir.  
**Önerilen faz:** İleri prototip.

### S-02 — Yol kapatan ve temizlenebilen kaya

**Durum:** Bir kaya dar geçidi kapatıyor. Uygun araç/ekipmanla engel kaldırılabiliyor veya parçalanabiliyor.  
**Teknik:** Sağlam model → prefractured model; az sayıda önemli fizik parçası; küçük kırıntılar VFX; süre/mesafe bazlı uyku veya temizleme.  
**Oyun kararı:** Engeli kaldırma maliyeti mi, alternatif rota mı?  
**Risk:** İlerleyen oyunda yolun açık/kapalı durumunun kalıcı kaydı gerekir.

### S-03 — Gerilen ve kopabilen vinç halatı

**Durum:** Araç çamura saplanıyor; oyuncu halatı kaya/ağaç ankrajına bağlıyor.  
**Fizik:** Çekme kuvveti, izin verilen uzunluk, gerilim sınırı ve ankraj bütünlüğü.  
**Görsel:** Spline/az sayıda segment ile gerilen/gevşeyen halat; gerekirse salınım.  
**Kırılma:** Eşik ve süre koşulu ile bağlantının kopması.  
**Önemli:** Görsel halatın XPBD ile çözülmesi, vinç kuvvet modelinin yerine geçmez.  
**Bağımlılık:** Forge'da oyun seviyesinde vinç/ankraj sistemi önce geliştirilmelidir.

### S-04 — Hasar alan hassas kargo

**Durum:** Oyuncu kırılgan malzemeyi yerleşime ulaştırıyor.  
**Girdi:** Çarpma şiddeti, devrilme veya kargo bağlama durumundan gelen olaylar.  
**Çıktı:** Hasar durumu, görsel kırılma, teslimat değerlendirmesi.  
**Taslak sonuçlar:** `intact`, `minor_damage`, `major_damage`, `destroyed`.  
**Bağımlılık:** Cargo sistemi, save/load ve görev ödülüyle entegrasyon gerekir.  
**Not:** Hasar ve ödül cezası MVP için zorunlu değildir.

### S-05 — Dünyada kalıcı iz bırakan kırılma

**Durum:** Kırılan çit kırık kalır; temizlenen kaya tekrar doğmaz; çöken köprü kapanır; ezilen kaporta onarıma kadar korunur.  
**Öneri:** Kırılan bütün parçaların her karedeki fizik pozunu değil, **nesneye ait kalıcı durum ve olayları** saklamak.  
**İstisna:** Oyunun yeniden yüklenmesinde konumu önemli olan parçalar için sınırlı transform verisi gerekebilir.  
**Risk:** Bölge streaming, görev tekrar oynatma, reset ve save sürümleme kuralları önceden belirlenmelidir.

---

## 6. Forge motor mimarisi önerisi

### 6.1. Sorumluluk ayrımı

```text
[Rapier Physics / Engine Events]
               |
               v
      [Contact / Stress Adapter]
               |
    +----------+-----------+
    |                      |
    v                      v
[forge.deformable]   [forge.fracturable]
    |                      |
    +-----------+----------+
                |
                v
       [Damage / State Layer]
                |
     +----------+-----------+
     |                      |
     v                      v
[Render/Audio/VFX]      [Persistence]

[forge.terrain-deformation]  <-- ayrı yüzey/tekerlek hattı

[Ridgebound Gameplay] <-- görev, ödül, kargo, rota ve kurtarma kuralları
```

Bu şema **taslak sorumluluk modelidir**, uygulanmış Forge mimarisi değildir.

### 6.2. `forge.deformable`

**Amaç:** Rüzgâr, temas, darbe veya kısıt çözücüsünden kaynaklanan geometrik görünüm değişimini sağlamak.

**Önerilen modlar:** `shader`, `impact`, `skeletal`, `softbody`.

**Önerilen bileşen alanları:**

| Alan | Açıklama |
|---|---|
| `mode` | Deformasyon modu |
| `stiffness` / `damping` | Esneme ve geri dönüş parametreleri; moda bağlı |
| `plasticity` | Kalıcı deformasyon katsayısı; moda bağlı |
| `maxDeformation` | Görsel değişimin üst sınırı |
| `collisionPolicy` | `visual_only`, `proxy_update`, `rebuild_on_threshold` gibi kontrol |
| `simulationDistance` | Yakınlık/önem temelli etkinleştirme |
| `persistState` | Kalıcı deformasyon kaydı gerektiğinde |
| `qualityProfile` | Çözücü frekansı/segment/iterasyon ayarı |

**Prensip:** Bir modun kullanmadığı alanların editörde gösterilmemesi, şema doğrulaması ve gereksiz runtime kaynaklarının oluşmaması.

### 6.3. `forge.fracturable`

**Amaç:** Kırılma tetiklerini, parça setlerini, bağlantı kopmasını ve ömrü yönetmek.

**Önerilen modlar:** `prefractured`, `joint-break`, `detach`, `swap-mesh`.

**Önerilen bileşen alanları:**

| Alan | Açıklama |
|---|---|
| `fractureMode` | Kırılma yöntemi |
| `threshold` | Uygun birim ve malzeme tanımıyla eşik |
| `damageAccumulation` | Birikmiş hasar ayarları |
| `fragmentAsset` | Önceden parçalanmış model referansı |
| `maxDynamicFragments` | Simüle edilecek parça üst sınırı |
| `fragmentLifetime` | Önemsiz parçalar için yaşam süresi |
| `fragmentCollision` | Parça collider türü/filtreleri |
| `persistentId` | Dünya durumuyla eşleşen sabit kimlik |
| `saveState` | Kalıcı kırılma bilgisinin saklanması |

**Kritik uygulama notu:** Modlar tüm nesneler için aynı hasar ölçüsünü paylaşmak zorunda değildir. Impact impulse, bağlantı gerilmesi, doğrudan oyun olayı ve kümülatif hasar ayrı kaynaklardır; her birinin birimi ve eşiği açık tanımlanmalıdır.

### 6.4. `forge.terrain-deformation`

**Ayrı kapsam:** Tekerlek izi, zemin sıkışması, batma, yuvarlanma direnci, lastik tutuşu ve yüzey değişiminin kaydı.

**Yasaklanması önerilen karışıklık:** Çamurda tekerlek izinin oluşmasını, rigid-body nesnelerin `forge.deformable` bileşenini çalıştırarak gerçekleştirmeye çalışmak.

**Mevcut durum:** 23 Ekim teknik raporunda oyun sırasında tekerlek kaynaklı terrain deformation **planlıdır**, uygulanmış değildir.

### 6.5. Motor / oyun katmanı ayrımı

| Forge motoru sorumluluğu | Ridgebound oyun katmanı sorumluluğu |
|---|---|
| Çarpışma/gerilim olaylarının standartlaştırılması | Hangi kargonun hassas olduğu |
| Deformasyon ve kırılma çözümleri | Görev başarısı, ödül ve ceza kuralları |
| Parça yaşam döngüsü ve kaynak temizliği | Köprü kapanınca rotanın etkilenmesi |
| Editor/asset bileşen tanımları | Hangi köprü/kaya senaryosunun kullanılacağı |
| Kalıcılık serileştirme altyapısı | Hangi hasarın görev tekrarında korunacağı |
| Performans sayaçları ve kalite profilleri | Oyuncuya gösterilecek hasar/uyarı UI'sı |

---

## 7. Olay akışı ve örnek sözleşmeler

Aşağıdaki örnekler **önerilen şema taslağıdır**; Forge'un mevcut component veya TypeScript API'si olarak kopyalanmamalıdır.

### 7.1. Darbe ile metal deformasyonu

```text
Rapier contact/impulse
    → temas verisini doğrula ve filtrele
    → lokal koordinata dönüştür
    → ilgili mesh bölgesi için displacement hesapla
    → azami deformasyon / malzeme direncini uygula
    → render buffer/normal/bounds güncelle
    → DamageEvent (gerekliyse)
    → kalıcı durum değiştiyse kayıt için işaretle
```

**Uygulama koşulu:** Rapier'dan gelen olayın tam bilgisi ve sıklığı gerçek depo API'sinde incelenmeli; doğrudan collision callback'inin her durumda impulse sunduğu varsayılmamalıdır.

### 7.2. Kırılma olayının yaşam döngüsü

```text
Contact / Stress / Gameplay Trigger
    → eşik + kümülatif hasar kontrolü
    → idempotent fracture state transition
    → sağlam modelin gizlenmesi/devreden çıkarılması
    → sınırlı sayıda dinamik parçanın etkinleştirilmesi
    → ses/VFX
    → parça uyutma/temizleme
    → persistent world state kaydı
```

**İdempotency:** Aynı kırılma olayı iki kez işlenip ikinci bir parça seti üretmemeli.

### 7.3. Örnek editör verisi (şema taslağı)

```json
{
  "component": "forge.fracturable",
  "fractureMode": "prefractured",
  "threshold": 250,
  "thresholdMetric": "impact_impulse_Ns",
  "fragmentAsset": "Assets/Props/WoodenCrate_Fractured.glb",
  "maxDynamicFragments": 8,
  "fragmentLifetimeSeconds": 12,
  "saveState": true
}
```

Bu JSON'daki adlar, birimler ve değerler **örnektir**; Forge serializer/validator sözleşmesi ve prototip ölçümleriyle netleştirilmelidir. Özellikle `250`, test edilmiş bir kırılma eşiği değildir.

### 7.4. Kalıcı durum yaklaşımı

```json
{
  "worldObjectStates": {
    "bridge-01": { "state": "damaged", "damage": 0.65 },
    "fence-07": { "state": "fractured" },
    "rock-obstacle-03": { "state": "cleared" }
  }
}
```

Bu da yalnızca kavramsal bir kayıt örneğidir. Genel Forge save şemasına eklenmeden önce versiyonlama, object ID stabilitesi, tekrar yükleme ve silinmiş asset senaryoları test edilmelidir.

---

## 8. Editör tarafında ihtiyaç duyulacak araçlar

1. **Component inspector:** Deformable/Fracturable seçimi, mod bazlı parametreler, varsayılan profiller.
2. **Asset önizleme:** Sağlam/hasarlı/kırık mesh arasında geçiş; fragment sayısını gösterme.
3. **Impact test aracı:** Belirli kuvvet/yön/konumla test darbesi uygulama.
4. **Joint / anchor görselleştirme:** Bağ noktaları ve kopma eşiklerini sahnede gösterme.
5. **Collision policy kontrolü:** Görsel deformasyon ile fizik collider stratejisini açık ayırma.
6. **Performance overlay:** Aktif soft-body sayısı, dinamik parça sayısı, contact/event sayısı, çözücü ve render update maliyeti.
7. **Persistence preview:** Deformasyon/kırılma durumlarının save/reload önizlemesi.
8. **Validation:** Eksik `fragmentAsset`, geçersiz mod, aşırı parça sayısı, hatalı component alanları ve kararsız `persistentId` için uyarı.

**Tasarım ilkesi:** Editör karmaşıklığı, özellikler modüler geldikçe artsın. Sadece shader'la sallanacak bir bayrak için joint, tetrahedral mesh veya onlarca fizik parametresi gösterilmemeli.

---

## 9. Performans ve kalite stratejisi

| Konu | İlk önerilen strateji | Doğrulama gereği |
|---|---|---|
| Rüzgâr/ot | Shader tabanlı | Görsel kalite ve instancing uyumu |
| Araç kaportası | Darbe anında yerel CPU vertex güncellemesi | Buffer güncelleme, normaller ve gölge maliyeti |
| Kumaş/branda | Önemli az sayıda nesnede CPU XPBD/Verlet | Simülasyon süresi ve collision sınırı |
| Halat | Fiziksel çekme kuvvetinden ayrılmış görsel spline | Gerilim ve görsel tutarlılık |
| Kaya/kasa kırılması | Önceden hazırlanmış az sayıda fizik parçası | Spawn hitch ve fizik step yükü |
| Uzak çevre | Sleep/culling/LOD/animasyon indirgeme | Geri etkinleştirmede tutarlı durum |
| Parçacık temizliği | Bütçe, yaşam süresi, kaynak dispose | Uzun süreli heap/VRAM eğilimi |
| Kalıcı hasar | Durum ve sınırlı olay kaydı | Save boyutu, reload tutarlılığı |
| Collider | Varsayılan proxy collider; kritik olayda kontrollü güncelleme | Oyun fiziği ile görünüm kopması |

### 9.1. Özellikle kaçınılması gerekenler

- Her yaprak, dal, halat noktası veya kıymık için bağımsız dinamik rigid body oluşturmak.
- Her kaporta göçüğünde ağır collision trimesh yeniden inşası gerçekleştirmek.
- Görsel soft-body'nin gerçekte yük/çekme fiziğini çözdüğünü varsaymak.
- WebGL2 üzerinde genel amaçlı GPU compute kolayca varmış gibi XPBD maliyetini sıfır saymak.
- Kırılmış her parçanın tüm hareket geçmişini süresiz kaydetmek.
- Render FPS ile sabit fizik adımının maliyetini aynı metrik olarak raporlamak.

### 9.2. Performans bütçesi hakkında

Burada **ölçülmüş CPU/GPU milisaniye, FPS veya RAM bütçesi verilmez**. Hedef tarayıcı/donanım, temsili sahne ve kalite profilleri onaylandıktan sonra `p50/p95/p99`, ayrı fizik-step ve deformasyon/fracture maliyeti ile bellek uzun süre ölçümleri yapılmalıdır.

---

## 10. İlk prototip test sahnesi

**Önerilen sahne adı:** `PhysicsInteractionTest`  
**Hedef:** İki temel capability'yi Ridgebound gameplay'inden bağımsız olarak kanıtlamak.

| Test ID | Test nesnesi | Beklenen | Teknik doğrulama |
|---|---|---|---|
| **D-01** | Metal panel | Kuvvete göre lokal ve kalıcı ezilme | Etki yarıçapı, sınır, mesh update, save/load |
| **D-02** | Çalı/uzun ot | Rüzgâr ve araç yaklaşımıyla geçici eğilme | Shader/instancing, geri dönüş, uzaklık LOD |
| **D-03** | Branda (opsiyonel) | Sarkma/dalgalanma | Çözücü stabilitesi, kısıt iterasyonu, collision |
| **F-01** | Ahşap kasa | Darbeyle tek sefer parçalanma | Eşik, parça limiti, cleanup, çift tetik engeli |
| **F-02** | Ahşap çit | Bölgesel kırılma/kopma | Parça collider, aktör referansları, kalıcılık |
| **H-01** | Halatla bağlı yük | Gerilme, gevşeme, kopma | Fizik ve görsel ayrımı, doğru ankraj/kuvvet |

**Sıralama:** D-01 + D-02 + F-01 ilk dalga; F-02 ikinci dalga; H-01 vinç/constraint arayüzünün netleşmesini gerektirir. D-03, ihtiyaç kanıtlanana kadar opsiyoneldir.

### 10.1. Kabul kriterleri — genel

- Aynı sabit fizik zaman adımında farklı render frekansları (ör. 30/60/144 Hz dış update) durum geçişlerini beklenmedik biçimde değiştirmiyor.
- Her kırılabilir nesne yalnız **bir kez** kırılıyor; tekrar olaylar çift spawn üretmiyor.
- Parça sayısı ve simülasyon ömrü tanımlı sınırları aşmıyor.
- Deforme olmuş mesh'lerde normal, gölge ve bounding volume bozulması gözlenmiyor.
- Görsel collider farklılığı, seçilmiş collision policy ile açıklanıyor.
- Nesne kapatılınca/sahne değiştirilince CPU ve GPU kaynakları temizleniyor.
- Kalıcı durum gerektiren vakalar save/load ve yeniden giriş sonrasında aynı mantıksal duruma dönüyor.
- Her test için fizik süresi, frame dağılımı, parça sayısı ve bellek zaman serisi tutuluyor.

### 10.2. Negatif testler

- Darbesiz veya eşik altı çarpmada yanlış kırılma olmaması.
- Çok kısa aralıkla art arda gelen darbe olaylarında aşırı deformasyon/spawn olmaması.
- Uzaklaşıp geri gelince sahne durumunun kaybolmaması.
- Eksik fragment asset durumunda kontrollü hata/fallback.
- Save dosyasında eski/eksik component alanlarında güvenli davranış.
- Uzun sürüşte ve çok sayıda çevre etkileşiminde bellek birikmemesi.

---

## 11. Geliştirme sırası ve bağımlılıklar

| Aşama | Kapsam | Çıkış kapısı |
|---|---|---|
| **0 — Repo doğrulama** | Güncel Forge/Rapier sürümü, event API'si, actor şemaları, save/validator ve performans araçları incelenir. | Güncel teknik envanter ve entegrasyon noktaları doğrulanır. |
| **1 — Ucuz görsel tepkiler** | Bitki shader'ı, lokal impact deformasyonu | D-01/D-02 görsel ve perf kabulü |
| **2 — Temel kırılma** | Prefractured kasa/çit, parça yaşam döngüsü | F-01/F-02 ve kaynak temizliği kabulü |
| **3 — Durum/kalıcılık** | Progressive Damage ortak olayları, save/load | Hasar, kırılma ve yeniden yükleme tutarlılığı |
| **4 — Kısıt tabanlı etkileşim** | Halat ve bağlantı kopması | H-01; vinç kuvvet modeli/ankraj davranışı |
| **5 — Ridgebound oyun entegrasyonu** | Araç hasarı, kargo kırılganlığı, kaya/çit/rota sonuçları | Oynanış testi: kararları anlamlı biçimde etkiliyor mu? |
| **6 — İleri fizik** | Gerekiyorsa XPBD branda, köprü çökmesi, daha gelişmiş soft-body | Somut kullanım ihtiyacı + temsili sahne performansı |

### 11.1. Öncelik matrisi — öneri

| Sıra | Özellik | Modül | Göreli geliştirme maliyeti | Oyun değeri |
|---|---|---|---|---|
| 1 | Bitki/rüzgâr/temas tepkisi | Deformable | Düşük | Yüksek |
| 2 | Kaporta/tampon ezilmesi | Deformable | Düşük–orta | Yüksek |
| 3 | Kasa/çit kırılması | Fracturable | Düşük–orta | Yüksek |
| 4 | Kaya parçalanması | Fracturable | Orta | Yüksek |
| 5 | Yük brandası | Deformable | Düşük–orta / XPBD ise daha yüksek | Orta |
| 6 | Gerilen/kopabilen halat | İki modül + winch/game physics | Orta–yüksek | Çok yüksek |
| 7 | Hassas kargo hasarı | İki modül + cargo/gameplay | Orta | Çok yüksek |
| 8 | Köprü hasarı/çökmesi | İki modül + gameplay/physics | Orta–yüksek | Çok yüksek |
| 9 | Yumuşak hacimli yük | Deformable softbody | Yüksek | Orta |
| 10 | Geniş ölçekli yıkılabilir dünya | Fracturable + world persistence | Çok yüksek | Orta |

**Kapsam notu:** Bunlar Forge motor Ar-Ge öncelikleri ve aday oyun özellikleridir. Ridgebound'un ilk oynanabilir kesitindeki **yük kütlesi/COM, teslimat döngüsü ve zemin tepkisi** çekirdek bağımlılıklarını geri plana atmamalı.

---

## 12. Açık teknik kararlar — Forge editörü inceleme gündemi

- [ ] **Q-01 — Impact verisi:** Rapier'dan hangi temas/impulse/kuvvet bilgisi hangi callback veya query ile güvenilir biçimde elde ediliyor?
- [ ] **Q-02 — Mesh sahipliği:** Deformasyonun GLTF paylaşımlı geometri/cache üzerindeki etkisi nasıl izole edilecek? Her araç/instance yanlışlıkla aynı buffer'ı değiştirmemeli.
- [ ] **Q-03 — Koordinat sistemi:** Dünya ve lokal darbe koordinatları, skinned mesh, scale/rotation dönüşümleri nasıl standardize edilecek?
- [ ] **Q-04 — Collider politikası:** Hangi nesneler `visual_only`, hangileri proxy veya sınırlı rebuild kullanacak?
- [ ] **Q-05 — Hasar metriği:** Impact impulse, kuvvet, strain ve zamanla birikmiş hasar ayrı ayrı nasıl hesaplanacak?
- [ ] **Q-06 — Kırık asset pipeline:** Fragments, collider proxy'leri ve pivot/origin tutarlılığı hangi import kurallarıyla denetlenecek?
- [ ] **Q-07 — Dinamik parça bütçesi:** Sahne ve kalite profili başına güvenli eşzamanlı parça sayısı ne?
- [ ] **Q-08 — Soft-body gereksinimi:** İlk Ridgebound içeriğinde gerçekten XPBD gerektiren bir nesne var mı, yoksa shader/kemik yeterli mi?
- [ ] **Q-09 — Halat fiziği:** Görsel halat, gerçek vinç çekiş modeli ve joint gerilmesi nasıl ayrılacak?
- [ ] **Q-10 — Persistence:** Persistent ID, hasar state, save sürümü ve bölgeler arası unload/reload nasıl tasarlanacak?
- [ ] **Q-11 — Editor UX:** Bileşenler nasıl eklenip ayarlanacak; sınır testleri inspector'dan çalıştırılabilecek mi?
- [ ] **Q-12 — Performans:** Hedef cihaz, çözünürlük, kalite profili ve kabul edilebilir ölçülen bütçe ne olacak?
- [ ] **Q-13 — Gameplay kapsamı:** Hassas kargo, köprü çökmesi, kaya kırılması ve kalıcı dünya değişimi ilk sürüme mi, ileri faza mı ait?

---

## 13. Karar önerileri ve durum tablosu

| ID | Önerilen karar | Durum |
|---|---|---|
| DF-001 | Deformable ve Fracturable iki ayrı Forge capability olarak tasarlansın. | [ÖNERİ] |
| DF-002 | Terrain deformasyonu bu iki capability'den ayrı kalsın. | [ÖNERİ — GDD teknik ilkeleriyle uyumlu] |
| DF-003 | İlk sürümde shader, lokal impact ve prefractured kırılma önce geliştirilsin. | [ÖNERİ] |
| DF-004 | Genel amaçlı real-time mesh fracture ilk faz dışında tutulsun. | [ÖNERİ] |
| DF-005 | Görsel şekil değişimi ile collision değişimi varsayılan olarak ayrıştırılsın. | [ÖNERİ] |
| DF-006 | Progressive Damage durum modeli motor/game sınırında değerlendirilsin. | [ÖNERİ] |
| DF-007 | Kalıcı kırılmalarda olay/durum tabanlı save tercih edilsin. | [ÖNERİ] |
| DF-008 | Köprü, vinç, hassas kargo ve rota değiştiren yıkım test/oynanış onayı sonrasına kalsın. | [ÖNERİ] |
| DF-009 | Her yeni mod için izole test sahnesi, performans ve save/load kapısı şart olsun. | [ÖNERİ] |

---

## 14. Sonuç ve Forge için değerlendirme talebi

Forge'da **genel amaçlı etkileşim altyapısı** oluşturmak, Ridgebound'a özel kırılma efektlerini tek tek kodlamaktan daha sürdürülebilir olacaktır. Fakat öncelik, gelişmiş soft-body fiziğini tamamlamak değil, **düşük maliyetli ve güvenilir ilk iki capability'nin** çalışmasını kanıtlamaktır.

**Forge editöründe ilk değerlendirme için önerilen çalışma paketi:**

1. Güncel repo üzerinde `forge.deformable` ve `forge.fracturable` entegrasyon noktalarının tespiti.
2. D-01 metal panel + D-02 bitki shader'ı + F-01 kırılabilir kasa prototipi.
3. Mevcut actor/asset/save/validator düzenine uygun örnek component şemasının hazırlanması.
4. Parça yaşam döngüsü, event tekrarları, collider uyumu ve performans sınırlarının test edilmesi.
5. Sonuçlara göre F-02 çit ve H-01 halat için devam kararının verilmesi.

**Önerilen başarı ölçütü:** Bu sistemler yalnızca bir nesnenin hareket etmesini/kırılmasını göstermemeli; kontrollü olmalı, ölçülebilmeli, editörde yeniden kullanılabilmeli ve uygun durumlarda kalıcı kaydedilebilmelidir.

---

## 15. Referans belgeler ve doğrulama notları

### Proje içi birincil kaynaklar

- `FORGE_OFFROAD_FORGE_TEKNIK_DURUM_RAPORU_2026-10-23.md` — Forge'un 23 Ekim 2026'da incelenmiş teknik yetenekleri, eksikleri ve test sınırları.
- `FORGE_OFFROAD_GDD_PROJE_CERCEVESI_v0.3.md` — Lojistik/taşımacılık ve izole dağ yerleşimleri kararları, oyun çerçevesi.
- `01_GAME_VISION_AND_PILLARS_v0.2.md` — Tasarım sütunları, ilk prototip ve teknik kalite ilkeleri.

### Teknoloji referansları (uygulamaya başlamadan güncellik kontrolü önerilir)

- Rapier JavaScript joint dokümantasyonu: <https://rapier.rs/docs/user_guides/javascript/joints/>
- Three.js geometry/buffer güncelleme rehberi: <https://threejs.org/manual/en/how-to-update-things.html>

### Kanıt sınıflandırması

- **[KESİN]:** Kullanıcı tarafından alınmış Ridgebound proje kararı.
- **[RAPORLA DOĞRULANDI]:** Yukarıdaki 23 Ekim teknik envanterinde test veya kod incelemesiyle desteklenen durum; bugünkü repo durumu olmayabilir.
- **[ÖNERİ]:** Bu dokümanda geliştirilen özellik, mimari, öncelik veya kural.
- **[TEST GEREKİYOR]:** Yalnız prototip ve performans/doğruluk testi sonrasında karara bağlanabilecek konu.

**Bu dokümanın sınırı:** Kaynak kodu değiştirilmedi; yeni feature, test veya benchmark çalıştırılmadı. Maliyetler nitel karşılaştırmadır; ölçüm sonucu değildir.

---

## v0.1 değişiklik kaydı — 2 Kasım 2026

- Önceki Deformable/Fracturable değerlendirmesi Forge incelemesine uygun Markdown teknik dokümana dönüştürüldü.
- Ridgebound kullanım senaryoları, bileşen önerileri, editör gereksinimleri ve ilk test planı birleştirildi.
- Onaylı oyun kararları, 23 Ekim teknik raporunun kanıt sınırları ve yeni öneriler ayrıştırıldı.
- Progressive Damage, nesne-kırılma kalıcılığı ve terrain deformasyonu sorumluluk ayrımı tanımlandı.
