/*
 * CEN429 — Hafta 2 — Demo 6: TOCTOU yarış durumu (CWE-367)
 *
 * Kullanım: bin/linux/yaz <guvensiz|guvenli> <hedef-dosya> <metin>
 *
 * "Kontrol zamanı / kullanım zamanı" (Time Of Check, Time Of Use) yarışını
 * KENDİ demo klasörümüzde, tamamen güvenli biçimde gösterir. Program bir
 * "günlük yazıcısıdır": verilen dosyaya bir satır ekler, ama önce
 * "bu dosyaya benim yazmam güvenli mi?" diye bakar.
 *
 *   guvensiz : önce access()/lstat() ile bakar, SONRA fopen() ile açar.
 *              İki işlem arasında dosya bir sembolik bağla değiştirilirse,
 *              denetlediğinden BAŞKA bir dosyaya yazar (yarış açığı).
 *   guvenli  : O_NOFOLLOW | O_CREAT ile açar; sembolik bağ varsa açmayı
 *              REDDEDER. Denetim ile kullanım tek atomik adımda olur.
 *
 * ETİK/GÜVENLİK: Bu demo yalnız kendi klasöründeki "tuzak" hedefe yazar;
 * hiçbir sistem dosyasına dokunmaz, yönetici yetkisi istemez. Saldırı
 * betiği de yalnız bu klasörde sembolik bağ oluşturur.
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>
#include <errno.h>
#include "cen429_demo.h"

/* Denetim ile açma arasında saldırganın araya girmesine fırsat tanıyan
   küçük bir gecikme (yarışı derste görünür kılmak için). */
static void kucuk_gecikme(void)
{
    const char *g = getenv("TOCTOU_GECIKME_US");
    useconds_t us = g ? (useconds_t)strtoul(g, NULL, 10) : 0;
    if (us)
        usleep(us);
}

static int guvensiz_yaz(const char *hedef, const char *metin)
{
    /* KONTROL ZAMANI: hedef normal bir dosya mı, sembolik bağ mı? */
    struct stat st;
    if (lstat(hedef, &st) == 0 && S_ISLNK(st.st_mode)) {
        fprintf(stderr, "  reddedildi: hedef bir sembolik bag\n");
        return 1;
    }
    /* ... burada saldırgan hedefi bir sembolik bağla değiştirebilir ... */
    kucuk_gecikme();

    /* KULLANIM ZAMANI: fopen sembolik bağı İZLER; başka dosyaya yazabiliriz */
    FILE *f = fopen(hedef, "a");
    if (!f) {
        perror("  fopen");
        return 1;
    }
    fprintf(f, "%s\n", metin);
    fclose(f);
    printf("  guvensiz: '%s' -> %s (yazildi)\n", metin, hedef);
    return 0;
}

static int guvenli_yaz(const char *hedef, const char *metin)
{
    kucuk_gecikme();
    /* Denetim ile açma TEK adımda: sembolik bağ varsa açma başarısız olur. */
    int fd = open(hedef, O_WRONLY | O_CREAT | O_APPEND | O_NOFOLLOW, 0600);
    if (fd < 0) {
        if (errno == ELOOP)
            fprintf(stderr,
                    "  reddedildi: hedef sembolik bag (O_NOFOLLOW)\n");
        else
            perror("  open");
        return 1;
    }
    dprintf(fd, "%s\n", metin);
    close(fd);
    printf("  guvenli:  '%s' -> %s (yazildi)\n", metin, hedef);
    return 0;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc != 4) {
        fprintf(stderr, "kullanim: %s guvensiz|guvenli <hedef> <metin>\n",
                argv[0]);
        return 2;
    }
    if (strcmp(argv[1], "guvensiz") == 0)
        return guvensiz_yaz(argv[2], argv[3]);
    if (strcmp(argv[1], "guvenli") == 0)
        return guvenli_yaz(argv[2], argv[3]);
    fprintf(stderr, "bilinmeyen kip: %s\n", argv[1]);
    return 2;
}
