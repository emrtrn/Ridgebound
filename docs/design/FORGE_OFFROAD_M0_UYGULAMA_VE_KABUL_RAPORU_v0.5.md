# FORGE OFFROAD — M0 Uygulama ve Kabul Raporu

**Şablon sürümü:** v0.5 — sürekli geliştirilen tek Forge ortak kaynağı, Git kilometre taşı kayıtları ve ertelenmiş bağımsız motor sürüm yayımlama sistemi  
**Durum:** [DOLDURULACAK] — Bu belge bir tamamlanma veya test başarısı iddiası değildir.  
**Amaç:** Forge Offroad M0 — tek nakliye işinin uçtan uca çalışmasını ve save/load tutarlılığını kanıtlamak.  
**Kayıt ilkesi:** Gerçek uygulama ile tasarım kararını karıştırma. Kanıt yoksa `YAPILMADI / DOĞRULANMADI` yaz.  

## 1. Kullanılan kaynaklar ve öncelik

1. `FORGE_OFFROAD_ASAMA_1_KAPANIS_VE_D010_v1.0.md` — M0 kapsamı ve bağlayıcı kabul kapısı.
2. `FORGE_OFFROAD_02_CORE_GAMEPLAY_LOOP_v0.2_TOPLU_KARAR_KAYDI.md` — Güncel Aşama 2 işleyiş kararları.
3. `FORGE_OFFROAD_FORGE_TEKNIK_DURUM_RAPORU_2026-10-23.md` — Başlangıç teknik envanteri; **güncel repo ayrıca incelenmeli**.
4. `FORGE_OFFROAD_GDD_PROJE_CERCEVESI_v0.4.md` — Ana kapsam, onaylı kararlar ve sınırlar.
5. `01_GAME_VISION_AND_PILLARS_v0.4.md` — Vizyon ve dört tasarım sütunu.
6. `02_CORE_GAMEPLAY_LOOP_v0.1.md` — Eski Aşama 2 kararlarının izi; çelişkide daha güncel v0.2 toplu kayıt ve onaylı temel kararlar esas alınır.

**Repo/araç talimatları:** Varsa `AGENTS.md` ve geçerli proje/test dokümantasyonu ayrıca incelenir. Yeni geliştirilen özellikler, 23 Ekim teknik envanterinde önceden mevcut sayılmaz.

## 1A. Düzeltilmiş mimari: tek ortak kaynak, bağımsız oyun projesi — Codex için başlangıç incelemesi

**Durum:** `[KABUL EDİLEN ÇALIŞMA İLKESİ — uygulama repo incelemesine bağlı]`. Kullanıcının 23 Ekim 2026 tarihli onayıyla M0 için **tek ortak ve sürekli gelişen Forge motor/editör kaynağı** ve ayrı Offroad oyun modülü yaklaşımı benimsenmiştir. **Yeni bağımsız motor sürümü yayımlama sistemi M0 gereksinimi değildir.** Bu karar, v0.3’teki uzun ömürlü oyun-motor dalı aktarımının ve v0.4’teki zorunlu bağımsız motor release/upgrade imasının yerine geçer. Kod yerleşimi ve araç seçimi Codex incelemesi ile doğrulanacaktır; M0 oyun tasarımı kararları değişmez.

### 1A.1 Çözdüğümüz problem

Forge Offroad geliştirilirken Forge motoru **ve editörünün kaynak kodu da** geliştiriliyor. Uzun süre ayrı Forge ve Offroad motor dalları/kopyaları tutup iyileştirmeleri sonradan aktarmak; farklılaşan kopyalar, atlanan motor düzeltmeleri, kaybolan editör yetenekleri ve sürüm yükseltmede beklenmedik sonuçlar oluşturur. **Git worktree geliştirme izolasyonudur; oyun-proje bağımsızlığının veya motor sürüm yönetiminin kendisi değildir.**

**Ana kural:** Ortak Forge motoru ve editörü için **tek yetkili kaynak kodu** olmalı. Oyun, bu kodu kendi içine kopyalayarak değiştirmemeli. M0 sırasında yeni genel motor/editör işlevi geliştirmek gerekiyorsa önce bu tek ortak kaynakta değişiklik yapılır; Offroad aynı kaynak derlemesini kullanarak özelliği anında geliştirme ortamında test eder. Aynı özellik ikinci kez başka Forge kopyasına elle eklenmez.

### 1A.2 Önerilen yapı ve alternatifler

**Birincil öneri — tek depo/çalışma alanı (monorepo veya mevcut depoda buna en yakın modüler düzen):** Mevcut Forge kodu korunur; motor, editör ve Offroad oyun mantığı/kapsamı sınırları ayrılır. Aşağıdaki dizinler sadece *temsili hedef mimari* olup var oldukları iddia edilmez:

```text
forge-repo/
  packages/engine/          # Tek ortak motor kaynak kodu
  apps/editor/              # Tek ortak editör kaynak kodu
  games/forge-offroad/      # Offroad oyun mantığı, sahneler, yük/iş/ödül verisi
```

