/*
 * CEN429 - shared cryptography helper (every function in this header is static/inline)
 *
 * Purpose: let the week 3 demos compile and run from the SAME source on both Linux/WSL (OpenSSL EVP)
 * and Windows (BCrypt CNG). The student's Windows machine may not have OpenSSL installed, so on
 * Windows we use the operating system's own crypto library (Cryptography API: Next Generation). This
 * dual approach mirrors the textbook (Viega & Messier), which gives both the OpenSSL and the Windows
 * CryptoAPI recipes.
 *
 * Linking:
 *   Linux/WSL : -lcrypto   (works with both OpenSSL 1.1.1 and 3.x; only uses the high-level EVP API,
 *               never touches the low-level AES_/RSA_ structures)
 *   Windows   : bcrypt.lib
 *
 * Design: the platform-specific primitives are RANDOM BYTES, SHA-256 (incremental) and AES (GCM,
 * single ECB block). HMAC, HKDF and PBKDF2 are built PORTABLY on top of those (following the matching
 * RFC), so the code is identical on both platforms and can be checked against known-answer test
 * vectors (RFC 4231/5869/6070, NIST GCM).
 *
 * Every function returns 1 on success and 0 on failure (unless stated otherwise).
 */
#ifndef CEN429_CRYPTO_H
#define CEN429_CRYPTO_H

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
/*  1) Random bytes                                                     */
/* ==================================================================== */
static inline int crypto_random(unsigned char *buffer, size_t size)
{
#ifdef _WIN32
    return BCryptGenRandom(NULL, buffer, (ULONG)size,
                           BCRYPT_USE_SYSTEM_PREFERRED_RNG)
           == STATUS_SUCCESS;
#else
    return RAND_bytes(buffer, (int)size) == 1;
#endif
}

/* ==================================================================== */
/*  2) SHA-256 - incremental (init/update/final), platform-specific primitive */
/* ==================================================================== */
typedef struct {
#ifdef _WIN32
    BCRYPT_ALG_HANDLE alg;
    BCRYPT_HASH_HANDLE h;
#else
    EVP_MD_CTX *ctx;
#endif
} crypto_sha256_ctx;

static inline int crypto_sha256_init(crypto_sha256_ctx *c)
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

static inline int crypto_sha256_update(crypto_sha256_ctx *c, const void *data,
                              size_t size)
{
#ifdef _WIN32
    return BCryptHashData(c->h, (PUCHAR)data, (ULONG)size, 0)
           == STATUS_SUCCESS;
#else
    return EVP_DigestUpdate(c->ctx, data, size) == 1;
#endif
}

static inline int crypto_sha256_final(crypto_sha256_ctx *c, unsigned char digest[32])
{
#ifdef _WIN32
    NTSTATUS s = BCryptFinishHash(c->h, digest, 32, 0);
    BCryptDestroyHash(c->h);
    BCryptCloseAlgorithmProvider(c->alg, 0);
    c->h = NULL;
    c->alg = NULL;
    return s == STATUS_SUCCESS;
#else
    unsigned int n = 32;
    int ok = EVP_DigestFinal_ex(c->ctx, digest, &n) == 1;
    EVP_MD_CTX_free(c->ctx);
    c->ctx = NULL;
    return ok;
#endif
}

/* One-shot SHA-256. */
static inline int crypto_sha256(const void *data, size_t size, unsigned char digest[32])
{
    crypto_sha256_ctx c;
    if (!crypto_sha256_init(&c))
        return 0;
    if (!crypto_sha256_update(&c, data, size)) {
        crypto_sha256_final(&c, digest);
        return 0;
    }
    return crypto_sha256_final(&c, digest);
}

/* ==================================================================== */
/*  3) HMAC-SHA256 - portable (RFC 2104), built only on top of SHA-256   */
/* ==================================================================== */
#define CRYPTO_BLOCK 64      /* SHA-256 block size */

