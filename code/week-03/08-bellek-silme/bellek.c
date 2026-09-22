/*
 * CEN429 - Hafta 3 - Demo 8: Kullanimda veri - bellekte guvenli tutma ve silme
 *
 * Bir anahtar/parola bellekte oldugu surece risk altindadir: takas
 * alanina (swap) yazilabilir, cokme dokumune (core) dusebilir, hata
 * ayiklayici okuyabilir. Bu demo Hafta 1'deki gcore gosterimini
 * TEKRARLAMAZ; kullanimda veri icin UC ek katmani kurar:
 *
 *   Katman 1 - cokme/hata dokumunu kapat: sir bir dosyaya dusmesin.
 *              Linux: setrlimit(RLIMIT_CORE, 0). Windows: SetErrorMode
 *              (demo_hazirla) hata iletisim kutularini/otomatik dokumu
 *              kapatir.
 *   Katman 2 - bellegi kilitle: bu sayfa takas alanina (swap) yazilmaz.
 *              Linux: mlock. Windows: VirtualLock.
 *   Katman 3 - guvenli sil: is bitince sir uzerine yazilir. memset'in
 *              aksine derleyici bunu "olu yazma" olarak kaldiramaz.
 *              Linux: OPENSSL_cleanse. Windows: SecureZeroMemory.
 *              (kripto_temizle her platformda dogru olani cagirir.)
 *
 * Program silme sonrasi tamponu okuyup gercekten sifirlandigini
 * dogrular. Yalniz kendi bellegine dokunur; sistem ayari degistirmez.
 */
#include "cen429_demo.h"
#include "cen429_kripto.h"
#include <stdio.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#else
#include <sys/mman.h>
#include <sys/resource.h>
#include <string.h>
#endif

#define BOY 64

static int dolu_bayt(const char *p)
{
    int n = 0;
    for (int i = 0; i < BOY; i++)
        if (p[i] != 0)
            n++;
    return n;
}

int main(void)
{
    demo_hazirla();

    /* Katman 1: cokme/hata dokumunu kapat. */
#ifdef _WIN32
    printf("Katman 1 - hata iletisim kutulari/otomatik dokum kapatildi "
           "(SetErrorMode): TAMAM\n");
#else
    struct rlimit rl = { 0, 0 };
    int core_ok = (setrlimit(RLIMIT_CORE, &rl) == 0);
    printf("Katman 1 - cokme dokumu kapatildi (RLIMIT_CORE=0): %s\n",
           core_ok ? "TAMAM" : "yapilamadi");
#endif

    char sir[BOY];
    memset(sir, 0, sizeof(sir));
    strcpy(sir, "S3ntetik-Parola-2026");

    /* Katman 2: bellegi takasa yazilmaktan koru. */
#ifdef _WIN32
    int kilit_ok = VirtualLock(sir, sizeof(sir)) ? 1 : 0;
    printf("Katman 2 - VirtualLock ile takasa yazma engellendi: %s\n",
           kilit_ok ? "TAMAM" : "yapilamadi (calisma kumesi siniri)");
#else
    int kilit_ok = (mlock(sir, sizeof(sir)) == 0);
    printf("Katman 2 - mlock ile takasa (swap) yazma engellendi: %s\n",
           kilit_ok ? "TAMAM" : "yapilamadi (ulimit -l dusuk olabilir)");
#endif

    printf("Sir kullaniliyor: uzunluk = %zu, dolu bayt = %d\n",
           strlen(sir), dolu_bayt(sir));

    /* Katman 3: is bitince guvenli sil. */
    kripto_temizle(sir, sizeof(sir));
    printf("Katman 3 - guvenli silme sonrasi dolu bayt = %d\n",
           dolu_bayt(sir));
    printf("   ==> %s\n", dolu_bayt(sir) == 0
           ? "sir bellekten temizlendi." : "sir hala bellekte (!)");

#ifdef _WIN32
    if (kilit_ok)
        VirtualUnlock(sir, sizeof(sir));
#else
    if (kilit_ok)
        munlock(sir, sizeof(sir));
#endif

    printf("\nNot: OPENSSL_cleanse / SecureZeroMemory cagrisi derleyici\n"
           "tarafindan \"olu yazma\" olarak KALDIRILAMAZ; memset ise -O2'de\n"
           "kaldirilabilir (bkz. Hafta 1 Demo 2).\n");
    return 0;
}