Oyun ortak modülleri yerel çalışma alanı bağımlılığıyla kullanır. Motor ve editör kaynak dosyaları **oyun klasörüne kopyalanmaz**. Bir genel editör aracı Offroad M0 çalışması sırasında eklendiğinde `apps/editor` kaynağında geliştirilir; aynı çalışma alanında Forge editörü ve oyun bütünleşik test edilir. Yeni motor özelliği için ise `packages/engine` kaynağı değiştirilir. Ortak kaynak birleştirilip test edildiğinde hem Forge editörü hem Offroad geliştirme sürümü yeni özelliği içerir.

**Alternatif — ayrı oyun Git deposu + canlı yerel motor bağımlılığı:** Gerekirse Forge motor/editör deposu ayrı kalır, Offroad deposu geliştirirken onu yerel workspace/link üzerinden kullanır; motor değişikliği **Forge deposuna** commit edilir. Bu seçenek daha fazla bağımlılık/CI koordinasyonu gerektirir; paket yayımlamak **M0 koşulu değildir**. Mevcut kod yapısı ve ekip akışına bakılmadan birincil yaklaşım yerine zorunlu ilan edilmez.

**Kısa özellik dalları / worktree:** Motor, editör ve oyunu beraber çalıştıran bir değişikliği ayrı iş dalı veya `worktree` üzerinde güvenle geliştirmek mümkündür. Ancak `feat/forge-offroad-m0` gibi uzun ömürlü, kendi motoruna sahip bir dalı bağımsız oyun mimarisi olarak kullanma. İş dalındaki ortak motor değişiklikleri aynı paylaşılan kaynak ağacına düzenli entegre edilir; aylarca sadece oyun dalında bırakılmaz. Mevcut kaydedilmemiş Forge kullanıcı değişiklikleri asla ezilmez.

### 1A.3 İki farklı zaman ölçeği — motor release zorunlu değil

1. **Aktif geliştirme (canlı ortak kaynak) `[KABUL EDİLEN İLKE]`:** Forge editörü, motoru ve Forge Offroad'un geliştirme yapısı **aynı tek ortak kaynaktan** çalışır. `ENGINE`/`EDITOR` özelliği kendi paylaşılan kaynağında, `GAME`/`CONTENT` ise oyun katmanında geliştirilir. Değişiklik Forge'da ayrıca tekrar yazılmaz. Kod incelemesi, commit ve test kanıtları tutulur. **Her motor değişikliğinde sürüm numarası artırma, bağımsız motor paketi üretme veya yayımlama YOKTUR.**
2. **Kilometre taşı kaydı `[KABUL EDİLEN İLKE]`:** M0, M1 ve M2 kabul edildiğinde, o anda test edilen **tam kaynak ağacının Git commit SHA'sı** ve varsa anlamlı Git etiketi (`tag`) ile test/build/rapor kanıtları saklanır. *Tag* zorunlu paket yayımlama değildir. Aktif geliştirmede aradaki her commit'e ayrı motor sürümü atamak gerekmez. Etiket adları Codex tarafından repo geleneğine göre önerilir; örnek adlar kesinleştirilmez.
3. **Oyun yayımlama `[KABUL EDİLEN İLKE]`:** Yayımlanan Offroad, doğrulanmış belirli bir **repo commit'i / build artefaktından** üretilir. Sonraki Forge kod değişiklikleri yayındaki build'i kendiliğinden değiştirmez. Oyun yükseltmesi gerekiyorsa güvenli bir iş dalı/kopyasında build, sahne, save/load ve regresyon testleri yapılır; kullanıcı kabul ettikten sonra yeni **oyun build'i** yayımlanır. Bunun için ayrı bir **Forge Engine v1.x release** mekanizması şart değildir.
4. **Birden fazla eşzamanlı oyun `[GELECEKTE DEĞERLENDİRİLECEK]`:** İleride bazı oyunları farklı motor durumlarında geliştirme gereksinimi gerçekten çıkarsa ayrı engine package/manifest-lock, uyumluluk matrisi, proje migration gibi sistemler ayrıca tasarlanabilir. **M0 işi olarak yapılmaz.** İlgili karar, gerçek teknik ve ürün ihtiyacına göre yeniden açılır.

**Teknik not:** Bir Git commit'i tek başına çalıştırılabilir oyunu veya veri kaybı olmadan geri dönüşü garanti etmez. Yayın/build için kullanılan bağımlılık kilidi, asset'ler, proje verisi, derleme ayarları ve save şema sürümü de kaydedilmelidir. Forge'da bunların mevcut olup olmadığı Codex tarafından incelenecek; olmayan özellik varmış gibi raporlanmayacaktır.

### 1A.4 Kod sahipliği

