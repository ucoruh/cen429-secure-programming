/*
 * CEN429 - Week 3 - Demo 4: deriving a key from a password (PBKDF2)
 *
 * A password cannot be a key directly: it is short, guessable and has low
 * entropy. A password-based key derivation function (KDF) does two things:
 *   1) SALT: a random salt is added per user; the same password with a
 *      different salt gives a different key. This makes precomputed
 *      tables (rainbow tables) useless.
 *   2) SLOWNESS: the KDF deliberately runs for hundreds of thousands of
 *      rounds; trying one password guess becomes expensive, so brute
 *      force is slowed down.
 *
 * This program shows:
 *   - The same password + the SAME salt -> the SAME key (table lookups work).
 *   - The same password + a DIFFERENT salt -> a DIFFERENT key (the value of the salt).
 *   - The elapsed TIME grows as the round count grows (the cost knob).
 *
 * PBKDF2 is still used for compatibility/FIPS; on new systems OWASP
 * recommends Argon2id as the first choice (see demo.sh for a comparison).
 */
#include "cen429_demo.h"
#include "cen429_crypto.h"
#include <stdio.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
static double now_ms(void)
{
    LARGE_INTEGER f, t;
    QueryPerformanceFrequency(&f);
    QueryPerformanceCounter(&t);
    return (double)t.QuadPart * 1000.0 / (double)f.QuadPart;
}
#else
#include <time.h>
static double now_ms(void)
{
    struct timespec t;
    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec * 1000.0 + t.tv_nsec / 1e6;
}
#endif

#define KEY_LEN 32

static void print_hex(const char *label, const unsigned char *b, int len)
{
    printf("%s", label);
    for (int i = 0; i < len; i++)
        printf("%02x", b[i]);
    printf("\n");
}

int main(void)
{
    demo_prepare();
    const char *password = "dog123";       /* weak example password */
    unsigned char salt_a[16], salt_b[16], key[KEY_LEN];

    memset(salt_a, 0xA1, sizeof(salt_a));
    memset(salt_b, 0xB2, sizeof(salt_b));

    printf("Password: \"%s\"\n", password);
    printf("==============================================================\n");
    printf("1) WHY THE SALT MATTERS (rounds = 100000)\n");
    crypto_pbkdf2_sha256((const unsigned char *)password, strlen(password),
                         salt_a, sizeof(salt_a), 100000, key, KEY_LEN);
    print_hex("   salt A -> key = ", key, KEY_LEN);
    crypto_pbkdf2_sha256((const unsigned char *)password, strlen(password),
                         salt_a, sizeof(salt_a), 100000, key, KEY_LEN);
    print_hex("   salt A -> key = ", key, KEY_LEN);
    printf("   ^ Same password + the SAME salt -> the SAME key (a table "
           "lookup would work)\n");
    crypto_pbkdf2_sha256((const unsigned char *)password, strlen(password),
                         salt_b, sizeof(salt_b), 100000, key, KEY_LEN);
    print_hex("   salt B -> key = ", key, KEY_LEN);
    printf("   ^ Same password + a DIFFERENT salt -> a DIFFERENT key (the "
           "salt does its job)\n");

    printf("==============================================================\n");
    printf("2) ROUND COUNT vs TIME (same password, same salt)\n");
    uint32_t rounds_list[] = { 1000, 10000, 100000, 600000, 2000000 };
    for (unsigned i = 0; i < sizeof(rounds_list) / sizeof(rounds_list[0]); i++) {
        double t0 = now_ms();
        crypto_pbkdf2_sha256((const unsigned char *)password, strlen(password),
                             salt_a, sizeof(salt_a), rounds_list[i], key,
                             KEY_LEN);
        double ms = now_ms() - t0;
        printf("   rounds = %8u  ->  %8.2f ms\n", rounds_list[i], ms);
    }
    printf("   ^ As the round count grows, every password guess gets more "
           "expensive.\n");
    printf("   OWASP 2023: PBKDF2-HMAC-SHA256 needs >= 600000 rounds;\n");
    printf("   Argon2id is preferred when available (memory is a cost too).\n");
    return 0;
}
