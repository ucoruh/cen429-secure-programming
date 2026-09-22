/*
 * CEN429 - ortak kriptografi yardimcisi (basliktaki tum islevler static/satir-ici)
 *
 * Amac: Hafta 3 demolarinin AYNI kaynak kodla hem Linux/WSL (OpenSSL EVP) hem
 * Windows (BCrypt CNG) uzerinde derlenip calismasi. Ogrencinin Windows'unda
 * OpenSSL kurulu olmayabilir; bu yuzden Windows'ta isletim sisteminin kendi
 * kripto kutuphanesi (Cryptography API: Next Generation) kullanilir. Bu ikili
 * yaklasim, ders kitabinin (Viega & Messier) hem OpenSSL hem Windows CryptoAPI
 * tariflerini vermesini yansitir.
 *
 * Baglama:
 *   Linux/WSL : -lcrypto   (OpenSSL 1.1.1 ve 3.x ile uyumlu; dusuk duzey AES_/RSA_
 *               yapilarina dokunmaz, yalniz EVP ust duzey API'sini kullanir)
 *   Windows   : bcrypt.lib
 *
 * Tasarim: Tek platforma bagimli ilkel islevler RASTGELE SAYI, SHA-256 (artimli)
 * ve AES (GCM, ECB blok). HMAC, HKDF ve PBKDF2 bunlarin ustune TASINABILIR biar
 * bicimde (ilgili RFC'ye gore) yazilmistir; boylece iki platformda da ayni koddur
 * ve dogrulugu bilinen test vektorleriyle sinanabilir (RFC 4231/5869/6070, NIST GCM).
 *
 * Butun islevler basari icin 1, hata icin 0 dondurur (aksi yazilmadikca).
 */
#ifndef CEN429_KRIPTO_H
#define CEN429_KRIPTO_H

#include <stddef.h>
#include <string.h>
#include <stdint.h>

#ifdef _WIN32
#include <windows.h>
#include <bcrypt.h>
#ifndef STATUS_SUCCESS
#define STATUS_SUCCESS ((NTSTATUS)0x00000000L)
#endif
#ifndef STATUS_AUTH_TAG_MISMATCH
#define STATUS_AUTH_TAG_MISMATCH ((NTSTATUS)0xC000A002L)
#endif
#else
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/crypto.h>
#endif

/* ==================================================================== */
/*  1) Rastgele bayt                                                    */
/* ==================================================================== */
static inline int kripto_rastgele(unsigned char *tampon, size_t boy)
{
#ifdef _WIN32
    return BCryptGenRandom(NULL, tampon, (ULONG)boy,
                           BCRYPT_USE_SYSTEM_PREFERRED_RNG)
           == STATUS_SUCCESS;
#else
    return RAND_bytes(tampon, (int)boy) == 1;
#endif
}

/* ==================================================================== */
/*  2) SHA-256 - artimli (init/update/final) tek platforma bagimli ilkel */
/* ==================================================================== */
typedef struct {
#ifdef _WIN32
    BCRYPT_ALG_HANDLE alg;
    BCRYPT_HASH_HANDLE h;
#else
    EVP_MD_CTX *ctx;
#endif
} kripto_sha256_ctx;

static inline int kripto_sha256_basla(kripto_sha256_ctx *c)
{
#ifdef _WIN32
    c->alg = NULL;
    c->h = NULL;
    if (BCryptOpenAlgorithmProvider(&c->alg, BCRYPT_SHA256_ALGORITHM,
                                    NULL, 0) != STATUS_SUCCESS)
        return 0;
    if (BCryptCreateHash(c->alg, &c->h, NULL, 0, NULL, 0, 0)
        != STATUS_SUCCESS) {
        BCryptCloseAlgorithmProvider(c->alg, 0);
        c->alg = NULL;
        return 0;
    }
    return 1;
#else
    c->ctx = EVP_MD_CTX_new();
    if (!c->ctx)
        return 0;
    return EVP_DigestInit_ex(c->ctx, EVP_sha256(), NULL) == 1;
#endif
}

static inline int kripto_sha256_ekle(kripto_sha256_ctx *c, const void *veri,
                              size_t boy)
{
#ifdef _WIN32
    return BCryptHashData(c->h, (PUCHAR)veri, (ULONG)boy, 0)
           == STATUS_SUCCESS;
#else
    return EVP_DigestUpdate(c->ctx, veri, boy) == 1;
#endif
}

