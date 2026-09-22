set(CEN429_KLASOR "Hafta 04/07 Kontrol akisi duzlestirme")
# Ikisi de eniyilemesiz (korumasiz) derlenir: CFG farki objdump'ta gorunur kalsin.
cen429_ornek(pin_duz_degil KAYNAK pin.c     MOD korumasiz)
cen429_ornek(pin_duz       KAYNAK pin_duz.c MOD korumasiz)
