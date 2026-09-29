/*
 * CEN429 - Week 3 - Demo 6: TLS client - verification, hostname, pinning
 *
 * OpenSSL's most dangerous trap: by DEFAULT it does NOT verify the
 * server's certificate. If verification is not turned on, an attacker can
 * sit in the middle (MITM), present their own certificate, and the client
 * never notices.
 *
 * This client connects to the SAME servers in THREE different modes:
 *   insecure <host> <port>
 *       Verification is OFF. It accepts any certificate (BAD EXAMPLE).
 *   verify   <host> <port> <ca.pem>
 *       The certificate chain is verified up to a trusted CA AND the
 *       hostname is checked (SSL_set1_host). Rejects a fake/self-signed
 *       certificate.
 *   pin      <host> <port> <spki_sha256_hex>
 *       The server's PUBLIC KEY's (SPKI) SHA-256 digest must match the
 *       embedded reference exactly. Rejects it even if the chain is
 *       valid but the key does not match.
 *
 * Only works against localhost (127.0.0.1) with our own generated
 * certificates; it never touches the system certificate store.
 *
 * Builds with OpenSSL 1.1.1 and 3.x (SSL_set1_host >= 1.1.0).
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

static int tcp_connect(const char *ip, int port)
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

static void print_subject(X509 *cert)
{
    char name[256] = "(none)";
    if (cert) {
        X509_NAME_oneline(X509_get_subject_name(cert), name, sizeof(name));
        printf("   Certificate subject offered by the server: %s\n", name);
    }
}

/* Prints the hex digest of the server's public key's (SPKI) SHA-256 hash, puts it in md. */
static int spki_digest(X509 *cert, unsigned char *md)
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

static int hex_decode(const char *h, unsigned char *out, int out_len)
{
    int n = 0;
    for (const char *p = h; p[0] && p[1] && n < out_len; p += 2, n++)
        if (sscanf(p, "%2hhx", &out[n]) != 1)
            return -1;
    return n;
}

int main(int argc, char **argv)
{
    demo_prepare();
    if (argc < 4) {
        fprintf(stderr, "Usage: %s <insecure|verify|pin> <host> "
                "<port> [ca.pem | spki_hex]\n", argv[0]);
        return 1;
    }
    const char *mode = argv[1];
    const char *host = argv[2];
    int port = atoi(argv[3]);

    SSL_CTX *ctx = SSL_CTX_new(TLS_client_method());
    SSL_CTX_set_min_proto_version(ctx, TLS1_2_VERSION);

    int verify = strcmp(mode, "verify") == 0;
    if (verify) {
        if (argc < 5) {
            fprintf(stderr, "the verify mode needs ca.pem\n");
            return 1;
        }
        if (SSL_CTX_load_verify_locations(ctx, argv[4], NULL) != 1) {
            fprintf(stderr, "could not load the CA file: %s\n", argv[4]);
            return 1;
        }
        SSL_CTX_set_verify(ctx, SSL_VERIFY_PEER, NULL);
    } else {
        SSL_CTX_set_verify(ctx, SSL_VERIFY_NONE, NULL);
    }

    int sock = tcp_connect("127.0.0.1", port);
    if (sock < 0) {
        fprintf(stderr, "could not establish a TCP connection (port %d)\n", port);
        return 1;
    }
    SSL *ssl = SSL_new(ctx);
    SSL_set_fd(ssl, sock);
    SSL_set_tlsext_host_name(ssl, host);          /* SNI */
    if (verify) {
        /* Hostname check: is the certificate for this host? */
        SSL_set1_host(ssl, host);
        X509_VERIFY_PARAM *p = SSL_get0_param(ssl);
        X509_VERIFY_PARAM_set_hostflags(p,
            X509_CHECK_FLAG_NO_PARTIAL_WILDCARDS);
    }

    int r = SSL_connect(ssl);
    if (r != 1) {
        long v = SSL_get_verify_result(ssl);
        printf("[%s] HANDSHAKE FAILED - connection REJECTED.\n", mode);
        if (v != X509_V_OK)
            printf("   Reason: certificate verification error (%ld: %s)\n", v,
                   X509_verify_cert_error_string(v));
        SSL_free(ssl);
        close(sock);
        SSL_CTX_free(ctx);
        return 2;
    }

    X509 *cert = SSL_get_peer_certificate(ssl);
    print_subject(cert);

    int exit_code = 0;
    if (strcmp(mode, "pin") == 0) {
        if (argc < 5) {
            fprintf(stderr, "the pin mode needs spki_hex\n");
            exit_code = 1;
        } else {
            unsigned char expected[32], actual[32];
            int bn = hex_decode(argv[4], expected, sizeof(expected));
            if (bn != 32 || !spki_digest(cert, actual)) {
                printf("[pin] could not resolve the pin\n");
                exit_code = 1;
            } else if (memcmp(expected, actual, 32) == 0) {
                printf("[pin] the SPKI pin MATCHED - connection ACCEPTED.\n");
            } else {
                printf("[pin] the SPKI pin did NOT match - connection REJECTED.\n");
                printf("   (the chain may be valid, but the key differs)\n");
                exit_code = 2;
            }
        }
    } else if (verify) {
        printf("[verify] chain + hostname VERIFIED - ACCEPTED.\n");
    } else {
        printf("[insecure] no verification - ACCEPTS whatever it gets (DANGEROUS).\n");
    }

    if (cert)
        X509_free(cert);
    SSL_shutdown(ssl);
    SSL_free(ssl);
    close(sock);
    SSL_CTX_free(ctx);
    return exit_code;
}
