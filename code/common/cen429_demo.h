/*
 * CEN429 — demo yardımcısı (bütün haftalar)
 *
 * demo_hazirla(): Windows'ta program çöktüğünde ya da güvenli kütüphane işlevi (strcpy_s gibi)
 * taşma algıladığında açılan iletişim kutularını kapatır; bunun yerine ekrana açık bir mesaj
 * basar. Böylece demolar takılmadan, her platformda aynı biçimde çalışır. Linux'ta bir şey yapmaz.
 */
#ifndef CEN429_DEMO_H
#define CEN429_DEMO_H

#ifdef _WIN32
#include <windows.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static void demo_gecersiz_parametre(const wchar_t *ifade, const wchar_t *islev, const wchar_t *dosya,
                                    unsigned int satir, uintptr_t ayrilmis)
{
    (void)ifade; (void)islev; (void)dosya; (void)satir; (void)ayrilmis;
    fprintf(stderr, "*** Guvenli kutuphane islevi tasmayi algiladi: program durduruldu ***\n");
    fflush(stderr);
    _exit(3);
}

static inline void demo_hazirla(void)
{
    SetErrorMode(SEM_FAILCRITICALERRORS | SEM_NOGPFAULTERRORBOX);
    _set_invalid_parameter_handler(demo_gecersiz_parametre);
}
#else
static inline void demo_hazirla(void) {}
#endif

#endif /* CEN429_DEMO_H */