static inline int crypto_hmac_sha256(const unsigned char *key, size_t key_len,
                              const void *data, size_t data_len,
                              unsigned char out[32])
{
    unsigned char k0[CRYPTO_BLOCK], ipad[CRYPTO_BLOCK], opad[CRYPTO_BLOCK];
    unsigned char inner[32];
    crypto_sha256_ctx c;

    if (key_len > CRYPTO_BLOCK) {
        if (!crypto_sha256(key, key_len, k0))
            return 0;
        memset(k0 + 32, 0, CRYPTO_BLOCK - 32);
    } else {
        memcpy(k0, key, key_len);
        memset(k0 + key_len, 0, CRYPTO_BLOCK - key_len);
    }
    for (int i = 0; i < CRYPTO_BLOCK; i++) {
        ipad[i] = (unsigned char)(k0[i] ^ 0x36);
        opad[i] = (unsigned char)(k0[i] ^ 0x5c);
    }
    /* inner = SHA256(ipad || data) */
    if (!crypto_sha256_init(&c))
        return 0;
    if (!crypto_sha256_update(&c, ipad, CRYPTO_BLOCK)
        || !crypto_sha256_update(&c, data, data_len)
        || !crypto_sha256_final(&c, inner))
        return 0;
    /* out = SHA256(opad || inner) */
    if (!crypto_sha256_init(&c))
        return 0;
    if (!crypto_sha256_update(&c, opad, CRYPTO_BLOCK)
        || !crypto_sha256_update(&c, inner, 32)
        || !crypto_sha256_final(&c, out))
        return 0;
    return 1;
}

/* ==================================================================== */
/*  4) HKDF-SHA256 - portable (RFC 5869), built on top of HMAC          */
/* ==================================================================== */
static inline int crypto_hkdf_sha256(const unsigned char *ikm, size_t ikm_len,
                              const unsigned char *salt, size_t salt_len,
                              const unsigned char *info, size_t info_len,
                              unsigned char *out, size_t out_len)
{
    unsigned char prk[32];
    unsigned char zero_salt[32];
    unsigned char t[32];
    size_t t_len = 0;
    unsigned char counter = 1;
    size_t written = 0;

    if (!salt || salt_len == 0) {
        memset(zero_salt, 0, sizeof(zero_salt));
        salt = zero_salt;
        salt_len = sizeof(zero_salt);
    }
    /* Extract: PRK = HMAC(salt, ikm) */
    if (!crypto_hmac_sha256(salt, salt_len, ikm, ikm_len, prk))
        return 0;

    /* Expand: T(i) = HMAC(PRK, T(i-1) || info || i) */
    while (written < out_len) {
        crypto_sha256_ctx c;      /* HMAC built by hand so we can stream the blocks */
        unsigned char k0[CRYPTO_BLOCK], ipad[CRYPTO_BLOCK], opad[CRYPTO_BLOCK];
        unsigned char inner[32];
        memcpy(k0, prk, 32);
        memset(k0 + 32, 0, CRYPTO_BLOCK - 32);
        for (int i = 0; i < CRYPTO_BLOCK; i++) {
            ipad[i] = (unsigned char)(k0[i] ^ 0x36);
            opad[i] = (unsigned char)(k0[i] ^ 0x5c);
        }
        if (!crypto_sha256_init(&c)
            || !crypto_sha256_update(&c, ipad, CRYPTO_BLOCK)
            || !crypto_sha256_update(&c, t, t_len)
            || !crypto_sha256_update(&c, info, info_len)
            || !crypto_sha256_update(&c, &counter, 1)
            || !crypto_sha256_final(&c, inner))
            return 0;
        if (!crypto_sha256_init(&c)
            || !crypto_sha256_update(&c, opad, CRYPTO_BLOCK)
            || !crypto_sha256_update(&c, inner, 32)
            || !crypto_sha256_final(&c, t))
            return 0;
        t_len = 32;
        size_t take = (out_len - written < 32) ? out_len - written : 32;
        memcpy(out + written, t, take);
        written += take;
        counter++;
    }
    return 1;
}

