/*
 * CEN429 — Hafta 1 — Demo 1: PATH ile kandırma (HATALI SÜRÜM)
 *
 * Program bir rapor başlığı basıp bir sistem komutunu çağırır (Linux'ta "date",
 * Windows'ta "hostname"). Sorun: komut adı mutlak yolla değil, çıplak adla veriliyor.
 * system() komutu kabukla (Linux: /bin/sh, Windows: cmd.exe) çalıştırır; kabuk programı
 * PATH ortam değişkenindeki klasörlerde sırayla arar (Windows'ta önce çalışma klasörüne de
 * bakar). PATH'i ya da çalışma klasörünü kontrol eden kişi, hangi programın çalışacağını da
 * kontrol eder.  (CWE-426 güvenilmeyen arama yolu, CWE-427 denetimsiz arama yolu öğesi)
 */
#include <stdio.h>
#include <stdlib.h>
#include "cen429_demo.h"

#ifdef _WIN32
#define KOMUT "hostname"
#define ETIKET "Bilgisayar adi: "
#else
#define KOMUT "date"
#define ETIKET "Rapor tarihi: "
#endif

int main(void)
{
    demo_hazirla();
    printf("=== Aylik Satis Raporu ===\n");
    printf(ETIKET);
    fflush(stdout);

    /* HATA: çıplak komut adı + devralınan ortam (PATH, IFS, LD_* ...) + kabuk */
    int durum = system(KOMUT);
    if (durum != 0) {
        fprintf(stderr, "%s calistirilamadi (durum=%d)\n", KOMUT, durum);
        return 1;
    }
    return 0;
}
