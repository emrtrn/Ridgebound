# Ridgebound agent yönergeleri

Ridgebound, mevcut Forge motor/editör kaynağını kullanan bağımsız oyun
projesidir. Bu dosya Codex ve Claude için ortak çalışma sözleşmesidir.

## Her özellikte önce Forge karşılığını bul

- Her uygulama görevinde önce `docs/FORGE_INTEGRATION.md`, `README.md` ve
  `docs/GDD.md` dosyalarını oku; GDD'nin ilgili tasarım kaynağına git.
- Bu kural bütün özellik isteklerinde geçerlidir: AI/navigasyon, fizik, araç,
  karakter, kamera, etkileşim, animasyon, ses/VFX, UI, kayıt, terrain ve editör
  araçları dahil. Kullanıcının her istekte "Forge'u kullan" demesi gerekmez.
- Uygulamadan önce isteği mevcut Forge yeteneklerine eşleştir. Forge kodunda,
  editöründe, runtime modüllerinde, örneklerinde ve testlerinde karşılığını `rg`
  ile araştır; ilgili uygulamayı oku. Kaynak haritasında listelenmemesi veya
  Ridgebound klasöründe bulunmaması, sistemin mevcut olmadığına kanıt değildir.
- Kısa bir uygulama eşlemesi ver: ihtiyaç; mevcut Forge sistemi ve kaynak yolu;
  gereken Ridgebound veri/bağlantısı; varsa kanıtlanmış genel eksik ve doğru
  değişiklik deposu. Bu rutin adım ayrıca onay bekleme gerekçesi değildir.
- Öncelik sırası: mevcut editör/veriyle kur; mevcut API veya bileşenle birleştir;
  gerekirse genel Forge mekanizmasını genişlet; yalnız oyuna özgü kuralı burada yaz.
- Mevcut Forge özelliğinin yeni bir uygulamasını Ridgebound'da kurma. Eksik
  yalnız içerik, bileşen ayarı veya capability bağlantısıysa bunu oyun projesinde
  tamamla; altyapıyı tekrar yazma. Genel sistem eksiği/hatası Forge'da giderilir.
- Örneğin AI yol bulma/patrol ihtiyacında mevcut Forge AI, Recast navigasyon,
  path following ve karar sistemi kullanılır; Ridgebound'da NPC/rota/hedef ve
  davranış verileri tanımlanır. Araç da bu genel kuralın başka bir örneğidir.
- Mevcut sistemin kullanılabilirliğini dosya adına bakarak varsayma; seçili oyun
  modülü/kataloğuna bağlandığını ve gereken asset/verilerin oyunda bulunduğunu doğrula.
- Forge motor/editörünü, bağımlılıklarını veya genel alt sistemleri Ridgebound'a
  kopyalama. Paralel navigasyon/AI, fizik, scene loader, editör, save altyapısı
  veya motor yaması kurma. Yeni bir genel sistem ancak mevcut çözümün olmadığı
  veya ihtiyacı karşılamadığı kaynak incelemesiyle gösterilince değerlendirilir;
  yeri Forge'dur. Büyük mimari değişikliği veya sistem değişimini ayrı öner.

## İki depo ve doğru değişiklik yeri

- Ridgebound: bu depo (`C:/Users/emret/Desktop/Games/Ridgebound`).
- Varsayılan Forge: `C:/Users/emret/Desktop/Forge` (`../../Forge`). Gerçek seçim
  `FORGE_ROOT`, sonra `forge.local.json` içindeki `forgeRoot`, sonra varsayılan
  yol sırasındadır; `tools/forge.mjs` ile doğrula. Yerel yolları runtime verisine yazma.
- Motor, genel editör/UI, fizik, ortak runtime ve araç düzeltmeleri doğrudan
  seçili Forge deposunun gerçek kaynaklarında yapılır. Kullanıcının ayrıca Forge
  penceresi açması gerekmez. Önce Forge `AGENTS.md` ve ilgili mimari sözleşmeyi oku;
  Claude ayrıca Forge `CLAUDE.md` yönergelerini oku.
- Oyun kuralları, görev/kargo/ekonomi/HUD ve oyun kayıt şeması Ridgebound
  `src/game/` içinde; asset, actor, vehicle, sahne ve sidecar verisi `public/`
  içinde; tasarım belgeleri `docs/` içinde kalır.
- Forge'a yazma erişimi yoksa gereken dizin erişimini bildir/iste. Erişim
  sorununu oyun içinde motor kopyası veya alternatif uygulama yazarak aşma.
- Çalışma öncesi iki deponun Git durumunu kontrol et; eşzamanlı çalışmaları koru.
  Genel değişikliği Forge'da, oyun değişikliğini Ridgebound'da ayrı raporla.
  Açık talimat olmadan branch/commit/push/merge/yayın yapma. Fork sync aracını kullanma.

## Girişler, kayıt ve doğrulama

- `public/project.3dgame.json` içindeki `game.module` ve `game.editorCatalog`
  bu oyunun girişlerini seçer. Mevcut common module/catalog bileşimini koru.
- Ridgebound komutları: `npm.cmd run check`, `npm.cmd run dev`,
  `npm.cmd run build`, `npm.cmd run preview`, `npm.cmd run verify:build`.
- TypeScript değişikliğinde Ridgebound `npm.cmd run check` çalıştır. Forge
  TypeScript'i değiştiyse Forge'da ayrıca `npx.cmd tsc --noEmit` çalıştır.
  İlgili regresyon testlerini seç; genel motor/runtime değişikliğinde uygun
  Forge gate'ini (`test:engine`, `build:verify`) çalıştır. Aynı kaynak için geçmiş
  kanıtı kontrol et; gerekçesiz tekrarlama. Kullanıcının açık test talimatı önceliklidir.
- Editör/runtime etkileşimlerini Ridgebound üzerinden kontrol et; önemli UI,
  render veya picking değişikliklerinde Playwright kullan. Otomatik testleri ve
  kullanıcı görsel/oynanış kabulünü ayrı raporla. Kaynak değişince eski production
  artifact değişmez; yeni çıktı için yeniden build gerekir.
- Save/autosave, import, create, rename/delete ve sidecar işlemleri seçili
  proje kökünde kalır; geçersiz seçim Forge public alanına geri düşmez. Yeni
  kayıt alanlarının Forge validator/normalizer allowlist'lerini kontrol et.
- Gerçek kullanıcı sahnelerini otomatik test fixture'ı yapma; geçici bağımsız
  projeler kullan. Bir Forge örneğini Ridgebound'a uyarlamak gerekiyorsa yalnız
  gereken içeriği açıkça seç; Forge örnek/aktif sahnesinin üstüne kaydetme.
- Security taramasını kendiliğinden başlatma; bu iş akışında kullanıcı istemedi.

## Kapsam

P2 teknik ve kullanıcı kabulü tamamlandı. Bu, M0 nakliye/kargo/teslim/ödül ve
oyun kayıt modelinin uygulandığı anlamına gelmez. M0'a veya başka bir oyun
özelliğine yalnız kullanıcının verdiği görev kapsamında başla. Yönerge yazmak
oyun mekaniği geliştirme veya commit/push yetkisi vermez.