static inline int kripto_sha256_bitir(kripto_sha256_ctx *c, unsigned char ozet[32])
{
#ifdef _WIN32
    NTSTATUS s = BCryptFinishHash(c->h, ozet, 32, 0);
    BCryptDestroyHash(c->h);
    BCryptCloseAlgorithmProvider(c->alg, 0);
    c->h = NULL;
    c->alg = NULL;
    return s == STATUS_SUCCESS;
#else
    unsigned int n = 32;
    int ok = EVP_DigestFinal_ex(c->ctx, ozet, &n) == 1;
    EVP_MD_CTX_free(c->ctx);
    c->ctx = NULL;
    return ok;
#endif
}

/* Tek seferde SHA-256. */
static inline int kripto_sha256(const void *veri, size_t boy, unsigned char ozet[32])
{
    kripto_sha256_ctx c;
    if (!kripto_sha256_basla(&c))
        return 0;
    if (!kripto_sha256_ekle(&c, veri, boy)) {
        kripto_sha256_bitir(&c, ozet);
        return 0;
    }
    return kripto_sha256_bitir(&c, ozet);
}

/* ==================================================================== */
/*  3) HMAC-SHA256 - tasinabilir (RFC 2104), yalniz SHA-256 ustune       */
/* ==================================================================== */
#define KRIPTO_BLOK 64      /* SHA-256 blok boyu */

static inline int kripto_hmac_sha256(const unsigned char *anahtar, size_t alen,
                              const void *veri, size_t vlen,
                              unsigned char cikti[32])
{
    unsigned char k0[KRIPTO_BLOK], ipad[KRIPTO_BLOK], opad[KRIPTO_BLOK];
    unsigned char ic[32];
    kripto_sha256_ctx c;

    if (alen > KRIPTO_BLOK) {
        if (!kripto_sha256(anahtar, alen, k0))
            return 0;
        memset(k0 + 32, 0, KRIPTO_BLOK - 32);
    } else {
        memcpy(k0, anahtar, alen);
        memset(k0 + alen, 0, KRIPTO_BLOK - alen);
    }
    for (int i = 0; i < KRIPTO_BLOK; i++) {
        ipad[i] = (unsigned char)(k0[i] ^ 0x36);
        opad[i] = (unsigned char)(k0[i] ^ 0x5c);
    }
    /* ic = SHA256(ipad || veri) */
    if (!kripto_sha256_basla(&c))
        return 0;
    if (!kripto_sha256_ekle(&c, ipad, KRIPTO_BLOK)
        || !kripto_sha256_ekle(&c, veri, vlen)
        || !kripto_sha256_bitir(&c, ic))
        return 0;
    /* cikti = SHA256(opad || ic) */
    if (!kripto_sha256_basla(&c))
        return 0;
    if (!kripto_sha256_ekle(&c, opad, KRIPTO_BLOK)
        || !kripto_sha256_ekle(&c, ic, 32)
        || !kripto_sha256_bitir(&c, cikti))
        return 0;
    return 1;
}

