# Ridgebound ve Forge: mevcut sistemleri kullanma rehberi

Bu belge agent için kısa bir kaynak haritasıdır. Özellik varlığını, güncel
sözleşmeyi ve Ridgebound'a bağlantısını ilgili kod/testlerden doğrula; bu liste
tam ürün envanteri veya her oyun için kabul raporu değildir. **Her yeni özellik
isteğinde önce Forge'un bunu nasıl karşıladığını araştır.** Bu kural aşağıdaki
liste ve örneklerle sınırlı değildir. Kullanıcının sistem adını bilmesi veya
mevcut altyapıyı kullanmayı tekrar istemesi gerekmez. İlgili kaynaklar değişirse
haritayı aynı görev kapsamında güncelle.

## Kaynak seçimi ve sahiplik

Forge varsayılanı `C:/Users/emret/Desktop/Forge`; Ridgebound kökünden
`../../Forge`. `tools/forge.mjs`, önce `FORGE_ROOT`, sonra Git dışı
`forge.local.json` içindeki `forgeRoot` ayarını kullanır. Aşağıdaki **Forge
yolları bu seçili köke göredir**; başka bir kaynağı yanlışlıkla düzenleme.

Forge'da başlangıç referansları:

- `AGENTS.md`; Claude için ayrıca `CLAUDE.md`.
- `docs/architecture/ARCHITECTURE.md`: katmanlar ve sahiplik.
- `docs/architecture/CONTENT_LOADING_CONTRACT.md`: içerik yükleme sözleşmesi.
- `docs/architecture/SAVE_GAME_CONTRACT.md`: genel oyun kayıt sözleşmesi.
- `docs/planned/FORGE_GAME_PROJECT_WORKFLOW.md`: Model 2 ortak kaynak akışı.
- `docs/reports/RIDGEBOUND_P2_ACCEPTANCE_REPORT.md`: teknik ve kullanıcı kabulü.

Ridgebound girişleri `src/game/gameModule.ts` ve `src/game/editorCatalog.ts`;
manifestteki `game.module` / `game.editorCatalog` ile seçilir. Bugünkü modül ve
katalog Forge'un ortak modül/kataloğunu compose eder. Forge ortak kaynaklarına
erişim için mevcut `@/` ve `@engine/` alias'larını kullan; bunlar Ridgebound'a
motor kopyalama talimatı değildir. Oyun kaynakları editör katmanını import etmez.

## Mevcut sistemler için ilk bakılacak yerler