| Sınıf | Nerede geliştirilir? | Örnek | Geçerli kural |
|---|---|---|---|
| ENGINE | Tek ortak Forge motor kaynağı | Genel ağırlık/COM API'si, sürüş fiziği | Ayrı oyuna motor kopyası koyma |
| EDITOR | Tek ortak Forge editör kaynağı | Genel yük profili düzenleme aracı, kamera aracı | Oyuna özel editör fork'u yapma |
| GAME | Forge Offroad oyun modülü/proje klasörü | Nakliye sözleşmesi, teslimat ve ekonomi | Motor çekirdeğine oyun kurallarını gömme |
| CONTENT | Forge Offroad veri/asset klasörü | Depo, teslimat sahnesi, kargo profili | Genel Forge örnek sahnelerinin üstüne yazma |
| MIXED | ENGINE/EDITOR + GAME'de ayrıştırılmış değişiklikler | Genel kütle API'si + kargo görevi | Aynı geliştirme dalında birden çok modüle dokunabilir; commit/test/owner izi ayrı tutulur |

### 1A.5 Codex'in ilk görevi: **incele, kanıtla, tasarım öner; henüz büyük yapı değişikliği yapma**

1. `AGENTS.md`, Git repo/dal/HEAD, `git status`, worktree'ler, test komutları, mevcut oyun modülü (`src/game`, `createGameModule` gerçekten varsa), engine/editor giriş noktaları, asset/project serialization/manifest, build pipeline ve bağımlılıkları incele. Hepsi için gerçek dosya yolu ve commit göster.
2. Şu soruyu kanıtla: **Offroad geliştirme sırasında yapılan genel Forge engine/editor değişikliği, aynı kaynak ağacından Forge editörüne ve oyuna nasıl yansıyacak?** Kopyalama/elle tekrar uygulama gerekiyorsa bu akışı uygun kabul etme. M0 için bağımsız Forge release sistemi veya sürüm migrasyon özelliği inşa etme.
3. Mevcut yapı üzerinde **en küçük uygulanabilir çözümü** tasarla. Sırf örnek dizin ağacına uymak için bütün depoyu taşıma. Oyun bağımsız proje olarak saklanacak; ortak Forge kodu tek merkezde kalacak.
4. `feature branch`/`worktree`'yi yalnız güvenli deney ve gözden geçirme aracı olarak konumlandır. Uzun yaşayan ayrı motor dalını default yapma; bağımsız oyun desteğini branch kavramıyla karıştırma.
5. Derleme, editör açma, Offroad oyun yükleme ve motor/regresyon testlerinin her birini kanıtla. Kod veya test yoksa `DOĞRULANMADI` belirt. M0'ın 15 kabul maddesi aynen geçerlidir.
6. Ana Forge klasöründeki kaydedilmemiş değişiklikleri, kullanıcının sahnelerini ve takip dışı asset'leri koru. Onay almadan büyük dosya taşıma, repo bölme, branch geçmişi yeniden yazma, paketi yayımlama veya otomatik upgrade yapma.

### 1A.6 Mimari kabul kontrolü — doldurulacak

| Gereksinim | Durum ve kod kanıtı |
|---|---|
| Mevcut Forge repo/dal/HEAD ve kullanıcı değişiklikleri | [DOLDUR] |
| Engine/editor/game/content modül sınırları | [DOLDUR] |
| Tek yetkili ortak motor kaynak konumu | [DOLDUR] |
| Tek yetkili ortak editör kaynak konumu | [DOLDUR] |
| Offroad oyun dosyalarının motor kodunu çoğaltmadığı | [DOLDUR] |
| Ortak motor değişikliği Forge editöründe ve Offroad'da test edildi | [DOLDUR] |
| Build bağımlılığı / sürüm sabitleme bugünkü gerçekliği | [DOLDUR] |
| M0/M1/M2 kilometre taşını commit/test/build ile koruma yöntemi | [DOLDUR] |
| M0 başlangıç kodu ve test sonuçları | [DOLDUR] |
| Tek kaynak/sürekli geliştirme ilkesinin kullanıcı durumu | [İLKE ONAYLI; GERÇEK REPO UYGULAMASI DOĞRULANMADI] |

---

## 1B. Motor ve editör değişikliği yönetimi — Codex için düzeltilmiş protokol

**Durum:** `[KABUL EDİLEN ÇALIŞMA AKIŞI / KODDA DOĞRULANMADI]`. v0.3’teki “Offroad’a uygula → sonra Forge’a cherry-pick/merge → tekrar Offroad’a merge” döngüsü birincil çalışma modeli değildir. Uzun ömürlü motor kopyaları tutulmaz; engine/editor için tek ortak kaynak, oyun için ayrı modül sınırı korunur.

### 1B.1 Offroad için genel motor/editör özelliği gerektiğinde

