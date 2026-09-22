/*
 * CEN429 — Hafta 1 — Demo 3: Arabellek taşmasıyla yetki yükseltme (HATALI SÜRÜM)
 *
 * Oturum bilgisi bir yapıda tutuluyor: 16 baytlık kullanıcı adı ve hemen arkasında
 * "yonetici" bayrağı. Kullanıcı adı strcpy ile kopyalanıyor ve uzunluk hiç denetlenmiyor.
 * 16 bayttan uzun bir ad, bellekte hemen arkadaki yonetici alanının üzerine yazar.
 *
 * Bellekte (x86-64, küçük uçlu):
 *   ofset:  0 ........................ 15 | 16 17 18 19
 *           [ ad[0] ................ ad[15] ][ yonetici  ]
 *
 * "denetimli" derleme: Linux'ta _FORTIFY_SOURCE=2, Windows'ta strcpy_s (C11 Ek K) —
 * ikisi de hedefin 16 bayt olduğunu bildiği için taşmayı çalışma anında yakalar.
 */
#include <stdio.h>
#include <string.h>
#include "cen429_demo.h"

struct oturum {
    char ad[16];
    int  yonetici;          /* 0 = normal kullanıcı, 0 dışı = yönetici */
};

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 2) {
        fprintf(stderr, "Kullanim: %s <kullanici-adi>\n", argv[0]);
        return 1;
    }

    struct oturum o;
    o.yonetici = 0;

#if defined(KUTUPHANE_DENETIMI) && defined(_MSC_VER)
    strcpy_s(o.ad, sizeof(o.ad), argv[1]);   /* Windows "denetimli" derleme: boyutu bilen kopya */
#else
    strcpy(o.ad, argv[1]);  /* HATA: hedefin 16 bayt olduğu hiç denetlenmiyor */
#endif

    printf("Hos geldin, %s\n", o.ad);
    printf("yonetici alani = %d (0x%08x)\n", o.yonetici, (unsigned)o.yonetici);
    if (o.yonetici)
        printf(">>> YONETICI paneline erisim verildi! <<<\n");
    else
        printf("Normal kullanici oturumu.\n");
    return 0;
}