/* ==================================================================== */
/*  4) HKDF-SHA256 - tasinabilir (RFC 5869), HMAC ustune                 */
/* ==================================================================== */
static inline int kripto_hkdf_sha256(const unsigned char *ikm, size_t ikm_boy,
                              const unsigned char *tuz, size_t tuz_boy,
                              const unsigned char *info, size_t info_boy,
                              unsigned char *cikti, size_t cikti_boy)
{
    unsigned char prk[32];
    unsigned char sifir_tuz[32];
    unsigned char t[32];
    size_t t_boy = 0;
    unsigned char sayac = 1;
    size_t yazilan = 0;

    if (!tuz || tuz_boy == 0) {
        memset(sifir_tuz, 0, sizeof(sifir_tuz));
        tuz = sifir_tuz;
        tuz_boy = sizeof(sifir_tuz);
    }
    /* Extract: PRK = HMAC(tuz, ikm) */
    if (!kripto_hmac_sha256(tuz, tuz_boy, ikm, ikm_boy, prk))
        return 0;

    /* Expand: T(i) = HMAC(PRK, T(i-1) || info || i) */
    while (yazilan < cikti_boy) {
        kripto_sha256_ctx c;      /* HMAC'i elle kuruyoruz ki bloklari akitalim */
        unsigned char k0[KRIPTO_BLOK], ipad[KRIPTO_BLOK], opad[KRIPTO_BLOK];
        unsigned char ic[32];
        memcpy(k0, prk, 32);
        memset(k0 + 32, 0, KRIPTO_BLOK - 32);
        for (int i = 0; i < KRIPTO_BLOK; i++) {
            ipad[i] = (unsigned char)(k0[i] ^ 0x36);
            opad[i] = (unsigned char)(k0[i] ^ 0x5c);
        }
        if (!kripto_sha256_basla(&c)
            || !kripto_sha256_ekle(&c, ipad, KRIPTO_BLOK)
            || !kripto_sha256_ekle(&c, t, t_boy)
            || !kripto_sha256_ekle(&c, info, info_boy)
            || !kripto_sha256_ekle(&c, &sayac, 1)
            || !kripto_sha256_bitir(&c, ic))
            return 0;
        if (!kripto_sha256_basla(&c)
            || !kripto_sha256_ekle(&c, opad, KRIPTO_BLOK)
            || !kripto_sha256_ekle(&c, ic, 32)
            || !kripto_sha256_bitir(&c, t))
            return 0;
        t_boy = 32;
        size_t al = (cikti_boy - yazilan < 32) ? cikti_boy - yazilan : 32;
        memcpy(cikti + yazilan, t, al);
        yazilan += al;
        sayac++;
    }
    return 1;
}

/* ==================================================================== */
/*  5) PBKDF2-HMAC-SHA256 - tasinabilir (RFC 2898/8018), HMAC ustune     */
/* ==================================================================== */
static inline int kripto_pbkdf2_sha256(const unsigned char *parola, size_t plen,
                                const unsigned char *tuz, size_t tuz_boy,
                                uint32_t tur, unsigned char *cikti,
                                size_t cikti_boy)
{
    uint32_t blok = 1;
    size_t yazilan = 0;
    while (yazilan < cikti_boy) {
        unsigned char u[32], t[32];
        unsigned char son[4];
        kripto_sha256_ctx c;
        unsigned char k0[KRIPTO_BLOK], ipad[KRIPTO_BLOK], opad[KRIPTO_BLOK];
        unsigned char ic[32];
        /* U1 = HMAC(parola, tuz || INT_BE(blok)) - HMAC'i elle kuruyoruz. */
        son[0] = (unsigned char)(blok >> 24);
        son[1] = (unsigned char)(blok >> 16);
        son[2] = (unsigned char)(blok >> 8);
        son[3] = (unsigned char)(blok);
        if (plen > KRIPTO_BLOK) {
            if (!kripto_sha256(parola, plen, k0))
                return 0;
            memset(k0 + 32, 0, KRIPTO_BLOK - 32);
        } else {
            memcpy(k0, parola, plen);
            memset(k0 + plen, 0, KRIPTO_BLOK - plen);
        }
        for (int i = 0; i < KRIPTO_BLOK; i++) {
            ipad[i] = (unsigned char)(k0[i] ^ 0x36);
            opad[i] = (unsigned char)(k0[i] ^ 0x5c);
        }
        if (!kripto_sha256_basla(&c)
            || !kripto_sha256_ekle(&c, ipad, KRIPTO_BLOK)
            || !kripto_sha256_ekle(&c, tuz, tuz_boy)
            || !kripto_sha256_ekle(&c, son, 4)
            || !kripto_sha256_bitir(&c, ic))
            return 0;
        if (!kripto_sha256_basla(&c)
            || !kripto_sha256_ekle(&c, opad, KRIPTO_BLOK)
            || !kripto_sha256_ekle(&c, ic, 32)
            || !kripto_sha256_bitir(&c, u))
            return 0;
        memcpy(t, u, 32);
        /* U2..Uc = HMAC(parola, U_{i-1}); T ^= Ui */
        for (uint32_t j = 1; j < tur; j++) {
            if (!kripto_hmac_sha256(parola, plen, u, 32, u))
                return 0;
            for (int i = 0; i < 32; i++)
                t[i] ^= u[i];
        }
        size_t al = (cikti_boy - yazilan < 32) ? cikti_boy - yazilan : 32;
        memcpy(cikti + yazilan, t, al);
        yazilan += al;
        blok++;
    }
    return 1;
}

