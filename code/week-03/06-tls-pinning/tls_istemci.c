/*
 * CEN429 - Hafta 3 - Demo 6: TLS istemcisi - dogrulama, hostname, pinning
 *
 * OpenSSL'in en tehlikeli tuzagi: sertifikayi VARSAYILAN olarak
 * DOGRULAMAZ. Dogrulama acilmazsa saldirgan araya girip (MITM) kendi
 * sertifikasini sunar ve istemci hicbir sey anlamaz.
 *
 * Bu istemci ayni sunuculara UC farkli modda baglanir:
 *   guvensiz <host> <port>
 *       Dogrulama KAPALI. Her sertifikayi kabul eder (KOTU ORNEK).
 *   dogrula  <host> <port> <ca.pem>
 *       Sertifika zinciri guvenilir CA'ya kadar dogrulanir VE ana
 *       makine adi (hostname) denetlenir (SSL_set1_host). Sahte/kendi
 *       imzali sertifikayi REDDEDER.
 *   pin      <host> <port> <spki_sha256_hex>
 *       Sunucu ACIK ANAHTARININ (SPKI) SHA-256 ozeti, gomulu referans
 *       ile birebir eslesmek zorunda. Zincir gecerli olsa bile anahtar
 *       tutmuyorsa REDDEDER.
 *
 * Yalniz localhost (127.0.0.1) ile ve kendi urettigimiz sertifikalarla
 * calisir; sistem sertifika deposuna dokunmaz.
 *
 * OpenSSL 1.1.1 ve 3.x ile derlenir (SSL_set1_host >= 1.1.0).
 */
#include "cen429_demo.h"
#include <openssl/ssl.h>
#include <openssl/err.h>
#include <openssl/x509.h>
#include <openssl/x509v3.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int tcp_baglan(const char *ip, int port)
{
    int s = socket(AF_INET, SOCK_STREAM, 0);
    if (s < 0)
        return -1;
    struct sockaddr_in a;
    memset(&a, 0, sizeof(a));
    a.sin_family = AF_INET;
    a.sin_port = htons((uint16_t)port);
    inet_pton(AF_INET, ip, &a.sin_addr);
    if (connect(s, (struct sockaddr *)&a, sizeof(a)) < 0) {
        close(s);
        return -1;
    }
    return s;
}

static void yaz_konu(X509 *cert)
{
    char ad[256] = "(yok)";
    if (cert) {
        X509_NAME_oneline(X509_get_subject_name(cert), ad, sizeof(ad));
        printf("   Sunucunun sundugu sertifika konusu: %s\n", ad);
    }
}

/* Sunucu acik anahtarinin (SPKI) SHA-256 ozetini hex yazar, md'ye koyar. */
static int spki_ozet(X509 *cert, unsigned char *md)
{
    unsigned char *der = NULL;
    int len = i2d_X509_PUBKEY(X509_get_X509_PUBKEY(cert), &der);
    if (len <= 0)
        return 0;
    unsigned int mdlen = 0;
    EVP_Digest(der, (size_t)len, md, &mdlen, EVP_sha256(), NULL);
    OPENSSL_free(der);
    return 1;
}

static int hex_coz(const char *h, unsigned char *out, int out_boy)
{
    int n = 0;
    for (const char *p = h; p[0] && p[1] && n < out_boy; p += 2, n++)
        if (sscanf(p, "%2hhx", &out[n]) != 1)
            return -1;
    return n;
}

int main(int argc, char **argv)
{
    demo_hazirla();
    if (argc < 4) {
        fprintf(stderr, "Kullanim: %s <guvensiz|dogrula|pin> <host> "
                "<port> [ca.pem | spki_hex]\n", argv[0]);
        return 1;
    }
    const char *mod = argv[1];
    const char *host = argv[2];
    int port = atoi(argv[3]);

    SSL_CTX *ctx = SSL_CTX_new(TLS_client_method());
    SSL_CTX_set_min_proto_version(ctx, TLS1_2_VERSION);

    int dogrula = strcmp(mod, "dogrula") == 0;
    if (dogrula) {
        if (argc < 5) {
            fprintf(stderr, "dogrula modu icin ca.pem gerekli\n");
            return 1;
        }
        if (SSL_CTX_load_verify_locations(ctx, argv[4], NULL) != 1) {
            fprintf(stderr, "CA dosyasi yuklenemedi: %s\n", argv[4]);
            return 1;
        }
        SSL_CTX_set_verify(ctx, SSL_VERIFY_PEER, NULL);
    } else {
        SSL_CTX_set_verify(ctx, SSL_VERIFY_NONE, NULL);
    }

    int sock = tcp_baglan("127.0.0.1", port);
    if (sock < 0) {
        fprintf(stderr, "TCP baglanti kurulamadi (port %d)\n", port);
        return 1;
    }
    SSL *ssl = SSL_new(ctx);
    SSL_set_fd(ssl, sock);
    SSL_set_tlsext_host_name(ssl, host);          /* SNI */
    if (dogrula) {
        /* Ana makine adi denetimi: sertifika bu host icin mi? */
        SSL_set1_host(ssl, host);
        X509_VERIFY_PARAM *p = SSL_get0_param(ssl);
        X509_VERIFY_PARAM_set_hostflags(p,
            X509_CHECK_FLAG_NO_PARTIAL_WILDCARDS);
    }

    int r = SSL_connect(ssl);
    if (r != 1) {
        long v = SSL_get_verify_result(ssl);
        printf("[%s] EL SIKISMA BASARISIZ - baglanti REDDEDILDI.\n", mod);
        if (v != X509_V_OK)
            printf("   Sebep: sertifika dogrulama hatasi (%ld: %s)\n", v,
                   X509_verify_cert_error_string(v));
        SSL_free(ssl);
        close(sock);
        SSL_CTX_free(ctx);
        return 2;
    }

    X509 *cert = SSL_get_peer_certificate(ssl);
    yaz_konu(cert);

    int cikis = 0;
    if (strcmp(mod, "pin") == 0) {
        if (argc < 5) {
            fprintf(stderr, "pin modu icin spki_hex gerekli\n");
            cikis = 1;
        } else {
            unsigned char beklenen[32], gercek[32];
            int bn = hex_coz(argv[4], beklenen, sizeof(beklenen));
            if (bn != 32 || !spki_ozet(cert, gercek)) {
                printf("[pin] pin cozulemedi\n");
                cikis = 1;
            } else if (memcmp(beklenen, gercek, 32) == 0) {
                printf("[pin] SPKI pin TUTTU - baglanti KABUL.\n");
            } else {
                printf("[pin] SPKI pin TUTMADI - baglanti REDDEDILDI.\n");
                printf("   (zincir gecerli olsa bile anahtar farkli)\n");
                cikis = 2;
            }
        }
    } else if (dogrula) {
        printf("[dogrula] Zincir + hostname DOGRULANDI - KABUL.\n");
    } else {
        printf("[guvensiz] Dogrulama YOK - ne gelirse KABUL (TEHLIKELI).\n");
    }

    if (cert)
        X509_free(cert);
    SSL_shutdown(ssl);
    SSL_free(ssl);
    close(sock);
    SSL_CTX_free(ctx);
    return cikis;
}
