/* Unit tests for week-02/01-signature-scanner/scanner.c.
 *
 * entropy(), contains(), split_capsule(), find_pattern() and sha256_hex() are all pure/bounded
 * functions, safe to call in-process. find_pattern() reads the file-scope `signatures[]` array,
 * which this test populates directly (the same trick as calling any other static helper after
 * including the source file).
 *
 * Expected SHA-256 values are the two best-known published test vectors (SHA-256("";) and
 * SHA-256("abc")) -- independent of crypto_sha256()'s own implementation. Entropy values for
 * hand-picked byte distributions are computed by the exact Shannon formula in a comment, not by
 * calling entropy() a second time.
 */
#define main program_main
#include "../scanner.c"
#undef main
#include "../../../common/test_check.h"
#include <math.h>

int main(void)
{
    /* --- entropy(): normal, empty, boundary, skewed -------------------------------------- */
    {
        unsigned char same[8] = { 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A' };
        CHECK(fabs(entropy(same, 8) - 0.0) < 1e-9);           /* one byte value: H = 0 */
    }
    CHECK(fabs(entropy(NULL, 0) - 0.0) < 1e-9);                /* n == 0: hard 0, no dereference */
    {
        unsigned char one[1] = { 0x42 };
        CHECK(fabs(entropy(one, 1) - 0.0) < 1e-9);              /* single byte: H = 0 */
    }
    {
        /* 2 distinct bytes, 50/50: H = -(0.5*log2(0.5)*2) = 1.0 */
        unsigned char half[4] = { 'A', 'B', 'A', 'B' };
        CHECK(fabs(entropy(half, 4) - 1.0) < 1e-9);
    }
    {
        /* 4 distinct bytes, equal shares: H = log2(4) = 2.0 */
        unsigned char four[8] = { 1, 2, 3, 4, 1, 2, 3, 4 };
        CHECK(fabs(entropy(four, 8) - 2.0) < 1e-9);
    }
    {
        /* skewed: 2 'A' + 1 'B' (n=3): H = -(2/3*log2(2/3) + 1/3*log2(1/3)) */
        unsigned char skew[3] = { 'A', 'A', 'B' };
        double expected = -(2.0 / 3.0 * log2(2.0 / 3.0) + 1.0 / 3.0 * log2(1.0 / 3.0));
        CHECK(fabs(entropy(skew, 3) - expected) < 1e-9);
    }

    /* --- contains(): normal, empty pattern, longer-than-buffer, no match ------------------ */
    {
        unsigned char buf[7] = { 'x', 'x', 'a', 'b', 'c', 'x', 'x' };
        CHECK_EQ_INT(contains(buf, 7, "abc"), 1);
        CHECK_EQ_INT(contains(buf, 7, "abz"), 0);
        CHECK_EQ_INT(contains(buf, 7, ""), 0);                 /* empty pattern: never matches */
        CHECK_EQ_INT(contains(buf, 3, "abcextra"), 0);         /* pattern longer than buffer */
        CHECK_EQ_INT(contains(buf, 7, "xx"), 1);                /* matches at the very start */
    }

    /* --- split_capsule(): normal, wrong magic, no newline, oversized command line --------- */
    {
        unsigned char v[64];
        size_t n = 0;
        memcpy(v, CAPSULE_MAGIC, strlen(CAPSULE_MAGIC)); n += strlen(CAPSULE_MAGIC);
        memcpy(v + n, "BODY LEN=5\n", 11); n += 11;
        memcpy(v + n, "hello", 5); n += 5;
        struct capsule cap;
        CHECK_EQ_INT(split_capsule(v, n, &cap), 1);
        CHECK_EQ_STR(cap.command, "BODY LEN=5");
        CHECK_EQ_INT((int)cap.body_len, 5);
        CHECK_EQ_INT(memcmp(cap.body, "hello", 5), 0);
    }
    {
        unsigned char v[16] = "NOT-A-CAPSULE\n1";
        struct capsule cap;
        CHECK_EQ_INT(split_capsule(v, 16, &cap), 0);            /* wrong magic */
    }
    {
        unsigned char v[32];
        size_t s = strlen(CAPSULE_MAGIC);
        memcpy(v, CAPSULE_MAGIC, s);
        memset(v + s, 'X', 10);                                 /* no '\n' anywhere after the header */
        struct capsule cap;
        CHECK_EQ_INT(split_capsule(v, s + 10, &cap), 0);
    }

    /* --- find_pattern(): populate the file-scope signature table directly ----------------- */
    {
        signature_count = 0;
        signatures[signature_count].type = T_PATTERN;
        snprintf(signatures[signature_count].name, sizeof signatures[0].name, "TestSig");
        snprintf(signatures[signature_count].value, sizeof signatures[0].value, "MARKER");
        signature_count++;
        unsigned char hay[16] = "xx--MARKER--xx";
        CHECK_EQ_STR(find_pattern(hay, 14), "TestSig");
        unsigned char miss[19] = "no signature here";
        CHECK(find_pattern(miss, 18) == NULL);
        signature_count = 0;                                    /* leave global state clean */
    }

    /* --- sha256_hex(): the two best-known published SHA-256 test vectors ------------------ */
    {
        char hex[65];
        CHECK_EQ_INT(sha256_hex((const unsigned char *)"", 0, hex), 0);
        CHECK_EQ_STR(hex, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        CHECK_EQ_INT(sha256_hex((const unsigned char *)"abc", 3, hex), 0);
        CHECK_EQ_STR(hex, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }

    /* --- capsule.h keystreams: xs32/lcg8 are their own inverse under the same seed -------- */
    {
        unsigned char body[16] = "0123456789abcde";
        unsigned char copy[16];
        memcpy(copy, body, 16);
        xs32_apply(copy, 16, 0x1a2b3c4du);
        CHECK(memcmp(copy, body, 16) != 0);                     /* it really changed the bytes */
        xs32_apply(copy, 16, 0x1a2b3c4du);                      /* same seed again: XOR undoes itself */
        CHECK_MEM(copy, body, 16);
    }
    {
        unsigned char body[16] = "abcdefghij01234";
        unsigned char copy[16];
        memcpy(copy, body, 16);
        lcg8_apply(copy, 16, 0x5eed1234u, 1);                    /* encrypt */
        CHECK(memcmp(copy, body, 16) != 0);
        lcg8_apply(copy, 16, 0x5eed1234u, 0);                    /* decrypt: same key sequence */
        CHECK_MEM(copy, body, 16);
    }

    TEST_SUMMARY();
}
