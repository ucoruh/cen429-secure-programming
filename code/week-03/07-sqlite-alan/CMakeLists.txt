set(CEN429_KLASOR "Hafta 03/07 SQLite alan sifreleme")
# SQLite: Linux'ta sqlite3; Windows'ta Windows SDK'nin yerlesik winsqlite3'u (yalniz MSVC).
# Kripto: Linux'ta crypto (OpenSSL); Windows'ta bcrypt (CNG).
# Windows'ta MinGW/clang'de winsqlite3 basligi yoktur -> hedef ATLANIR (MSVC ya da WSL kullanin).
if(NOT WIN32 OR MSVC)
  cen429_ornek(sqlite_alan KAYNAK sqlite_alan.c MOD guvenli
               KUTUPHANE
                 $<IF:$<PLATFORM_ID:Windows>,winsqlite3,sqlite3>
                 $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
endif()