1. Codex değişikliği `ENGINE / EDITOR / GAME / CONTENT` olarak sınıflandırır. Mümkünse küçük teknik görev ve ayrı test oluşturur.
2. Motor/editör özelliğini **tek ortak Forge kaynak kodunda** geliştirir. GAME tarafında yalnız API'nin kullanımı bulunur. Başka bir motor/editör klasöründe aynı kod tekrar oluşturulmaz.
3. Gerekirse kısa ömürlü iş dalı/worktree açılır; bu dalda genel motor değişikliği ve Offroad entegrasyonu beraber geliştirilebilir. İş tamamlanınca genel kod **ortak Forge kaynak ağacına** testli olarak birleştirilir. Hedef dal ve izin mevcut repo politikasına göre doğrulanır.
4. Forge genel testleri + editör UI smoke + Offroad M0 senaryo/save/load testleri çalıştırılır. Karar ve kanıtlar rapora yazılır.
5. **Her özellikte ayrı Forge motor sürümü yayımlanmaz.** Ortak kaynaktaki değişiklik, doğrulanmış Git commit'iyle izlenir. M0/M1/M2 kabulünde gerekirse tag konur; oyun yayımlanırken doğrulanmış build sabitlenir.

### 1B.2 Forge ayrı geliştirilirken

Forge ana ortak kaynakta yeni özellik commit'leri varsa Offroad'un **geliştirme** sürümü kısa aralıklarla uyumlu güncel ortak kaynaktan test edilir. İş dallarında değişiklik varsa merge/rebase uygulanabilir ancak kullanıcı dosyaları ve mevcut iş geçmişi korunur. Offroad'un **yayımlanmış build'i**, üretildiği doğrulanmış kaynak durumu ve dosyalarıyla korunur; Forge geliştirme dalındaki yeni commit'ler mevcut yayın dosyalarını kendiliğinden değiştirmez.

### 1B.3 Güncel ortak Forge kaynağıyla çalışırken: kaybolma/üzerine yazılma riski

- **Önleyici ilke:** Oyun projesinde Forge motorunun düzenlenmiş kopyası tutulmaz. Bir genel özellik, ortak Forge kaynak koduna ve test/commit kaydına girmeden tamamlanmış sayılmaz.
- Eğer Offroad dalında henüz ana ortak kaynağa entegre edilmemiş `ENGINE/EDITOR` değişikliği varsa bu `BEKLEYEN ORTAK DEĞİŞİKLİK` olarak işaretlenir. Yeni ortak Forge commit'lerini iş dalına almak, bu eksik özelliği *otomatik taşımaz*. İlgili diff/commit belirlenir, değişiklik önce ortak motor kaynağına entegre edilir ve test edilir. Git çatışması olup olmaması, semantik uyumluluğu garanti etmez.
- Ortak kod değişiklikleri güvenli iş dalında/test ortamında doğrulanır; proje ve sahne veri şemaları değişmişse veri uyumluluğu ayrıca test edilir. Eski çalışan build, kaynak commit'i, kayıt dosyası ve proje verisi korunur.
- Otomatik install/build işlemleri local motor yamalarını değiştirebileceği için `node_modules` veya oyun içine kopyalanmış runtime motorunda kalıcı düzeltme yapılmaz.
- **M0’da motor manifest/lock yükseltme sistemi zorunlu değildir.** Yeni ortak Forge commit'inin Offroad'a entegrasyonu test edilmeden iş tamamlanmış sayılmaz. Yayımlanmış Offroad'un yeni build'i ise yalnız testler ve kullanıcı kabulü sonrası değiştirilir.

### 1B.4 Örnek — genel araç yükünün kütle merkezine etkisi

- Genel araç yük-kütle/COM arayüzü = **ENGINE** kaynağında bir kez.
- Yükleme profillerini düzenleyen genel editör aracı = gerekirse **EDITOR** kaynağında bir kez.
- Sözleşmeden alınan kargonun ne zaman araca bağlanacağı = **GAME** katmanında.
- Depodaki yük prefab ve görev verisi = **CONTENT** katmanında.

Bunlar aynı geliştirme dalında birlikte test edilebilir. Forge'un ortak kod tabanı geliştirilmeye devam ettiğinden engine/editor özelliği aynı kaynaktadır; Offroad için ikinci kez manuel olarak eklenmez. Ayrı motor release üretmek gerekmez.

### 1B.5 Her ortak geliştirme ve sürüm geçişi için kayıt — doldurulacak

| Alan | Değer |
|---|---|
| Teknik görev ve sınıf (ENGINE/EDITOR/GAME/CONTENT) | [DOLDUR] |
| Ortak kaynak dosyaları ve commit(ler)i | [DOLDUR] |
| Oyun tarafındaki API kullanımı ve commit(ler)i | [DOLDUR] |
| Forge genel test sonucu | [DOLDUR] |
| Forge editör test sonucu | [DOLDUR] |
| Offroad uçtan uca test sonucu | [DOLDUR] |
| Ortak kaynağa entegre mi? | [EVET / HAYIR / BEKLİYOR] |
| Çalışılan Forge ortak repo commit'i / M0-M1-M2 tag'i (varsa) | [DOLDUR] |
| Offroad test veya yayın build'inin repo commit'i ve derleme kanıtı | [DOLDUR / HENÜZ YOK] |
| Proje verisi migrasyonu gerekiyor mu? | [EVET / HAYIR / İNCELENMEDİ] |
| Geri alma için korunan sürüm/kopya | [DOLDUR] |
| Kullanıcı onayı gereken mimari ya da upgrade kararı | [DOLDUR] |

