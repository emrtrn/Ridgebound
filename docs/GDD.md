# Ridgebound — tasarım kaynakları

Oyunun adı **Ridgebound**. Aşağıdaki tarihsel belgelerde geçen “Forge Offroad” ve “Offroad”, bu oyunun önceki çalışma adıdır. Dosyalar, kararların izi korunmak üzere özgün adları ve içerikleriyle saklanır; ad değişikliği oyun kapsamını değiştirmez.

## Kaynak belgeler

- [Aşama 1 kapanışı ve D010](design/FORGE_OFFROAD_ASAMA_1_KAPANIS_VE_D010_v1.0.md): M0 kapsamı ve bağlayıcı kabul kapısı.
- [Çekirdek oyun döngüsü v0.2](design/02_CORE_GAMEPLAY_LOOP_v0.2_TOPLU_KARAR_KAYDI.md): işleyiş kararları.
- [GDD proje çerçevesi](design/FORGE_OFFROAD_GDD_PROJE_CERCEVESI_v0.4.md): kapsam ve sınırlar.
- [Vizyon ve tasarım sütunları](design/01_GAME_VISION_AND_PILLARS_v0.4.md).
- [M0 uygulama ve kabul şablonu v0.5](design/FORGE_OFFROAD_M0_UYGULAMA_VE_KABUL_RAPORU_v0.5.md): uygulama/kanıt kaydı; doldurulmuş başarı raporu değildir.

Bu beş dosya `Downloads/Offroad` kaynaklarından değiştirilmeden kopyalandı. M0 şablonunun atıf yaptığı eski teknik envanter ve eski v0.1 döngü belgesi bu kaynak kümesinde bulunmuyordu. Güncel teknik durum Forge kaynaklarından ve testlerden ayrıca doğrulanır.

## Uygulama durumu

Güncel iş sırası ve kanıt durumu [M0 kontrol listesinde](M0_CHECKLIST.md) tutulur.
P2 teknik ve kullanıcı kabulü tamamlandı. M0 için Gaz52, mevcut Landscape,
Forge terrain materyalleri ve World Builder ile graybox saha yaklaşımı seçildi.

P1-B, ortak Forge ile bağımsız oyun modülü ve küçük sahne bağlantısının prototipiydi.
Küpler görev deposu, teslim noktası veya sürülebilir araç olarak kabul edilmez.
M0'ın 15 kabul maddesi henüz tamamlanmış sayılmaz; kural testleri runtime veya
oynanış kabulünün yerine geçmez.

Genel motor/editör düzeltmesi Forge'da, oyuna özel görev ve içerik Ridgebound'da geliştirilir. Ayrı motor kopyası, motor release sistemi veya uzun ömürlü oyun-motor dalı oluşturulmaz.
