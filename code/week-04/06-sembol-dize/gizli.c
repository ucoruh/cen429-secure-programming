/*
 * CEN429 - Hafta 4 - Demo 6: Sembol ve dize sizintisi.
 *
 * Ayni kaynak iki kez derlenir:
 *   acik   : LOG makrolari acik, anlamli fonksiyon adlari, GIZLI DIZE ACIK
 *            metin olarak gomulu (strip yok)    -> strings/nm cok sey sizdirir
 *   kapali : LOG derlenmez, GIZLI DIZE derleme zamaninda XOR ile gizlenip
 *            calisirken cozulur, semboller strip'lenir, -fvisibility=hidden
 *
 * Boylece 'strings' ve 'nm' araclariyla sizan bilgi ortadan kalkar.
 * Butun degerler SENTETIKTIR (uydurma).
 */
#include <stdio.h>
#include <string.h>
#include "cen429_demo.h"

/* Surum derlemesinde tamamen kaybolan gunlukleme makrosu. */
#ifdef CEN429_LOG
#define LOG(...) fprintf(stderr, "[LOG] " __VA_ARGS__)
#else
#define LOG(...) ((void)0)
#endif

/* Sizmamasi gereken sentetik lisans/yapim dizesi: "CEN429-LISANS-2026". */
static const char *gizli_metin(void)
{
#ifdef CEN429_GIZLE
    /* Derleme zamaninda 0x5A ile XOR'lanmis; ikilide ACIK METIN GORUNMEZ.
       Calisirken cozulur (basit derleme zamani dize karistirma). */
    static const unsigned char g[] = {
        0x19,0x1f,0x14,0x6e,0x68,0x63,0x77,0x16,0x13,
        0x09,0x1b,0x14,0x09,0x77,0x68,0x6a,0x68,0x6c
    };
    static char cozulen[sizeof(g) + 1];
    for (size_t i = 0; i < sizeof(g); i++)
        cozulen[i] = (char)(g[i] ^ 0x5A);
    cozulen[sizeof(g)] = '\0';
    return cozulen;
#else
    return "CEN429-LISANS-2026";   /* ACIK metin: 'strings' ile gorunur */
#endif
}

/* Basit lisans denetimi (anlamli ad: 'nm' ile gorunur). */
int lisans_dogrula(const char *anahtar)
{
    LOG("anahtar dogrulaniyor: %s\n", anahtar);
    int ok = (strcmp(anahtar, gizli_metin()) == 0);
    LOG("sonuc = %d\n", ok);
    return ok;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    const char *an = (argc >= 2) ? argv[1] : "YANLIS-ANAHTAR";
    int ok = lisans_dogrula(an);
    printf("Lisans: %s\n", ok ? "GECERLI" : "gecersiz");
    return ok ? 0 : 1;
}