**Mimari kapanış ölçütü:** Ortak özellik yalnız bir kaynakta bulunur; Forge editor ve Offroad aynı özelliği ortak kaynaktan tüketir; geliştirme ve yayın modları gerektiği kadar ayrı test edilir. **Bağımsız motor release, paket, proje-upgrade ve migration sistemi M0 kapsamına alınmaz** ve mevcut Forge'da hazır kabul edilmez.

---

## 1C. M0 için sürümleme ve Codex uygulama talimatı — v0.5

**[KABUL EDİLEN ÇALIŞMA İLKESİ]** Forge sürekli geliştirilen ortak motor/editördür. Forge Offroad ayrı oyun katmanıdır. **M0, M1 veya M2 sırasında Forge motoruna bağımsız `v0.x/v1.x` sürümü çıkarma, paket kayıt sistemi kurma, motor kopyalama veya otomatik proje yükseltme sistemi geliştirme işi açma.**

### 1C.1 Tek geliştirme akışı

1. Mevcut repo mimarisini ve temiz/korunacak kullanıcı değişikliklerini oku; `AGENTS.md` ile mevcut kod yerleşimine uy. Örnek `packages/...` dizinlerini zorla oluşturma.
2. Her ihtiyacı `ENGINE`, `EDITOR`, `GAME`, `CONTENT` olarak sınıflandır. Genel Forge geliştirmesini **tek ortak kaynakta**, oyunun özel davranışını Offroad katmanında uygula.
3. Özellikle `ENGINE`/`EDITOR` değişikliğinde Forge ve Offroad entegrasyon testlerini aynı çalışma sonunda yap; ortak özelliğin oyun içinde kopya implementasyonu bulunmasın.
4. Kısa süreli çalışma dalı veya worktree kullanılabilir; **uzun süre ayrı motor kopyası tutulmaz**, geliştirme tamamlandıkça onaylı ortak kod çizgisine entegre edilir. `merge`, `rebase`, `push`, silme veya geçmiş değiştirme işlemlerinde kullanıcı onayını ve repo talimatlarını gözet.
5. M0, M1, M2 kabulünde test edilen commit SHA'sı, test raporu, build ve gerekli asset/proje verilerini birlikte kaydet; gerekiyorsa anlamlı bir Git tag öner. **Tag koymak Forge Engine sürümü yayımlamak değildir.**
6. Offroad yayımlandığında kullanılan oyun build'i ve kaynak commit'ini sakla. Sonraki Forge değişiklikleri önceki yayımlanmış dosyaların üzerine otomatik yazılmamalı. Save veri şeması değişirse gerekli uyumluluk ayrıca ele alınmalı.
7. Gelecekte ikinci oyun, farklı motor commit'leri veya bağımsız motor paketleri gerçekten ihtiyaç olursa yeni mimari değerlendirme iste; şimdi bu altyapıyı inşa etme.

### 1C.2 Sürüm kaydı — doldurulacak

| Kilometre taşı | Repo commit SHA | Git tag (varsa) | Test kanıtı | Build/proje/asset referansı | Durum |
|---|---|---|---|---|---|
| M0 | [DOLDUR] | [YOK / DOLDUR] | [DOLDUR] | [DOLDUR] | [BEKLEMEDE] |
| M1 | [DOLDUR] | [YOK / DOLDUR] | [DOLDUR] | [DOLDUR] | [BEKLEMEDE] |
| M2 | [DOLDUR] | [YOK / DOLDUR] | [DOLDUR] | [DOLDUR] | [BEKLEMEDE] |
| İlk Offroad oyun yayını (yapılırsa) | [DOLDUR] | [YOK / DOLDUR] | [DOLDUR] | [DOLDUR] | [BEKLEMEDE] |

**Yürütme sınırı:** Bu belge tasarım/uygulama talimatıdır; Codex'in mevcut Forge kodunu incelemiş olduğunu, bir motor sürüm sistemi kurulduğunu veya M0 testlerinin geçtiğini iddia etmez.

---

## 2. Oturum ve sürüm bilgileri

| Alan | Kayıt |
|---|---|
| Rapor tarihi | [GG.AA.YYYY] |
| Hazırlayan | [Kişi / Codex ajanı] |
| Tek yetkili Forge repo / ortak kaynak commit | [Yazılacak] |
| Offroad M0 çalışma konumu / geçici iş dalı varsa | [Yazılacak] |
| GAME / ENGINE / EDITOR / CONTENT değişiklik listesi | [Yazılacak] |
| Forge ortak kaynak geliştirme commit'i | [Yazılacak] |
| M0/M1/M2 test edilmiş Git tag/commit (varsa) | [Yazılacak / Henüz yok] |
| Başlangıç commit | [Yazılacak] |
| Test edilen commit/build | [Yazılacak] |
| Tarayıcı / işletim sistemi / cihaz | [Yazılacak] |
| Test sahnesi / araç prefabı | [Yazılacak] |
| Kullanılan yük profilleri | [Ad / kütle, yalnız gerçekten tanımlanmışsa] |
| Raporun genel durumu | [BAŞLANMADI / DEVAM EDİYOR / KABUL ADAYI / KABUL / RED] |

