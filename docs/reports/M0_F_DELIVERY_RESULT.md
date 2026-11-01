# M0 F — Teslim ve sonuç

01.11.2026. F teknik dilimi tamamlandı; F kullanıcı kabulü açık.
Kullanıcının E testi: gerçek sahnede iş kabulü, yükleme ve teslim alanına ulaşma
doğrulandı. O testte teslim yapılamaması henüz bağlı olmayan F sınırıydı.

## Forge eşlemesi ve sahiplik

| İhtiyaç | Mevcut Forge kaynağı | Ridgebound bağlantısı |
|---|---|---|
| Açık eylem, canlı araç ve fiziksel menzil | `ActionMap`, `GameModeVehicles`, mevcut Vehicle session ve park yardımcıları | Yeşil alanda duran araç E ile teslim ekranını açar; onayda menzil/hız/canlı araç tekrar doğrulanır. UI payload'ından araç/nokta kimliği alınmaz. |
| Ekran/sonuç | `runtimeUiModule.ts`, `RuntimeUiPresenter`, `.ui.json`, ViewModel ve `ui-action` | `M0_Delivery.ui.json`, `ridgebound:delivery:confirm`, mevcut Back/Esc ve quick save/load eylemleri. Yeni ekran veya input altyapısı yok. |
| Teslim/tek ücret | Mevcut `transport.ts` deliver/complete geçişleri; `ScriptState.persist` | Aynı görev kaydına delivered makbuzu; ardından completed/rewardPaid/balance tek persist güncellemesi. Sonuç render'ı ücret eklemez. |
| Kayıt/restore | `saveGameModule.ts`, mevcut `flags`/quick slot | Teslim makbuzu ve tamamlanma kayıtları; delivered restore açık onayla tamamlanır, completed restore tekrar ödeme yapmaz. |

Forge kaynaklarına bu dilimde yazılmadı. Önceden açık Forge CSS ve Terrain
çalışmaları korundu. Ridgebound'da E değişiklikleri başlangıçta commit edilmemişti;
korundu ve F bağlantıları üzerlerine eklendi. Branch/commit/push yapılmadı.
Yeni authored layout alanı veya kayıt şeması yok; mevcut UI ve flags sözleşmesi kullanılır.

## Davranış

- Yeşil teslim alanında dur; E ile “Teslimatı onayla” ekranını aç. Bölgeye giriş
  ve ekranı açmak görev durumunu değiştirmez, ücret üretmez.
- “Teslim et” düğmesi açık eylemdir. Doğru iş, doğru kargo/profile id, aynı
  taşıyıcı ve doğru teslim noktası gerekir. Boş/yüklenmemiş, yanlış araç/nokta
  ve bozuk kargo reddedilir; mevcut kayıt değiştirilmez.
- Başarılı teslim önce yükü kaldırıp delivered makbuzunu mevcut hızlı kayda yazar.
  Ardından complete geçişi completed + rewardPaid + balance alanlarını birlikte
  değiştirir ve kaydeder. Sözleşmenin sabit 100 deneme kredisi bir kez eklenir.
- Sonuç ekranı kargo özetini, sözleşme ücretini, bakiyeyi ve kayıt durumunu gösterir.
  Tekrar onay, kapat/aç veya tamamlanmış kayıt restore'u ikinci ücret üretmez.
- Sonuç açıkken araç mevcut park/fren yardımcılarıyla durur; gaz/reset komutları
  sürüşe geçmez. Back/Esc aynı session ve araca döner; basılı UI tuşları bırakılana
  kadar sürüşe aktarılmaz. Kaybolan araç sessizce başka araçla değiştirilmez.
- Yük makbuzu kaydedilip complete kaydı yazılamazsa kalıcı durum delivered kalır.
  Restore ücret üretmez; teslim alanında E → “Sonucu tamamla” açık onayı bir kez
  complete yapar. Normal completed kaydı read-only sonuçtur.
- Yeni iş otomatik başlamaz. Tamamlanan demo işi tekrar sunma/yeni görev örneği
  başlatma politikası bu dilimde eklenmedi; planın açık içerik kararıdır.

## Doğrulama

- Ridgebound `npm.cmd run check`: GEÇTİ. Forge TypeScript'i değişmedi.
- `node --test tests/m0/contractBoard.test.mjs tests/m0/depotSession.test.mjs tests/m0/depot.test.mjs tests/m0/transport.test.mjs`:
  26/26 GEÇTİ. Gerçek Forge BehaviorSubsystem, Vehicle session, collector/store/restore
  modülleri kullanılır. Yeni F testleri boş/yanlış nokta/araç/bozuk kargo, açık onay,
  delivered→completed kayıtları, art arda komutlar, restore ve input/park koşullarını sınar.
