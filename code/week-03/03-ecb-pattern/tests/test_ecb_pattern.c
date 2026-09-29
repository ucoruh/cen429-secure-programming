/* Unit tests for week-03/03-ecb-pattern/ecb_pattern.c.
 *
 * The demo's claim is a property of the crypto primitives, not of draw_encrypted()'s printing, so
 * these tests rebuild the same plaintext picture from the shared `image[][]` array (plain data
 * setup, not an algorithm worth re-deriving) and then call the REAL crypto_aes_ecb_block() /
 * crypto_gcm_encrypt() to check: (a) ECB gives identical ciphertext blocks for identical plaintext
 * blocks — the leak — and (b) GCM/CTR gives different ciphertext for identical plaintext blocks at
 * different positions — no leak.
 */
#define main program_main
#include "../ecb_pattern.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- image[][] sanity: shape, only '0'/'1', a frame of '1's ---------------------------- */
    CHECK_EQ_INT((int)strlen(image[0]), WIDTH);
    CHECK_EQ_INT((int)strlen(image[HEIGHT - 1]), WIDTH);
    for (int x = 0; x < WIDTH; x++)
        CHECK_EQ_INT(image[0][x], '1');           /* top frame row is solid */
    CHECK_EQ_INT(image[1][0], '1');                /* left frame column */
    CHECK_EQ_INT(image[1][WIDTH - 1], '1');        /* right frame column */
    CHECK_EQ_INT(image[1][1], '0');                /* just inside the frame: background */

    /* --- build the plaintext picture exactly as main() does --------------------------------- */
    static unsigned char plain[WIDTH * HEIGHT * BLOCK];
    for (int y = 0; y < HEIGHT; y++)
        for (int x = 0; x < WIDTH; x++) {
            unsigned char v = (image[y][x] == '1') ? 0xFF : 0x00;
            memset(plain + (y * WIDTH + x) * BLOCK, v, BLOCK);
        }
    /* sanity on the picture itself: block (1,1) is background (all 0x00), block (0,0) is shape */
    CHECK_EQ_INT(plain[(1 * WIDTH + 1) * BLOCK], 0x00);
    CHECK_EQ_INT(plain[(0 * WIDTH + 0) * BLOCK], 0xFF);

    unsigned char key16[16];
    memset(key16, 0x11, sizeof(key16));
    static unsigned char ecb[WIDTH * HEIGHT * BLOCK];
    for (int i = 0; i < WIDTH * HEIGHT; i++)
        CHECK(crypto_aes_ecb_block(key16, 16, plain + i * BLOCK, ecb + i * BLOCK));

    /* --- ECB LEAK: two different background blocks encrypt to the SAME ciphertext ---------- */
    {
        int bg1 = 1 * WIDTH + 1;    /* background pixel */
        int bg2 = 1 * WIDTH + 2;    /* a different background pixel */
        CHECK_MEM(ecb + bg1 * BLOCK, ecb + bg2 * BLOCK, BLOCK);
    }
    /* two different shape blocks also encrypt to the SAME ciphertext */
    {
        int sh1 = 0 * WIDTH + 0;    /* shape pixel (top frame) */
        int sh2 = 0 * WIDTH + 5;    /* another shape pixel (top frame) */
        CHECK_MEM(ecb + sh1 * BLOCK, ecb + sh2 * BLOCK, BLOCK);
    }
    /* a background block and a shape block encrypt DIFFERENTLY (different plaintext) */
    {
        int bg = 1 * WIDTH + 1, sh = 0 * WIDTH + 0;
        CHECK(memcmp(ecb + bg * BLOCK, ecb + sh * BLOCK, BLOCK) != 0);
    }

    /* --- GCM/CTR: the SAME two background blocks now encrypt DIFFERENTLY (position matters) - */
    unsigned char key32[32], nonce[12], tag[16];
    memset(key32, 0x11, sizeof(key32));
    memset(nonce, 0, sizeof(nonce));
    static unsigned char good[WIDTH * HEIGHT * BLOCK];
    CHECK(crypto_gcm_encrypt(key32, nonce, 12, NULL, 0, plain, sizeof(plain), good, tag));
    {
        int bg1 = 1 * WIDTH + 1, bg2 = 1 * WIDTH + 2;
        CHECK(memcmp(good + bg1 * BLOCK, good + bg2 * BLOCK, BLOCK) != 0);
    }
    {
        int sh1 = 0 * WIDTH + 0, sh2 = 0 * WIDTH + 5;
        CHECK(memcmp(good + sh1 * BLOCK, good + sh2 * BLOCK, BLOCK) != 0);
    }

    /* --- decrypting the GCM output must recover the exact original picture ----------------- */
    static unsigned char back[WIDTH * HEIGHT * BLOCK];
    CHECK(crypto_gcm_decrypt(key32, nonce, 12, NULL, 0, good, sizeof(good), tag, back));
    CHECK_MEM(back, plain, sizeof(plain));

    /* --- ramp mapping used by draw_encrypted(): first byte 0x00 and 0xFF map to different chars */
    {
        static const char ramp[] = " .:-=+*#%@";
        char c_bg = ramp[plain[(1 * WIDTH + 1) * BLOCK] * 9 / 256];
        char c_sh = ramp[plain[(0 * WIDTH + 0) * BLOCK] * 9 / 256];
        CHECK(c_bg != c_sh);
    }

    TEST_SUMMARY();
}