## 3. M0 sınırı — değiştirilmemeli

**Kapsamda:** Tek sürülebilir nakliye aracı, bir başlangıç deposu, bir teslimat noktası, bir nakliye işi, yük alma → taşıma → teslim etme → sonuç/ödül geri bildirimi; hafif ve ağır yük profilleri için veri; görev/yük/durum HUD'u; görev-kargo-tamamlanma durumlarının save/load ile korunması; ödülün yalnız bir kez işlenmesi.

**Aşama 2 kararlarına bağlı M0 etkileşim hedefleri:** Depo etkileşiminden yönetim kamerasına geçme; fiziksel iş panosundan sözleşme; kısa lojistik özet ve açılabilir ayrıntılar; tek aktif iş; iş kabulü ile yüklemeyi ayırma; yük alma noktasında açık yükleme etkileşimi; nominal kg kapasitesine göre aşırı yükü engelleme; doğru noktada doğru yükün açık teslimi; sürüşe dönme; güvenilir yeniden deneme. Bu maddeler henüz yapılmış sayılmaz.

**M0'da fizik kabulü olarak beklenmeyenler:** Boş/hafif/ağır yükün gerçek fizik davranış farkı (M1); üç zemin ve iki rotanın ölçülebilir oynanış farkı (M1); tekerlek izi, batma/direnç ve deformasyon (M2). İki rota gösteriminin tam ürün kalitesi ve sayısal mesafeleri, M1 doğrulamasından ayrı değerlendirilmelidir.

**İlk dilim kapsam dışı:** FPS karakter, vinç/römork, çoklu aktif sözleşme, gelişmiş hasar/yük düşmesi, karmaşık ekonomi ve büyük kesintisiz dünya.

## 4. Başlangıç teknik boşluk analizi — KODDAN DOĞRULA

| Alan | Eski teknik rapordaki durum | Güncel kod kanıtı (dosya/fonksiyon/test) | Gerekli yeni geliştirme | Durum |
|---|---|---|---|---|
| Araç sürüşü | Temel sürüş çalışıyor/testli | [Doldur] | [Varsa] | [ ] |
| Depo modu ve hibrit kamera | Hazır depo akışı doğrulanmadı | [Doldur] | [Doldur] | [ ] |
| İş panosu ve sözleşme UI | Hazır nakliye sözleşmesi yok | [Doldur] | [Doldur] | [ ] |
| Tek aktif iş ve durum geçişleri | Genel objective altyapısı var, nakliye akışı yok | [Doldur] | [Doldur] | [ ] |
| Kargo kimliği/yük alma/teslim | Hazır sistem yok | [Doldur] | [Doldur] | [ ] |
| Nominal kg kapasitesi | Geçerli yük kapasitesi sistemi doğrulanmadı | [Doldur] | [Doldur] | [ ] |
| HUD ve yön bilgisi | Genel UI/debug altyapısı var | [Doldur] | [Doldur] | [ ] |
| Ödül ve çift ödeme koruması | Hazır nakliye ödül akışı yok | [Doldur] | [Doldur] | [ ] |
| Görev/kargo/ödül save/load | Genel save temeli var; kargo/ödül sözleşmesi yok | [Doldur] | [Doldur] | [ ] |
| Yeniden deneme / iptal | Nakliye özel akış doğrulanmadı | [Doldur] | [Doldur] | [ ] |

> Teknik raporun incelenen commit'i `84ff7cf877cf2338a54598afb9936cf291656c11` idi. Güncel repo daha ileride olabilir; gerçek kodu kontrol etmeden bu satırları güncel sonuç sayma.

## 5. Uygulama günlüğü

Her bağımsız iş tamamlandığında bir satır eklenir. GDD kararlarını doğrudan ve ayrıştırmadan tek büyük kod görevine dönüştürme.

| Tarih | Katman (GAME/ENGINE/EDITOR/CONTENT) + teknik iş | Değişen dosyalar | Testler | Sonuç | Bilinen açık |
|---|---|---|---|---|---|
| [Tarih] | [Katman + iş] | [Yollar] | [Test adları ve sonuç] | [Geçti/Kaldı] | [Açık] |

## 6. M0 kabul kontrol listesi

Durum her satırda `GEÇTİ / KALDI / TEST EDİLMEDİ` olmalı; **kanıt** olarak test adı, kısa video, log veya ekran görüntüsü yolu eklenmeli.