| İhtiyaç | Forge'daki kaynaklar | Ridgebound'da yapılacak iş |
|---|---|---|
| AI yol bulma, navmesh ve yol izleme | `engine/navigation/recastNavMesh.ts`, `recastPlanner.ts`, `navigationTypes.ts`, `navAgentProfile.ts`, `localAvoidance.ts`; `src/scene/capabilities/aiModule.ts` | Mevcut Recast/Detour ve path following altyapısını kullan; oyun sahnesi, NPC profili, navigasyon alanı ve hedef/rota verisini tanımla. |
| AI kararları, patrol, Behavior Tree/StateTree | `engine/ai/aiSubsystem.ts`, `behaviorRunner.ts`, `stateTreeRunner.ts`, `queryRunner.ts`, `targetPoints.ts`; `src/editor/BehaviorTreeEditor.ts`, `StateTreeEditor.ts` | Oyuna özgü davranış/blackboard/query/rota asset'leri ve gerekirse mevcut task registry üzerinden oyun görevleri; ikinci AI runner kurma. |
| Editörde AI/navigasyon görünümü | `src/scene/editorRecastPreview.ts`, `src/editor/panels/details/navigationDetails.ts`; `engine/scene/aiNavigationVolume.ts`, `engine/render-three/aiNavigationView.ts` | Mevcut araçlarla navigasyon alanlarını ve NPC ayarlarını düzenle; genel önizleme/araç hatasını Forge'da düzelt. |
| Araç, sürüş ve araç asset editörü | `engine/physics/vehicle/`, `engine/physics/physicsSubsystem.ts`; `src/editor/VehicleAssetEditor.ts`; `src/game/gameModes/vehicleGameMode.ts`; `src/scene/capabilities/vehicleModule.ts` | Oyun modelini ve `*.vehicle.json` / actor verisini mevcut Vehicle sistemiyle kur; ikinci fizik, sürüş veya araç editörü yazma. |
| Genel editör, Details, World Settings ve katalog | `src/editor/EditorUi.ts`, `src/editor/gameEditorRegistry.ts`, `src/editor/panels/world/worldSettingsPanel.ts`; `editor/` | Katalog verisini `src/game/editorCatalog.ts` ile sağla. Genel kontrol/araç Forge'da geliştirilir. |
| Actor ve bileşen tabanlı içerik | `engine/scene/actorScript.ts`, `src/editor/actorScriptStore.ts` | Oyuna ait `*.actor.json`, bileşen ayarları ve sahne yerleşimleri. |
| Terrain ve World Partition | `engine/terrain/terrainDefinition.ts`, `terrainLayers.ts`; `engine/world/worldPartition.ts`; `src/scene/capabilities/worldPartitionModule.ts` | Oyun sahnesi ve terrain/partition sidecar verisi; yeni terrain motoru kurma. |
| Kayıt/yükleme ve checkpoint altyapısı | `engine/persistence/`, `src/scene/capabilities/saveGameModule.ts`, `gameplaySaveStateService` | D–G tek görev kaydı `ScriptState.persist` → `flags` ve quick slot'a bağlıdır. G adapter'ı restore öncesinde pano/taşıyıcı ve oyun snapshot'ını doğrular; uyumsuz kaydın üstüne yeni ilerleme yazılmaz. Teknik kanıt tam M0 kullanıcı kabulü değildir. |
| Güvenli yeniden deneme | `GameModeVehicles.reset`, `engine/scene/actorInstance.ts` içindeki `actorInstanceTransform` | T aynı Gaz52'yi authored başlangıca döndürür; görev/kargo/bakiye korunur ve mevcut quick slot kaydedilir. R mevcut yerinde upright reset'tir. |
| Görev HUD'u, hız ve yön | `runtimeUiModule.ts`, `engine/ui/uiBinding.ts`; `GameModeVehicles.state/object`, `src/game/gameModes/vehicleCameraControl.ts` içindeki `planarHeadingFromQuaternion` | Mevcut UI/ViewModel'e görev alanları; etkin araç hızı ve hedefe kuş uçuşu yönü. Genel sürüş veya yön çözümü kopyalanmaz. |
| Rota bilgisi | `engine/scene/landscape.ts` içindeki `splineToPolyline` | Kaydedilmiş iki yol çizgisinin XZ uzunluğu ölçülür; oyun içerik sayıları `m0Content.ts` içinde, authored spline regresyonuyla güncel tutulur. GPS/pathfinding veya güvenlik tahmini değildir. |
| Proje kökü, import/save ve build | `tools/projectPaths.ts`, `tools/saveValidator.ts`, `vite.config.ts`; `tools/run-game-project.mjs`, `builder/web/game-project-build.mjs` | Manifest ve oyun verisini seçili proje kökünde tut; özel kayıt sunucusu veya paralel builder kurma. |

## Her yeni ihtiyaçta uygulanacak sıra

1. Oyun ihtiyacını ve ilgili GDD kapsamını belirle. İhtiyacı karşılayan Forge
   editör araçlarını, bileşenlerini, runtime servis/modüllerini, örneklerini ve
   testlerini araştır. Mevcut uygulamayı okumadan alternatif altyapı yazmaya başlama.
2. Kısa eşleme yaz: **ihtiyaç -> mevcut Forge sistemi ve dosyası -> Ridgebound'da
   gereken veri/bağlantı -> varsa gerçek eksik ve değişiklik deposu**. Haritada
   olmayan bir özellik için kaynak araştırmasını sürdür; yokluğunu varsayma.
