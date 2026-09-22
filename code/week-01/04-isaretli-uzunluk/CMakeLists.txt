set(CEN429_KLASOR "Hafta 01/04 Isaretli uzunluk")
# İşaretli -> işaretsiz dönüşüm uyarısı GCC'de -Wsign-conversion ile açılır (varsayılan kapalı).
# MSVC'nin C derleyicisinde karşılığı yok; C4365 yalnız C++ derlemesinde çıkar (bkz. demo.ps1).
set(_uyari $<$<C_COMPILER_ID:GNU,Clang>:-Wsign-conversion>)
cen429_ornek(kopya         KAYNAK kopya.c         MOD korumasiz SECENEK ${_uyari})
cen429_ornek(kopya_asan    KAYNAK kopya.c         MOD asan)
cen429_ornek(kopya_guvenli KAYNAK kopya_guvenli.c MOD guvenli   SECENEK ${_uyari})
