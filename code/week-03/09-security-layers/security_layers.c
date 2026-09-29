/*
 * CEN429 - Week 3 - Demo 9: security layers (layered data protection)
 *
 * A concrete form of defense in depth: instead of trusting ONE protection
 * for a secret (a payment key), you wrap it in nested LAYERS. An attacker
 * must open every layer, IN ORDER, to reach the secret.
 *
 * This demo wraps a key in four layers (innermost -> outermost):
 *   Layer 1 - Device binding: the key is AES-GCM-encrypted with a key
 *             derived (HKDF) from the device fingerprint. It cannot be
 *             opened on a different device (a different fingerprint).
 *   Layer 2 - Storage (at rest): AES-GCM with the wallet key.
 *   Layer 3 - Session (application layer): AES-GCM with the session key.
 *   Layer 4 - Channel (TLS-like): AES-GCM with the channel key.
 *
 * Wrapping goes outward (in), UNWRAPPING goes inward-to-outward (in the
 * opposite order it was wrapped). If any layer's key is wrong, or the
 * data was tampered with, the GCM tag does not match and unwrapping is
 * REJECTED at that layer. The "wrong device" scenario makes Layer 1
 * unbreakable even if the outer key material is copied.
 *
 * This is a TEACHING simulation; in real products the inner layer is
 * often whitebox cryptography (Week 11). All values are synthetic.
 */
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include <stdio.h>
#include <string.h>

#define NONCE_LEN 12
#define TAG_LEN 16
#define KEY_LEN 32

/* One GCM layer: [nonce|ciphertext|tag]. Returns: the output length. */
static int wrap(const unsigned char *k, const unsigned char *plain,
               int plain_len, unsigned char *out)
{
    unsigned char nonce[NONCE_LEN], tag[TAG_LEN];
    crypto_random(nonce, NONCE_LEN);
    memcpy(out, nonce, NONCE_LEN);
    crypto_gcm_encrypt(k, nonce, NONCE_LEN, NULL, 0, plain, (size_t)plain_len,
                       out + NONCE_LEN, tag);
    memcpy(out + NONCE_LEN + plain_len, tag, TAG_LEN);
    return NONCE_LEN + plain_len + TAG_LEN;
}

/* Opens one GCM layer. Returns: the plaintext length, or -1 on failed verification. */
static int unwrap(const unsigned char *k, const unsigned char *data, int len,
              unsigned char *plain)
{
    if (len < NONCE_LEN + TAG_LEN)
        return -1;
    int ct_len = len - NONCE_LEN - TAG_LEN;
    const unsigned char *nonce = data;
    const unsigned char *ct = data + NONCE_LEN;
    const unsigned char *tag = data + NONCE_LEN + ct_len;
    if (!crypto_gcm_decrypt(k, nonce, NONCE_LEN, NULL, 0, ct, (size_t)ct_len, tag,
                        plain))
        return -1;
    return ct_len;
}

/* Derives the Layer-1 key from the device fingerprint with HKDF. */
static void device_key(const char *fingerprint, unsigned char *k)
{
    unsigned char salt[8] = { 'c', 'e', 'n', '4', '2', '9', 'k', '1' };
    crypto_hkdf_sha256((const unsigned char *)fingerprint,
                       strlen(fingerprint), salt, sizeof(salt),
                       (const unsigned char *)"device binding", 14, k,
                       KEY_LEN);
}

