set(CEN429_KLASOR "Hafta 02/06 TOCTOU")
# Bu demo Unix'e ozgudur (sembolik bag, O_NOFOLLOW, POSIX dosya API'si).
# Windows'ta derlenmez; demo.ps1 WSL'de nasil calistirilacagini soyler.
if(NOT WIN32)
  cen429_ornek(yaz KAYNAK yaz.c MOD guvenli)
endif()