3. Önce mevcut veriyi/bileşeni yapılandır; sonra mevcut API'leri compose et.
   Capability, host servisi, katalog/Game Mode veya asset eksikliğini belirle.
   Forge'da kodun bulunması, Ridgebound'da ilgili içeriğin hazır/etkin olduğu
   anlamına gelmez. Bağlantıyı tamamlamak sistemi yeniden inşa etmeyi gerektirmez.
4. Oyun verisi ve oyuna özgü kararlar Ridgebound'da kalır. Genel eksik/hata gerçek
   Forge kaynağında giderilir. Mevcut çözümün yetersizliği gösterilmeden yeni bir
   genel alt sistem tasarlama; yeniden kullanım yerine kopya/oyun içi motor yaması kurma.
5. İlgili Forge regresyonunu ve Ridgebound kullanım senaryosunu doğrula.
   Sahne/veri round-trip'i ve runtime bağlantısını kontrol et; teknik doğrulama
   ile kullanıcı görsel/oynanış kabulünü ayrı raporla. Kaynak değişimi reload veya
   gerekirse sunucuyu yeniden başlatmayla kullanılır.

## Örnek: AI navigasyonu isteyen bir oyun davranışı

"NPC hedefe gitsin veya bölgede devriye gezsin" isteğinde Forge'un mevcut AI
capability'si, Recast/Detour navigasyonu, path following ve mevcut karar/rota
sözleşmeleri kullanılır. `src/scene/capabilities/defaultRuntimeModules.ts` ve
`aiModule.ts` üzerinden AI modülünü, gereken host servislerini, movement ile
bağlantısını ve oyun task registry'sini incele. Eksik veri/bağlantıyı tamamla.

NPC actor/bileşenleri, navigasyon alanları, agent profili, hedefler/rotalar ve
oyuna özgü davranış asset'leri Ridgebound içeriğidir. Genel pathfinding, kaçınma
veya navmesh sorunu Forge'da düzeltilir. Ridgebound'a yeni A*, navmesh builder,
path follower veya Behavior Tree/StateTree runner yazılmaz. Gerekli özel oyun
kararı mevcut genişletme noktalarına bağlanır. Mevcut teknik testler için
Forge `tests/engine/aiModule.test.ts`, `recastNavMesh.test.ts` ve
`editorRecastPreview.test.ts` dosyalarına bak.

Araç da aynı ilkenin örneğidir: Forge `public/assets/starter-content/Gameplay/ReferenceCar.vehicle.json`
ve `Script_ReferenceCar.actor.json` referans alınabilir; oyun modeli/ayarları
Ridgebound'da oluşturulur, genel Vehicle sistemi Forge'dan kullanılır. Bu örnekler
görev yetkisi vermez ve ortak kaynağın yerine oyun içinde yeni altyapı kurmayı gerektirmez.

## Kayıt alanı ve üretim sınırı

Hangi sistem genişletilirse genişletilsin, yeni kayıt alanının runtime
normalizer'ı, editör kaydı ve Forge `tools/saveValidator.ts` allowlist'i birlikte
incelenir; bilinmeyen alanlar kayıtta düşebilir. AI asset'lerinde
`engine/ai/behaviorAsset.ts`, `stateTreeAsset.ts`, `queryAsset.ts`; araçta
`engine/physics/vehicle/vehicleTypes.ts` ilgili sözleşmelerin başlangıç noktalarıdır.
Layout, actor override ve skeleton sidecar alanlarında da ilgili
normalizer/validator'ı güncelle. Oyuna özel alanı genel sözleşmeye rastgele ekleme;
önce mevcut oyun verisi veya genişletme noktasının yeterliliğini değerlendir.

Forge'daki bir kaynak düzeltmesi geliştirmede doğrudan kullanılır; eski
`builds/<id>/dist/` çıktısını değiştirmez. Yeni üretim çıktısı için Ridgebound'da
`npm.cmd run build`, kayıtlı girdilerden yeniden üretim için `npm.cmd run verify:build`
kullanılır. Yayımlanacak içerik yalnız `dist/` içeriğidir; build kayıtları ve
kaynak arşivleri web çıktısına veya motorun ikinci geliştirme ağacına dönüştürülmez.
