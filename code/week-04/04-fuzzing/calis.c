/*
 * CEN429 - Hafta 4 - Demo 4: reproducer (yeniden uretici).
 * Bir dosyayi okur, icerigini ayristiriciya verir. AddressSanitizer ile
 * derlendigi icin, cokerten bir girdiyi (fuzzer'in buldugu ya da hazir tohum)
 * oynattigimizda hatayi tam yerinde raporlar. Fuzzer olmayan platformlarda
 * ( or. clang'siz WSL) hatayi gormek icin de bunu kullaniriz.
 */
#include <stdio.h>
#include <stdlib.h>
#include "ayristir.h"
#include "cen429_demo.h"

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "Kullanim: %s <girdi-dosyasi>\n", argv[0]);
        return 2;
    }
    FILE *f = fopen(argv[1], "rb");
    if (!f) { perror("fopen"); return 2; }
    fseek(f, 0, SEEK_END);
    long boy = ftell(f);
    fseek(f, 0, SEEK_SET);
    if (boy < 0) { fclose(f); return 2; }

    /* Tam boyutta yigin (heap) tamponu: sinir disi okuma ASan'ca yakalanir. */
    unsigned char *veri = (unsigned char *)malloc((size_t)boy ? (size_t)boy : 1);
    size_t okunan = fread(veri, 1, (size_t)boy, f);
    fclose(f);

    printf("Girdi: %s (%zu bayt) ayristiriliyor...\n", argv[1], okunan);
    int sonuc = belge_ayristir(veri, okunan);
    printf("Ayristirma sonucu: %d\n", sonuc);

    free(veri);
    return 0;
}