/* ==================================================================== */
/*  6) AES-256-GCM - platforma bagimli (EVP / BCrypt)                    */
/*     Bicim: cagiran ct icin ptlen bayt, tag icin 16 bayt ayirir.       */
/* ==================================================================== */
static inline int kripto_gcm_sifrele(const unsigned char *anahtar,
                              const unsigned char *nonce, size_t nonce_boy,
                              const unsigned char *aad, size_t aad_boy,
                              const unsigned char *pt, size_t pt_boy,
                              unsigned char *ct, unsigned char tag[16])
{
#ifdef _WIN32
    BCRYPT_ALG_HANDLE alg = NULL;
    BCRYPT_KEY_HANDLE k = NULL;
    BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO info;
    ULONG yazilan = 0;
    int ok = 0;
    if (BCryptOpenAlgorithmProvider(&alg, BCRYPT_AES_ALGORITHM, NULL, 0)
        != STATUS_SUCCESS)
        return 0;
    BCryptSetProperty(alg, BCRYPT_CHAINING_MODE,
                      (PUCHAR)BCRYPT_CHAIN_MODE_GCM,
                      sizeof(BCRYPT_CHAIN_MODE_GCM), 0);
    if (BCryptGenerateSymmetricKey(alg, &k, NULL, 0, (PUCHAR)anahtar, 32, 0)
        == STATUS_SUCCESS) {
        BCRYPT_INIT_AUTH_MODE_INFO(info);
        info.pbNonce = (PUCHAR)nonce;
        info.cbNonce = (ULONG)nonce_boy;
        info.pbAuthData = (PUCHAR)aad;
        info.cbAuthData = (ULONG)aad_boy;
        info.pbTag = tag;
        info.cbTag = 16;
        if (BCryptEncrypt(k, (PUCHAR)pt, (ULONG)pt_boy, &info, NULL, 0,
                          ct, (ULONG)pt_boy, &yazilan, 0) == STATUS_SUCCESS)
            ok = 1;
        BCryptDestroyKey(k);
    }
    BCryptCloseAlgorithmProvider(alg, 0);
    return ok;
#else
    EVP_CIPHER_CTX *c = EVP_CIPHER_CTX_new();
    int len = 0, ok = 0;
    if (!c)
        return 0;
    if (EVP_EncryptInit_ex(c, EVP_aes_256_gcm(), NULL, NULL, NULL) == 1
        && EVP_CIPHER_CTX_ctrl(c, EVP_CTRL_GCM_SET_IVLEN, (int)nonce_boy,
                               NULL) == 1
        && EVP_EncryptInit_ex(c, NULL, NULL, anahtar, nonce) == 1) {
        int d = 0;
        if (aad && aad_boy)
            EVP_EncryptUpdate(c, NULL, &d, aad, (int)aad_boy);
        EVP_EncryptUpdate(c, ct, &len, pt, (int)pt_boy);
        EVP_EncryptFinal_ex(c, ct + len, &d);
        if (EVP_CIPHER_CTX_ctrl(c, EVP_CTRL_GCM_GET_TAG, 16, tag) == 1)
            ok = 1;
    }
    EVP_CIPHER_CTX_free(c);
    return ok;
#endif
}