| ID | Kabul davranışı | Durum | Kanıt / not |
|---|---|---|---|
| M0-01 | Bir araç sürülür; tek depo, tek teslimat ve tek iş sahnede tanımlıdır | TEST EDİLMEDİ | [ ] |
| M0-02 | Depo etkileşim noktasından yönetim görünümü ve iş panosu açılır; sürüşe geri dönülür | TEST EDİLMEDİ | [ ] |
| M0-03 | Sözleşme özeti onaylı alanları gösterir; ayrıntılar isteğe bağlı açılır | TEST EDİLMEDİ | [ ] |
| M0-04 | İşi açık kabul etme durum değiştirir; iş kabulü otomatik yükleme yapmaz | TEST EDİLMEDİ | [ ] |
| M0-05 | Aynı anda ikinci aktif iş alınamaz; yükleme öncesi iptal sınanır | TEST EDİLMEDİ | [ ] |
| M0-06 | Hafif/ağır veri profilleri vardır; nominal kapasiteyi aşan yük yüklenmez | TEST EDİLMEDİ | [ ] |
| M0-07 | Yük yalnız doğru yük alma noktasındaki açık etkileşimle alınır; kargo kimliği korunur | TEST EDİLMEDİ | [ ] |
| M0-08 | Görev, hedef, yük ve teslim durumu HUD'da anlaşılır | TEST EDİLMEDİ | [ ] |
| M0-09 | Yanlış konum / yanlış yük / boş araç teslimatı kabul edilmez | TEST EDİLMEDİ | [ ] |
| M0-10 | Doğru yük doğru noktada açık etkileşimle teslim edilir, iş tamamlanır | TEST EDİLMEDİ | [ ] |
| M0-11 | Başarılı iş için sabit sözleşme ücreti ve sonuç geri bildirimi oluşur | TEST EDİLMEDİ | [ ] |
| M0-12 | Tekrar etkileşim, save/load veya restart ödülü ikinci kez vermez | TEST EDİLMEDİ | [ ] |
| M0-13 | İşin kabul/yüklenme/teslim/tamamlanma durumlarında save/load tutarlı çalışır | TEST EDİLMEDİ | [ ] |
| M0-14 | Saplanma/hata durumunda yeniden deneme görev ve kargo bilgisini bozmadan işler | TEST EDİLMEDİ | [ ] |
| M0-15 | Tam nakliye oturumu manuel oynanarak tamamlanır; gözlenen süre kaydedilir | TEST EDİLMEDİ | [ ] |

## 7. Save/load ve idempotency senaryoları (kritik)

| Senaryo | Beklenen | Durum | Kanıt |
|---|---|---|---|
| İş kabulü sonrası reload | Aktif iş geri gelir, yük otomatik alınmış sayılmaz | TEST EDİLMEDİ | [ ] |
| Yük alındıktan sonra reload | Doğru iş ve kargo doğru statüde kalır | TEST EDİLMEDİ | [ ] |
| Teslim et etkileşimine art arda basma | Tek teslim, tek ücret | TEST EDİLMEDİ | [ ] |
| Teslimden sonra reload | İş tamamlanmış kalır, ödül ikinci kez eklenmez | TEST EDİLMEDİ | [ ] |
| Yanlış teslim konumu | Görev tamamlanmaz, ödül verilmez | TEST EDİLMEDİ | [ ] |
| Hatalı/eksik kargo kimliği | İş tamamlanmaz | TEST EDİLMEDİ | [ ] |
| Yeniden deneme / reset | Yük ve iş durumu tasarlanmış güvenli noktaya döner; çift ödül oluşmaz | TEST EDİLMEDİ | [ ] |

## 8. Çalıştırılan testler ve performans gözlemleri

- **Komutlar:** [Her komutu aynen yaz]
- **Unit/integration sonuçları:** [Örn. geçen/kalan test ve adları; uydurma]
- **Browser smoke sonuçları:** [Sahne, tarayıcı, otomasyon, sonuç]
- **Manuel oyun testi:** [Adımlar, süre, tekrar sayısı, gözlenen sorunlar]
- **FPS / kare süresi / fizik maliyeti (ölçüldüyse):** [Sayı, cihaz ve metodoloji; ölçülmediyse “ölçülmedi”]
- **Kanıt dosyaları:** [Log / görüntü / video yolları]
- **Test dışı bırakılanlar ve nedenleri:** [Doldur]

## 9. Açık sorunlar ve tasarım/teknik ayrımı

| ID | Bulgu veya engel | Tür: HATA / EKSİK ÖZELLİK / AÇIK TASARIM / TEST | Etki | Sorumlu / sıradaki adım |
|---|---|---|---|---|
| [ID] | [Somut bulgu] | [Tür] | [Etkisi] | [Adım] |

**Kural:** Kod ajanı, kullanıcı onayı gerektiren yeni GDD kararlarını kendi kendine `[KESİN]` yapmaz. Teknik deneme için seçilen geçici değerler `[TEST DEĞERİ]` olarak etiketlenir.

## 10. Karar ve kapanış

