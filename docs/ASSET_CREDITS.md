# Asset kaynakları

P1-B prototip sahnesi yalnız Forge'un kodla üretilen küp geometrisini kullanıyordu.
Three.js/Rapier ve diğer ortak bağımlılıklar Forge deposundaki kilit dosyasıyla yönetilir.

## M0 B içerikleri — 01.11.2026

14 asset seçili Forge `public/assets/manifest.json` metadata'sı korunarak alındı.
Dosyalar aynı göreli yollarındadır; motor/editör kaynağı kopyalanmadı.

| İçerik | Kaynak ve kayıt |
|---|---|
| Gaz-52 Base, GLB/actor/vehicle | Vebis_V_stolb_GT, Sketchfab: https://sketchfab.com/3d-models/gaz-52-base-67e1d6c4ebb64c25ab8f34cf17697a49 ; kaynak manifest lisansı CC-BY-4.0. Model Forge'daki haliyle aktarıldı. |
| Engine Loop Placeholder | Forge Starter Content, Project-local placeholder; replace before distribution if needed. |
| Grass Material + diffuse/normal | `starter-mat-grass`, `t-ground-grass-d`, `t-ground-grass-n`; kaynak/lisans bilgileri manifestte korunur. |
| Earth and Scree + base color | `lt-earth`, `lt-earth-bc`; kaynak ThreeAges/Imagen aday dokusu ve kabul kaydı manifestte korunur. |
| Weathered Mountain Rock + diffuse | `lt-rock`, `t-rock-basalt-d`; kaynak/lisans bilgileri manifestte korunur. |
| Wet Mud + base color/roughness | `lt-wet-mud`, `lt-wet-mud-bc`, `lt-wet-mud-roughness`; dokular kaynak manifestte OpenAI image_gen / AI-generated project asset olarak kayıtlıdır. |

Materyal dosyasının lisans alanı, kullandığı dokunun ayrı kaynak kaydını değiştirmez.
Graybox binalar, parseller ve işaretler Forge primitive geometrileridir.

## M0 C arayüzleri

`assets/UI/M0_Depot.ui.json` ve `M0_DepotHUD.ui.json` Ridgebound için oluşturulan
proje arayüz verileridir; mevcut Forge UI renderer/capability'si tarafından kullanılır.