- Ayrı `.forge/m0-f-validation/`, `Ridgebound F Validation`, port 5200:
  gerçek UI ile kabul/yükleme yapıldı. İlk kısa sürüş denemesi graybox engeline
  takılıp timeout oldu; başarılı rota veya tam oturum kanıtı sayılmadı.
- F'yi izole etmek için yalnız fixture aracının başlangıç pozu gerçek teslim
  alanının yanına taşındı. Gerçek UI ile oluşturulan loaded kayıt, yalnız fixture
  araç/player pozu teslim yanına uyarlanarak Forge load üzerinden yüklendi.
  Runtime özel metotlarıyla teslim/ödeme çağrılmadı; gerçek Landscape/kullanıcı
  localStorage'ına test kaydı yazılmadı. Bu tam güzergâh sürüş kabulü değildir.
- Browser boş araç onayını reddetti; bakiye 0 kaldı. Loaded kayıtla ekran açılışı
  hâlâ loaded/0 idi. Açık “Teslim et” sonrasında completed, cargo=null,
  rewardPaid=true ve balance=100 görüldü.
- Browser storage hata denemesinde yalnız completed yazımı engellendi:
  oturum completed/100, kalıcı makbuz delivered/0 kaldı; hata ekranda gösterildi.
  Sayfa reload + Forge load sonrasında delivered/0 geldi. “Sonucu tamamla” ile
  tamamlanmış kayıt 100 oldu. Tekrar onay 100'ü değiştirmedi.
- Browser sonuç kapat/aç ve completed quick save/load sonrasında bakiye 100 kaldı;
  yeni iş başlamadı. Tekrar UI onayında kalıcı completed kaydı değişmedi.
- Sonuç açıkken W/R, Back/Esc ve aynı araç kontrol edildi. Otomasyonun ekranı
  kapatır kapatmaz aynı karede E basması bir kez giriş beklemesini timeout etti;
  tuş bırakılıp normal frame aralığıyla tekrar giriş geçti. Held-key koruması atlanmadı.
- 1440×900 ve 1100×720 görsel kontrol: boş teslim hatası ve sonuç ekranı.
  Küçük görünümde sonuç paneli yaklaşık 680×392 px, tümü viewport içinde.
  F8 geliştirici telemetrisi son görsel turda kapatıldı.
- Sonuç turunda page/console/HTTP hatası yoktu; ilk açılışlardaki favicon 404'ler
  başarı kanıtına dahil edilmedi.
- Son kontrolde kullanıcı/eşzamanlı çalışma Landscape'i World Partition/cell
  düzenine taşıdı; ana layout, global map/tile ve cell dosyaları bu görevce
  yazılmadı ve korundu. Forge `src/scene/roomLayout.ts` içindeki mevcut
  `loadRoomLayout` → `mergeWorldCells` akışı bütün noktaları/modülleri zaten
  sunar. Güncel sahne bağlarını mevcut merge API'siyle kontrol eden regresyon
  eklendi; yeni loader veya motor yaması kurulmadı.
- Güncel 5175 sahnesinde ayrı browser context'inde salt okunur runtime/depo
  açılışı geçti, page error yoktu. İş kabulü/kayıt/Save Layout yapılmadı.
  Bu dönüşüm öncesindeki kullanıcı slotlarının authored entity indeksleriyle
  uyumu ayrıca G kayıt/restore incelemesinde değerlendirilmelidir.

Git dışı kanıtlar `.forge/m0-delivery/`: `qa.md`, `empty-rejected.png`,
`completed.png`, `completed-small.png`, final ekranlar ve `browser-result.json`.
Başlangıç HEAD'ler: Ridgebound `77d49a0`, Forge `995b7132`; E/F çalışma farkları
commit edilmemiştir. Yeni production build/verify-build veya tam Forge gate'i çalıştırılmadı.

## Kalan sınır

M0-09–12 teknik kanıtı vardır; F kullanıcı kabulü açık. Bu çalışma G'nin tüm
save/load/kurtarma hata koşullarını veya H tam manuel oturum/build kapanışını
tamamlamaz. Sıradaki dilim G; ardından H ve bütün M0 kabul kapısı.