/* Basari (etiket dogru) icin 1, dogrulama basarisiz icin 0. */
static inline int kripto_gcm_coz(const unsigned char *anahtar,
                          const unsigned char *nonce, size_t nonce_boy,
                          const unsigned char *aad, size_t aad_boy,
                          const unsigned char *ct, size_t ct_boy,
                          const unsigned char tag[16], unsigned char *pt)
{
#ifdef _WIN32
    BCRYPT_ALG_HANDLE alg = NULL;
    BCRYPT_KEY_HANDLE k = NULL;
    BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO info;
    ULONG yazilan = 0;
    int ok = 0;
    if (BCryptOpenAlgorithmProvider(&alg, BCRYPT_AES_ALGORITHM, NULL, 0)
        != STATUS_SUCCESS)
        return 0;
    BCryptSetProperty(alg, BCRYPT_CHAINING_MODE,
                      (PUCHAR)BCRYPT_CHAIN_MODE_GCM,
                      sizeof(BCRYPT_CHAIN_MODE_GCM), 0);
    if (BCryptGenerateSymmetricKey(alg, &k, NULL, 0, (PUCHAR)anahtar, 32, 0)
        == STATUS_SUCCESS) {
        NTSTATUS s;
        BCRYPT_INIT_AUTH_MODE_INFO(info);
        info.pbNonce = (PUCHAR)nonce;
        info.cbNonce = (ULONG)nonce_boy;
        info.pbAuthData = (PUCHAR)aad;
        info.cbAuthData = (ULONG)aad_boy;
        info.pbTag = (PUCHAR)tag;
        info.cbTag = 16;
        s = BCryptDecrypt(k, (PUCHAR)ct, (ULONG)ct_boy, &info, NULL, 0,
                          pt, (ULONG)ct_boy, &yazilan, 0);
        ok = (s == STATUS_SUCCESS);
        BCryptDestroyKey(k);
    }
    BCryptCloseAlgorithmProvider(alg, 0);
    return ok;
#else
    EVP_CIPHER_CTX *c = EVP_CIPHER_CTX_new();
    int len = 0, ok = 0;
    if (!c)
        return 0;
    if (EVP_DecryptInit_ex(c, EVP_aes_256_gcm(), NULL, NULL, NULL) == 1
        && EVP_CIPHER_CTX_ctrl(c, EVP_CTRL_GCM_SET_IVLEN, (int)nonce_boy,
                               NULL) == 1
        && EVP_DecryptInit_ex(c, NULL, NULL, anahtar, nonce) == 1) {
        int d = 0;
        if (aad && aad_boy)
            EVP_DecryptUpdate(c, NULL, &d, aad, (int)aad_boy);
        EVP_DecryptUpdate(c, pt, &len, ct, (int)ct_boy);
        if (EVP_CIPHER_CTX_ctrl(c, EVP_CTRL_GCM_SET_TAG, 16,
                                (void *)tag) == 1
            && EVP_DecryptFinal_ex(c, pt + len, &d) == 1)
            ok = 1;
    }
    EVP_CIPHER_CTX_free(c);
    return ok;
#endif
}

/* ==================================================================== */
/*  7) AES tek blok ECB (yalniz desen sizintisi demosu icin)             */
/*     anahtar_boy 16 (AES-128) ya da 32 (AES-256) olabilir.             */
/* ==================================================================== */
static inline int kripto_aes_ecb_blok(const unsigned char *anahtar,
                               size_t anahtar_boy,
                               const unsigned char giris[16],
                               unsigned char cikti[16])
{
#ifdef _WIN32
    BCRYPT_ALG_HANDLE alg = NULL;
    BCRYPT_KEY_HANDLE k = NULL;
    ULONG yazilan = 0;
    int ok = 0;
    if (BCryptOpenAlgorithmProvider(&alg, BCRYPT_AES_ALGORITHM, NULL, 0)
        != STATUS_SUCCESS)
        return 0;
    BCryptSetProperty(alg, BCRYPT_CHAINING_MODE,
                      (PUCHAR)BCRYPT_CHAIN_MODE_ECB,
                      sizeof(BCRYPT_CHAIN_MODE_ECB), 0);
    if (BCryptGenerateSymmetricKey(alg, &k, NULL, 0, (PUCHAR)anahtar,
                                   (ULONG)anahtar_boy, 0) == STATUS_SUCCESS) {
        if (BCryptEncrypt(k, (PUCHAR)giris, 16, NULL, NULL, 0, cikti, 16,
                          &yazilan, 0) == STATUS_SUCCESS)
            ok = 1;
        BCryptDestroyKey(k);
    }
    BCryptCloseAlgorithmProvider(alg, 0);
    return ok;
#else
    const EVP_CIPHER *sifre = (anahtar_boy == 32) ? EVP_aes_256_ecb()
                                                  : EVP_aes_128_ecb();
    EVP_CIPHER_CTX *c = EVP_CIPHER_CTX_new();
    int len = 0, ok = 0;
    if (!c)
        return 0;
    if (EVP_EncryptInit_ex(c, sifre, NULL, anahtar, NULL) == 1) {
        EVP_CIPHER_CTX_set_padding(c, 0);
        if (EVP_EncryptUpdate(c, cikti, &len, giris, 16) == 1)
            ok = 1;
    }
    EVP_CIPHER_CTX_free(c);
    return ok;
#endif
}

/* Bellek silme (her platformda kaldirilamaz). */
static inline void kripto_temizle(void *p, size_t n)
{
#ifdef _WIN32
    SecureZeroMemory(p, n);
#else
    OPENSSL_cleanse(p, n);
#endif
}

#endif /* CEN429_KRIPTO_H */