int main(void)
{
    demo_prepare();
    /* The secret being protected (a synthetic payment key). */
    unsigned char secret[16] = {
        0xDE, 0xAD, 0xBE, 0xEF, 0x01, 0x23, 0x45, 0x67,
        0x89, 0xAB, 0xCD, 0xEF, 0xFE, 0xDC, 0xBA, 0x98 };

    unsigned char k_device[KEY_LEN];
    unsigned char k_wallet[KEY_LEN], k_session[KEY_LEN];
    unsigned char k_channel[KEY_LEN];
    device_key("manufacturer=RTEU;model=DEMO;serial=SN-0001", k_device);
    memset(k_wallet, 0x11, KEY_LEN);
    memset(k_session, 0x22, KEY_LEN);
    memset(k_channel, 0x33, KEY_LEN);

    unsigned char t1[128], t2[192], t3[256], t4[320];
    int n1, n2, n3, n4;

    printf("SECRET (16 bytes): ");
    for (int i = 0; i < 16; i++) printf("%02x", secret[i]);
    printf("\n==============================================================\n");
    printf("WRAPPING (outward): secret -> K1 -> K2 -> K3 -> K4\n");
    n1 = wrap(k_device, secret, 16, t1);
    printf("  Layer 1 (device binding)     : %3d bytes\n", n1);
    n2 = wrap(k_wallet, t1, n1, t2);
    printf("  Layer 2 (storage/wallet)     : %3d bytes\n", n2);
    n3 = wrap(k_session, t2, n2, t3);
    printf("  Layer 3 (session/application): %3d bytes\n", n3);
    n4 = wrap(k_channel, t3, n3, t4);
    printf("  Layer 4 (channel/TLS-like)   : %3d bytes  <- transmitted packet\n",
           n4);

    printf("==============================================================\n");
    printf("UNWRAPPING (inward): K4 -> K3 -> K2 -> K1 -> secret\n");
    unsigned char a3[256], a2[192], a1[128], plain[64];
    int m;
    m = unwrap(k_channel, t4, n4, a3);
    printf("  Layer 4 opened: %s\n", m > 0 ? "OK" : "REJECTED");
    m = unwrap(k_session, a3, m, a2);
    printf("  Layer 3 opened: %s\n", m > 0 ? "OK" : "REJECTED");
    m = unwrap(k_wallet, a2, m, a1);
    printf("  Layer 2 opened: %s\n", m > 0 ? "OK" : "REJECTED");
    m = unwrap(k_device, a1, m, plain);
    printf("  Layer 1 opened: %s\n", m > 0 ? "OK" : "REJECTED");
    printf("  Recovered SECRET : ");
    for (int i = 0; i < m; i++) printf("%02x", plain[i]);
    printf("  -> %s\n", (m == 16 && memcmp(plain, secret, 16) == 0)
           ? "secret CORRECT" : "ERROR");

    printf("==============================================================\n");
    printf("ATTACK 1 - if one bit of the packet is tampered with (Layer 4):\n");
    unsigned char corrupted[320];
    memcpy(corrupted, t4, n4);
    corrupted[NONCE_LEN + 3] ^= 0x01;
    m = unwrap(k_channel, corrupted, n4, a3);
    printf("  Layer 4 opened: %s  (the GCM tag did not match)\n",
           m > 0 ? "OK" : "REJECTED");

    printf("==============================================================\n");
    printf("ATTACK 2 - if the packet is copied to ANOTHER device (wrong "
           "fingerprint):\n");
    unsigned char k_other[KEY_LEN];
    device_key("manufacturer=RTEU;model=DEMO;serial=SN-9999", k_other);
    /* The outer 3 layers open fine (the keys are portable); the inner layer is device-bound. */
    int mm = unwrap(k_channel, t4, n4, a3);
    mm = unwrap(k_session, a3, mm, a2);
    mm = unwrap(k_wallet, a2, mm, a1);
    printf("  Outer 3 layers opened: %s\n", mm > 0 ? "OK" : "REJECTED");
    int last = unwrap(k_other, a1, mm, plain);
    printf("  Layer 1 (device binding) opened on the OTHER device: %s\n",
           last > 0 ? "OK" : "REJECTED");
    printf("  ^ Even with the keys copied, the secret CANNOT be opened on "
           "another device.\n");

    crypto_wipe(plain, sizeof(plain));
    crypto_wipe(k_device, sizeof(k_device));
    return 0;
}
