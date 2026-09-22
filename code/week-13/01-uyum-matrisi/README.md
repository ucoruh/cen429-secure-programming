# Hafta 13 · Demo 1 — Uyum matrisi doğrulayıcı (S17)

Gereksinim satırlarını (`ID|DURUM|BOLUM|KANIT`) okur ve değerlendirici gözüyle denetler:
**kanıtsız "karşılandı"** ve **gerekçesiz "devredildi"** satırlarını **bulgu** olarak işaretler.
Çıkış kodu = bulgu sayısı.

## Çalıştırma
```sh
bin/<platform>/uyum                 # gömülü örnek matris
bin/<platform>/uyum gereksinimler.txt   # kendi dosyanız
```

## Güvenlik
Yalnız verilen metin dosyasını **okur**; yazma/ağ/sistem işlemi yok.
