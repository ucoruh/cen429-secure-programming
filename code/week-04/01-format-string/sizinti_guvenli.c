/*
 * CEN429 - Hafta 4 - Demo 1: Bicim dizisi acigi (GUVENLI SURUM)
 *
 * Duzeltme cok kucuk ama kritik: kullanici verisi ASLA bicim parametresi
 * olamaz. Sabit bir bicim ("%s") kullanip veriyi ARGUMAN olarak veriyoruz.
 * Boylece kullanicinin yazdigi %x / %n gibi belirtecler sıradan metin gibi
 * basilir; ne bellek okunur ne yazilir.
 *
 * Ek olarak girdi uzunlugu dogrulanir (savunmaci programlama).
 */
#include <stdio.h>
#include <string.h>
#include "cen429_demo.h"

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "Kullanim: %s <metin>\n", argv[0]);
        return 1;
    }
    if (strlen(argv[1]) >= 64) {
        fprintf(stderr, "Reddedildi: metin cok uzun (en fazla 63).\n");
        return 1;
    }

    volatile unsigned gizli_deger = 0x5ECE7u;
    printf("Gizli deger bellekte: 0x%05x (ekranda GORUNMEMELI)\n",
           gizli_deger);
    printf("Program ciktisi -> ");
    printf("%s", argv[1]);     /* DOGRU: sabit bicim, veri arguman */
    printf("\n");
    return 0;
}
