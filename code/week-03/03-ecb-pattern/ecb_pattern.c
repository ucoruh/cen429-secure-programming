/*
 * CEN429 - Week 3 - Demo 3: ECB mode leaks patterns (the "ECB penguin")
 *
 * ECB (Electronic Codebook) encrypts every 16-byte block INDEPENDENTLY of
 * the others. The same plaintext block ALWAYS produces the same ciphertext
 * block. So repeating patterns in the data stay visible in the ciphertext.
 *
 * We build a small, two-color "picture": every PIXEL is exactly one
 * 16-byte block. The background pixel is 16 x 0x00, the shape pixel is
 * 16 x 0xFF. So every background block is identical to every other, and
 * every shape block is identical to every other.
 *
 * In ECB: identical blocks give identical ciphertext blocks -> the shape
 * stays READABLE. In GCM (CTR-based): every block is encrypted with a
 * different, position-dependent keystream -> the pattern disappears
 * (noise).
 *
 * The output is drawn in ASCII: every block is reduced to one character
 * based on its first ciphertext byte. ECB's output only ever has TWO
 * distinct characters.
 */
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include <stdio.h>
#include <string.h>

#define WIDTH 32                /* pixel (block) width */
#define HEIGHT 16                /* number of rows */
#define BLOCK 16                 /* one pixel = 16 bytes */

/* 0 = background, 1 = shape. The digits "429" plus a frame. */
static const char *image[HEIGHT] = {
    "11111111111111111111111111111111",
    "10000000000000000000000000000001",
    "10011000011110000111100001100001",
    "10011000110011001100110011100001",
    "10011000000011000000110000100001",
    "10011000000110000011100000100001",
    "10011111001100000000110000100001",
    "10000001011000001100110011100001",
    "10000001111110000011100001100001",
    "10000000000000000000000000000001",
    "10111100011110000111100011110001",
    "10000100110011001100110000010001",
    "10001000000011000000110000100001",
    "10010000011100000111000001000001",
    "10111100111111000111100010000001",
    "11111111111111111111111111111111",
};

/* Reduces every block to one character based on its first ciphertext byte. */
static void draw_encrypted(const char *title, const unsigned char *data)
{
    static const char ramp[] = " .:-=+*#%@";
    printf("%s\n", title);
    for (int y = 0; y < HEIGHT; y++) {
        printf("  ");
        for (int x = 0; x < WIDTH; x++) {
            const unsigned char *block = data + (y * WIDTH + x) * BLOCK;
            putchar(ramp[block[0] * 9 / 256]);
        }
        printf("\n");
    }
}

int main(void)
{
    demo_prepare();
    unsigned char plain[WIDTH * HEIGHT * BLOCK];
    for (int y = 0; y < HEIGHT; y++)
        for (int x = 0; x < WIDTH; x++) {
            unsigned char v = (image[y][x] == '1') ? 0xFF : 0x00;
            memset(plain + (y * WIDTH + x) * BLOCK, v, BLOCK);
        }

    unsigned char key[16];
    memset(key, 0x11, sizeof(key));

    /* ECB: encrypt every 16-byte block on its own. */
    unsigned char ecb[WIDTH * HEIGHT * BLOCK];
    for (int i = 0; i < WIDTH * HEIGHT; i++)
        crypto_aes_ecb_block(key, 16, plain + i * BLOCK, ecb + i * BLOCK);

    /* Good mode (GCM = CTR-based): encrypt the whole picture with one nonce. */
    unsigned char good[WIDTH * HEIGHT * BLOCK], tag[16], key32[32], nonce[12];
    memset(key32, 0x11, sizeof(key32));
    memset(nonce, 0, sizeof(nonce));
    crypto_gcm_encrypt(key32, nonce, 12, NULL, 0, plain, WIDTH * HEIGHT * BLOCK, good,
                       tag);

    printf("Original picture (plaintext):\n");
    for (int y = 0; y < HEIGHT; y++) {
        printf("  ");
        for (int x = 0; x < WIDTH; x++)
            putchar(image[y][x] == '1' ? '#' : ' ');
        printf("\n");
    }
    printf("==============================================================\n");
    draw_encrypted("Encrypted with AES-128-ECB (each block by its first byte):",
                ecb);
    printf("  ==> The shape is still VISIBLE: ECB leaks the pattern. DO NOT USE IT.\n");
    printf("==============================================================\n");
    draw_encrypted("Encrypted with AES-256-GCM (CTR-based), same picture:",
                good);
    printf("  ==> The pattern is gone: GCM/CTR encrypts every block differently.\n");
    return 0;
}
