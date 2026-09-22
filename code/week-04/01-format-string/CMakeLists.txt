set(CEN429_KLASOR "Hafta 04/01 Bicim dizisi acigi")
# GCC/Clang: bicim dizisi uyarilarini AC. -Wformat-security varsayilan degil;
# -Werror=format-security ile sabit-olmayan bicim dizisi derleme hatasi olur.
set(_biu $<$<C_COMPILER_ID:GNU,Clang>:-Wformat>
         $<$<C_COMPILER_ID:GNU,Clang>:-Wformat-security>)

cen429_ornek(sizinti         KAYNAK sizinti.c         MOD korumasiz)
cen429_ornek(sizinti_denetimli KAYNAK sizinti.c       MOD denetimli)
cen429_ornek(sizinti_guvenli KAYNAK sizinti_guvenli.c MOD guvenli SECENEK ${_biu})
