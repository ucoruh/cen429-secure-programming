/*
 * CEN429 - Hafta 9 - Demo 1: ORTAK KOSTURUCU (temiz ve gizli surum ayni main'i kullanir).
 * Jetonlar KOMUT SATIRINDAN verilir; boylece gecerli jeton IKILIYE GOMULMEZ
 * (demo.sh gecerli jetonu argumanla gecer). Arguman yoksa yalniz gecersiz
 * ornekler denenir. Iki surumun ciktisi ayni jetonlar icin BIREBIR AYNI olmalidir.
 */
#include <stdio.h>
#include "ortak.h"

static void dene(const char *jeton)
{
    int r = erisim_ver(jeton);
    printf("  jeton=\"%s\"  -> %s\n", jeton, r == IZIN ? "IZIN" : "RED");
}

int main(int argc, char **argv)
{
    printf("=== erisim_ver ===\n");
    if (argc > 1) {
        for (int i = 1; i < argc; i++) dene(argv[i]);
    } else {
        /* Gecersiz ornekler (sir DEGIL, gomulmesi sorun degil). */
        dene("kisa");
        dene("CEN429-XX");
        dene("");
        printf("  (Gecerli jetonu denemek icin argumanla verin: erisim_gizli <jeton>)\n");
    }
    return 0;
}