/* ==================================================================== */
/*  5) PBKDF2-HMAC-SHA256 - portable (RFC 2898/8018), built on top of HMAC */
/* ==================================================================== */
static inline int crypto_pbkdf2_sha256(const unsigned char *password, size_t password_len,
                                const unsigned char *salt, size_t salt_len,
                                uint32_t rounds, unsigned char *out,
                                size_t out_len)
{
    uint32_t block = 1;
    size_t written = 0;
    while (written < out_len) {
        unsigned char u[32], t[32];
        unsigned char be[4];
        crypto_sha256_ctx c;
        unsigned char k0[CRYPTO_BLOCK], ipad[CRYPTO_BLOCK], opad[CRYPTO_BLOCK];
        unsigned char inner[32];
        /* U1 = HMAC(password, salt || INT_BE(block)) - HMAC built by hand. */
        be[0] = (unsigned char)(block >> 24);
        be[1] = (unsigned char)(block >> 16);
        be[2] = (unsigned char)(block >> 8);
        be[3] = (unsigned char)(block);
        if (password_len > CRYPTO_BLOCK) {
            if (!crypto_sha256(password, password_len, k0))
                return 0;
            memset(k0 + 32, 0, CRYPTO_BLOCK - 32);
        } else {
            memcpy(k0, password, password_len);
            memset(k0 + password_len, 0, CRYPTO_BLOCK - password_len);
        }
        for (int i = 0; i < CRYPTO_BLOCK; i++) {
            ipad[i] = (unsigned char)(k0[i] ^ 0x36);
            opad[i] = (unsigned char)(k0[i] ^ 0x5c);
        }
        if (!crypto_sha256_init(&c)
            || !crypto_sha256_update(&c, ipad, CRYPTO_BLOCK)
            || !crypto_sha256_update(&c, salt, salt_len)
            || !crypto_sha256_update(&c, be, 4)
            || !crypto_sha256_final(&c, inner))
            return 0;
        if (!crypto_sha256_init(&c)
            || !crypto_sha256_update(&c, opad, CRYPTO_BLOCK)
            || !crypto_sha256_update(&c, inner, 32)
            || !crypto_sha256_final(&c, u))
            return 0;
        memcpy(t, u, 32);
        /* U2..Uc = HMAC(password, U_{i-1}); T ^= Ui */
        for (uint32_t j = 1; j < rounds; j++) {
            if (!crypto_hmac_sha256(password, password_len, u, 32, u))
                return 0;
            for (int i = 0; i < 32; i++)
                t[i] ^= u[i];
        }
        size_t take = (out_len - written < 32) ? out_len - written : 32;
        memcpy(out + written, t, take);
        written += take;
        block++;
    }
    return 1;
}

/* ==================================================================== */
/*  6) AES-256-GCM - platform-specific (EVP / BCrypt)                    */
/*     Format: the caller allocates ptlen bytes for ct and 16 bytes for tag. */
/* ==================================================================== */
static inline int crypto_gcm_encrypt(const unsigned char *key,
                              const unsigned char *nonce, size_t nonce_len,
                              const unsigned char *aad, size_t aad_len,
                              const unsigned char *pt, size_t pt_len,
                              unsigned char *ct, unsigned char tag[16])
{
#ifdef _WIN32
    BCRYPT_ALG_HANDLE alg = NULL;
    BCRYPT_KEY_HANDLE k = NULL;
    BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO info;
    ULONG written = 0;
    int ok = 0;
    if (BCryptOpenAlgorithmProvider(&alg, BCRYPT_AES_ALGORITHM, NULL, 0)
        != STATUS_SUCCESS)
        return 0;
    BCryptSetProperty(alg, BCRYPT_CHAINING_MODE,
                      (PUCHAR)BCRYPT_CHAIN_MODE_GCM,
                      sizeof(BCRYPT_CHAIN_MODE_GCM), 0);
    if (BCryptGenerateSymmetricKey(alg, &k, NULL, 0, (PUCHAR)key, 32, 0)
        == STATUS_SUCCESS) {
        BCRYPT_INIT_AUTH_MODE_INFO(info);
        info.pbNonce = (PUCHAR)nonce;
        info.cbNonce = (ULONG)nonce_len;
        info.pbAuthData = (PUCHAR)aad;
        info.cbAuthData = (ULONG)aad_len;
        info.pbTag = tag;
        info.cbTag = 16;
        if (BCryptEncrypt(k, (PUCHAR)pt, (ULONG)pt_len, &info, NULL, 0,
                          ct, (ULONG)pt_len, &written, 0) == STATUS_SUCCESS)
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
        && EVP_CIPHER_CTX_ctrl(c, EVP_CTRL_GCM_SET_IVLEN, (int)nonce_len,
                               NULL) == 1
        && EVP_EncryptInit_ex(c, NULL, NULL, key, nonce) == 1) {
        int d = 0;
        if (aad && aad_len)
            EVP_EncryptUpdate(c, NULL, &d, aad, (int)aad_len);
        EVP_EncryptUpdate(c, ct, &len, pt, (int)pt_len);
        EVP_EncryptFinal_ex(c, ct + len, &d);
        if (EVP_CIPHER_CTX_ctrl(c, EVP_CTRL_GCM_GET_TAG, 16, tag) == 1)
            ok = 1;
    }
    EVP_CIPHER_CTX_free(c);
    return ok;
#endif
}

