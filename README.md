# Ridgebound

VS Code'da **Terminal > Run Build Task** (`Ctrl+Shift+B`), Forge'daki gibi geliştirme sunucusunu başlatıp editörü tarayıcıda açar. Oyun için **Terminal > Run Task > Open Game** seç. Sunucu zaten çalışıyorsa aynı sunucu kullanılır; bu görevlerin açtığı sunucu arka planda çalışmaya devam eder. Başlatma günlükleri `.forge/dev-server/` altındadır.

Forge ortak kaynağını kullanan bağımsız oyun projesi. P2 kabulü tamamlandı. M0 için Landscape/Gaz52, depo/kamera, pano/sözleşme, yükleme, görev HUD'u ve teslim/sonuç hazır. Depoda E → “Sarı iş panosu” ile profili seçip işi kabul edin; “Yükü araca al” ayrı işlemdir. Yeşil teslim alanında durup E ile ekranı açın ve “Teslim et” düğmesine basın. Sabit ücret bir kez eklenir; yeni iş otomatik başlamaz. R aracı düzeltir. Güncel sıra: [M0 kontrol listesi](docs/M0_CHECKLIST.md).

## Çalıştırma

Forge bağımlılıkları kendi deposunda kurulmuş olmalı. Ridgebound motor/editör kopyası ve ayrı bir motor bağımlılık kurulumu taşımaz.

```powershell
npm.cmd run check
npm.cmd run dev
```

Oyun: http://127.0.0.1:5175/ — Editör: http://127.0.0.1:5175/?editor

Başka port: `npm.cmd run dev -- --port 5185`. Geliştirme sunucusunu terminalde Ctrl+C ile kapat.

Varsayılan yerleşim `Desktop/Forge` ve `Desktop/Games/Ridgebound`. Başka bir Forge kaynağı için `FORGE_ROOT` ortam değişkenini ayarla veya Git dışında tutulan `forge.local.json` içine `{"forgeRoot":"yerel/yol"}` yaz. Göreli yollar Ridgebound köküne göredir. `tsconfig.json` IDE için varsayılan yerleşimi izler; farklı yerleşimde IDE extends yolunu da düzenle. `npm run check`, seçilen gerçek Forge kaynaklarıyla oyun ve ortak açılışı birlikte denetler.

## Sahiplik

- Oyun kodu: `src/game/`.
- Proje/sahne/asset: `public/`.
- Genel motor/editör/araç geliştirmesi: Forge deposu.
- Oyun modülü ve editör kataloğu: manifestteki `game.module` ve `game.editorCatalog` alanları.

Pano sözleşmeleri etiketli deneme içeriğidir: 500/1500 kg yük, 2500 kg sınır üstü denemesi, 2000 kg Gaz52 deneme kapasitesi ve 100 deneme kredisi ücret. Kabul otomatik yüklemez. HUD kuş uçuşu hedef mesafesi/yönü, canlı hız ve bakiye gösterir; depoda iki yolun çizgi uzunluğu karşılaştırılabilir. Teslim ekranı sonucu, hızlı kayıt/yükleme ve sürüşe dönüşü sunar. Gerçek kapasite/ekonomi, yükün fizik kütlesi/COM etkisi ve tam M0 kabulü henüz yoktur. Bağımsız build doğrulaması build kayıtlarıyla izlenir. Build ve yeniden derleme komutları aşağıdadır. Genel Forge kamera, davranış ve editör katalogları kopyalanmadan ortak kaynaktan kullanılır.

## Bağımsız build ve önizleme

```powershell
npm.cmd run build
npm.cmd run preview
npm.cmd run verify:build
```

`build`, oyun ve ortak açılışı type-check eder; yalnız bu oyunun verileriyle üretim çıktısı alır. Her başarılı build `builds/<kimlik>/dist/` altında ayrı tutulur. Önceki çıktılar silinmez. `preview`, en son doğrulanmış build'i http://127.0.0.1:4175/ adresinde açar. Geliştirme sunucusu bu çıktı için gerekli değildir.

Yayımlanacak dosyalar yalnız **`dist/` klasörünün içeriğidir**. `build-record.json` ve `inputs.json.gz` build'in yanındaki yerel kanıt dosyalarıdır; kaynak girdileri içerirler ve siteye yüklenmezler. Girdi arşivi, commit edilmemiş kaynakları da saklayan tek seferlik bir kanıttır; ikinci bir geliştirilebilir motor kaynağı değildir.

`verify:build`, bu kaydı boş bir geçici klasöre açar, Forge bağımlılıklarını kilit dosyasından önce çevrimdışı kurar ve tekrar derler. npm önbelleğinde eksik paket varsa yalnız bu durumda aynı kilit dosyasıyla eksik paketleri indirir. Orijinal build ile çıktı dosyalarının birebir aynı olup olmadığını kontrol eder. Canlı Forge kurulumu ve oyun kaynakları değiştirilmez.

Alt dizin yayını için `npm.cmd run build -- --base /ridgebound/` kullanılabilir. Önizleme aynı base yolunu kullanır. Her proje ve Forge kaynak değişikliği sonrasında yeni build ve doğrulama gerekir. Bağımsız motor sürümü yayımlanmaz.
