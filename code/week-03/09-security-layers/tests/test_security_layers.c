/* Unit tests for week-03/09-security-layers/security_layers.c. */
#define main program_main
#include "../security_layers.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    unsigned char k[KEY_LEN]; memset(k, 0x99, KEY_LEN);

    /* --- wrap()/unwrap(): round trip for several plaintext sizes ---------------------------- */
    {
        const unsigned char msg[16] = { 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15 };
        unsigned char wrapped[64], back[16];
        int n = wrap(k, msg, 16, wrapped);
        CHECK_EQ_INT(n, NONCE_LEN + 16 + TAG_LEN);
        int m = unwrap(k, wrapped, n, back);
        CHECK_EQ_INT(m, 16);
        CHECK_MEM(back, msg, 16);
    }
    {
        unsigned char wrapped[64], back[8];
        int n = wrap(k, (const unsigned char *)"", 0, wrapped);
        CHECK_EQ_INT(n, NONCE_LEN + TAG_LEN);
        int m = unwrap(k, wrapped, n, back);
        CHECK_EQ_INT(m, 0);
    }

    /* --- unwrap() rejects a tampered layer (ciphertext byte flipped) ------------------------ */
    {
        const unsigned char msg[8] = "abcdefg";
        unsigned char wrapped[64], back[16];
        int n = wrap(k, msg, 7, wrapped);
        wrapped[NONCE_LEN] ^= 0x01;
        CHECK_EQ_INT(unwrap(k, wrapped, n, back), -1);
    }
    /* unwrap() rejects a too-short buffer instead of reading out of bounds */
    {
        unsigned char tiny[NONCE_LEN + TAG_LEN - 1];
        memset(tiny, 0, sizeof(tiny));
        unsigned char back[8];
        CHECK_EQ_INT(unwrap(k, tiny, sizeof(tiny), back), -1);
    }
    /* unwrap() with the WRONG key rejects (even on an untampered blob) */
    {
        unsigned char wrong[KEY_LEN]; memset(wrong, 0x11, KEY_LEN);
        const unsigned char msg[8] = "abcdefg";
        unsigned char wrapped[64], back[16];
        int n = wrap(k, msg, 7, wrapped);
        CHECK_EQ_INT(unwrap(wrong, wrapped, n, back), -1);
    }

    /* --- device_key(): different fingerprints give different keys, same fingerprint repeats - */
    {
        unsigned char k1[KEY_LEN], k2[KEY_LEN], k1_again[KEY_LEN];
        device_key("manufacturer=RTEU;model=DEMO;serial=SN-0001", k1);
        device_key("manufacturer=RTEU;model=DEMO;serial=SN-9999", k2);
        device_key("manufacturer=RTEU;model=DEMO;serial=SN-0001", k1_again);
        CHECK(memcmp(k1, k2, KEY_LEN) != 0);
        CHECK_MEM(k1, k1_again, KEY_LEN);
    }

    /* --- the full 4-layer wrap/unwrap round trip, exactly as main() does -------------------- */
    {
        unsigned char secret[16] = { 0xDE,0xAD,0xBE,0xEF,0x01,0x23,0x45,0x67,
                                      0x89,0xAB,0xCD,0xEF,0xFE,0xDC,0xBA,0x98 };
        unsigned char k_device[KEY_LEN], k_wallet[KEY_LEN], k_session[KEY_LEN], k_channel[KEY_LEN];
        device_key("manufacturer=RTEU;model=DEMO;serial=SN-0001", k_device);
        memset(k_wallet, 0x11, KEY_LEN);
        memset(k_session, 0x22, KEY_LEN);
        memset(k_channel, 0x33, KEY_LEN);

        unsigned char t1[128], t2[192], t3[256], t4[320];
        int n1 = wrap(k_device, secret, 16, t1);
        int n2 = wrap(k_wallet, t1, n1, t2);
        int n3 = wrap(k_session, t2, n2, t3);
        int n4 = wrap(k_channel, t3, n3, t4);

        unsigned char a3[256], a2[192], a1[128], plain[64];
        int m = unwrap(k_channel, t4, n4, a3);
        CHECK(m > 0);
        m = unwrap(k_session, a3, m, a2);
        CHECK(m > 0);
        m = unwrap(k_wallet, a2, m, a1);
        CHECK(m > 0);
        m = unwrap(k_device, a1, m, plain);
        CHECK_EQ_INT(m, 16);
        CHECK_MEM(plain, secret, 16);

        /* --- wrong device (different fingerprint): outer 3 layers open, Layer 1 rejects ----- */
        unsigned char k_other[KEY_LEN];
        device_key("manufacturer=RTEU;model=DEMO;serial=SN-9999", k_other);
        int mm = unwrap(k_channel, t4, n4, a3);
        CHECK(mm > 0);
        mm = unwrap(k_session, a3, mm, a2);
        CHECK(mm > 0);
        mm = unwrap(k_wallet, a2, mm, a1);
        CHECK(mm > 0);
        CHECK_EQ_INT(unwrap(k_other, a1, mm, plain), -1);
    }

    /* --- the demo program itself runs cleanly end-to-end (smoke test) ---------------------- */
    CHECK_EQ_INT(program_main(), 0);

    TEST_SUMMARY();
}