- **Forge/Offroad ayrımının kod incelemesi:** [UYGUN / DÜZELTME GEREKİYOR / DOĞRULANMADI]
- **Ortak motor/editör kaynak tekilliği:** [DOĞRULANDI / AYRI KOPYA RİSKİ / DOĞRULANMADI]
- **Bekleyen ENGINE/EDITOR değişiklikleri ve entegrasyon durumu:** [YOK / ID+COMMIT / DOĞRULANMADI]
- **M0 geçici iş dalı/worktree güvenliği (varsa):** [DOĞRULANDI / DOĞRULANMADI]
- **Motor release/paket sistemi M0 kapsamı dışında bırakıldı mı?:** [EVET / HAYIR / DOĞRULANMADI]
- **M0 kabul commit/test/build kaydı:** [DOLDUR / HENÜZ YOK]
- **M0 teknik uygulama durumu:** [BAŞLANMADI / KISMİ / TAMAMLANDI]
- **M0 kabul kararı:** [KABUL / REVİZYON / BEKLEMEDE]
- **Geçmeyen zorunlu kabul maddeleri:** [ID listesi]
- **Kanıtı yetersiz kalan maddeler:** [ID listesi]
- **M1'e geçişi engelleyen noktalar:** [Liste]
- **Son değerlendiren kişi ve tarih:** [Ad / tarih]

**Kapanış ilkesi:** Bir özellik için kodun var olması yetmez; ilgili manuel/otomatik kabul kanıtı da rapora işlenmelidir. `M0 [KABUL]` yalnız M0'ın tamamlandığı anlamına gelir; **ilk oynanabilir sürüm M0 + M1 + M2** tamamlandığında kabul edilir.

---

## v0.2 değişiklik kaydı — 23 Ekim 2026

- Önceki konuşmada önerilen **Forge ortak motor + ayrı Forge Offroad oyun projesi/modülü** ilkesi teknik rapora açıkça işlendi. Bu, Aşama 1 GDD kararlarını değiştirmez.
- M0 için ayrı Git dalı/worktree **çalışma önerisi** eklendi; kalıcı motor fork'u mevcut aşamada önerilmiyor.
- Codex başlangıç incelemesi, kullanıcı dosyalarını koruma kuralı, ana motor/oyun ayrımı ve uygulama kanıt alanları eklendi.
- v0.1 kabul maddeleri ve test tabloları korunmuştur; hiçbir uygulama/test sonucu doldurulmamıştır.

---

## v0.4 değişiklik kaydı — 23 Ekim 2026 (tarihsel kayıt; v0.5 tarafından güncellendi)

- Kullanıcının eşzamanlı motor/editör/oyun geliştirme ve sürüm yükseltmede özellik kaybı itirazıyla v0.3 önerisi yeniden değerlendirildi.
- **Uzun ömürlü Offroad motor dalından Forge'a sonradan elle değişiklik taşıma, varsayılan mimari olarak geri çekildi.** Ayrı worktree yalnız kısa ömürlü deney/izolasyon aracı.
- Önerilen yeni mimari: bir ortak Forge engine/editor kaynak ağacı, oyun katmanının ayrı modül/proje olması, M0 dev aşamasında canlı ortak kaynak kullanımı, yayın aşamasında sabit motor sürümü/commit'i.
- Unreal benzeri proje yükseltme modeli hedef olarak korundu; mevcut Forge'da paket/manifest/migrasyon varmış gibi varsayılmadı.
- Codex'in repo incelemesi ve mimari onay önkoşulu eklendi. Kullanıcı **henüz nihai mimariyi onaylamadığı** için bu bölüm `[ÖNERİ]` durumundadır.
- M0-01..M0-15, mevcut oyun kararları, test ve save/load kabul koşulları değiştirilmedi.


---

## v0.5 değişiklik kaydı — 23 Ekim 2026

- Kullanıcının onayıyla **M0 sırasında bağımsız Forge motor sürümü/release üretme gereksinimi kaldırıldı.** Motor/editör kodu aynı tek yetkili kaynakta oyun geliştirme ile beraber güncellenir.
- M0, M1 ve M2 kabulünde Git SHA, isteğe bağlı tag, test ve build/asset kanıtı kaydı getirildi. Git tag **motor paketi yayımlama değildir**.
- Yayınlanmış oyun build'i ile sürekli güncellenen Forge geliştirme kaynağı açıkça ayrıldı; önceki build'in kendiliğinden değişmeyeceği ve yeni build için test gerektiği belirtildi.
- Bağımsız motor paket sürümleme, proje manifest/lock ve otomatik yükseltme/migrasyon sistemi **[ERTELENDİ]**; ileride çoklu oyun veya farklı motor tabanları gerçekten gerektirirse yeniden değerlendirilecek.
- v0.4'ün zorunlu sürüm yükseltme ve kullanıcıdan onay bekleyen ilke ifadeleri düzenlendi. **Teknik uygulama biçimi yine mevcut Forge kod incelemesine bağlıdır.**
- M0-01..M0-15 kabul listesi, nakliye GDD kararları ve save/load test senaryoları değiştirilmedi; hiçbir test sonucu varmış gibi doldurulmadı.