/* Returns 1 on success (tag correct), 0 when verification fails. */
static inline int crypto_gcm_decrypt(const unsigned char *key,
                          const unsigned char *nonce, size_t nonce_len,
                          const unsigned char *aad, size_t aad_len,
                          const unsigned char *ct, size_t ct_len,
                          const unsigned char tag[16], unsigned char *pt)
{
#ifdef _WIN32
    BCRYPT_ALG_HANDLE alg = NULL;
    BCRYPT_KEY_HANDLE k = NULL;
    BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO info;
    ULONG written = 0;
    int ok = 0;
    if (BCryptOpenAlgorithmProvider(&alg, BCRYPT_AES_ALGORITHM, NULL, 0)
        != STATUS_SUCCESS)
        return 0;
    BCryptSetProperty(alg, BCRYPT_CHAINING_MODE,
                      (PUCHAR)BCRYPT_CHAIN_MODE_GCM,
                      sizeof(BCRYPT_CHAIN_MODE_GCM), 0);
    if (BCryptGenerateSymmetricKey(alg, &k, NULL, 0, (PUCHAR)key, 32, 0)
        == STATUS_SUCCESS) {
        NTSTATUS s;
        BCRYPT_INIT_AUTH_MODE_INFO(info);
        info.pbNonce = (PUCHAR)nonce;
        info.cbNonce = (ULONG)nonce_len;
        info.pbAuthData = (PUCHAR)aad;
        info.cbAuthData = (ULONG)aad_len;
        info.pbTag = (PUCHAR)tag;
        info.cbTag = 16;
        s = BCryptDecrypt(k, (PUCHAR)ct, (ULONG)ct_len, &info, NULL, 0,
                          pt, (ULONG)ct_len, &written, 0);
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
        && EVP_CIPHER_CTX_ctrl(c, EVP_CTRL_GCM_SET_IVLEN, (int)nonce_len,
                               NULL) == 1
        && EVP_DecryptInit_ex(c, NULL, NULL, key, nonce) == 1) {
        int d = 0;
        if (aad && aad_len)
            EVP_DecryptUpdate(c, NULL, &d, aad, (int)aad_len);
        EVP_DecryptUpdate(c, pt, &len, ct, (int)ct_len);
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
/*  7) Single AES ECB block (only for the pattern-leak demo)             */
/*     key_len can be 16 (AES-128) or 32 (AES-256).                      */
/* ==================================================================== */
static inline int crypto_aes_ecb_block(const unsigned char *key,
                               size_t key_len,
                               const unsigned char in[16],
                               unsigned char out[16])
{
#ifdef _WIN32
    BCRYPT_ALG_HANDLE alg = NULL;
    BCRYPT_KEY_HANDLE k = NULL;
    ULONG written = 0;
    int ok = 0;
    if (BCryptOpenAlgorithmProvider(&alg, BCRYPT_AES_ALGORITHM, NULL, 0)
        != STATUS_SUCCESS)
        return 0;
    BCryptSetProperty(alg, BCRYPT_CHAINING_MODE,
                      (PUCHAR)BCRYPT_CHAIN_MODE_ECB,
                      sizeof(BCRYPT_CHAIN_MODE_ECB), 0);
    if (BCryptGenerateSymmetricKey(alg, &k, NULL, 0, (PUCHAR)key,
                                   (ULONG)key_len, 0) == STATUS_SUCCESS) {
        if (BCryptEncrypt(k, (PUCHAR)in, 16, NULL, NULL, 0, out, 16,
                          &written, 0) == STATUS_SUCCESS)
            ok = 1;
        BCryptDestroyKey(k);
    }
    BCryptCloseAlgorithmProvider(alg, 0);
    return ok;
#else
    const EVP_CIPHER *cipher = (key_len == 32) ? EVP_aes_256_ecb()
                                                  : EVP_aes_128_ecb();
    EVP_CIPHER_CTX *c = EVP_CIPHER_CTX_new();
    int len = 0, ok = 0;
    if (!c)
        return 0;
    if (EVP_EncryptInit_ex(c, cipher, NULL, key, NULL) == 1) {
        EVP_CIPHER_CTX_set_padding(c, 0);
        if (EVP_EncryptUpdate(c, out, &len, in, 16) == 1)
            ok = 1;
    }
    EVP_CIPHER_CTX_free(c);
    return ok;
#endif
}

/* Memory wipe (cannot be optimized away on any platform). */
static inline void crypto_wipe(void *p, size_t n)
{
#ifdef _WIN32
    SecureZeroMemory(p, n);
#else
    OPENSSL_cleanse(p, n);
#endif
}

#endif /* CEN429_CRYPTO_H */
