set(CEN429_KLASOR "Hafta 04/04 Fuzzing (libFuzzer)")

# Reproducer (yeniden uretici): ASan ile derli. Cokerten girdiyi oynatir;
# fuzzer olmayan platformlarda bile hatayi tam yerinde gosterir.
# (ASan yoksa cen429_ornek sade -O1'e duser; demo yine cokmeyi gosterir.)
cen429_ornek(ayristirici         KAYNAK calis.c ayristir.c         MOD asan)
cen429_ornek(ayristirici_guvenli KAYNAK calis.c ayristir_guvenli.c MOD asan)

# libFuzzer hedefleri yalniz Clang (Linux) ya da MSVC (Windows) ile kurulur.
# WSL Ubuntu 20.04 (yalniz GCC) ve Windows MinGW/clang bunlari ATLAR; demo.sh clang kurulumunu anlatir.
if((CMAKE_C_COMPILER_ID STREQUAL "Clang" AND NOT WIN32) OR MSVC)
  cen429_ornek(ayristirici_fuzz KAYNAK fuzz.c ayristir.c MOD asan
               SECENEK $<$<C_COMPILER_ID:Clang>:-fsanitize=fuzzer>
                       $<$<C_COMPILER_ID:MSVC>:/fsanitize=fuzzer>)
  cen429_ornek(ayristirici_fuzz_guvenli KAYNAK fuzz.c ayristir_guvenli.c MOD asan
               SECENEK $<$<C_COMPILER_ID:Clang>:-fsanitize=fuzzer>
                       $<$<C_COMPILER_ID:MSVC>:/fsanitize=fuzzer>)
  if(NOT MSVC)
    target_link_options(ayristirici_fuzz         PRIVATE -fsanitize=fuzzer)
    target_link_options(ayristirici_fuzz_guvenli PRIVATE -fsanitize=fuzzer)
  endif()
endif()
