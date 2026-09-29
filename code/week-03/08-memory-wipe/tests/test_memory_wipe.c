/* Unit tests for week-03/08-memory-wipe/memory_wipe.c. */
#define main program_main
#include "../memory_wipe.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- nonzero_bytes(): normal, empty, full, boundary counts ----------------------------- */
    {
        char all_zero[BUF_LEN];
        memset(all_zero, 0, sizeof(all_zero));
        CHECK_EQ_INT(nonzero_bytes(all_zero), 0);
    }
    {
        char all_set[BUF_LEN];
        memset(all_set, 0x41, sizeof(all_set));
        CHECK_EQ_INT(nonzero_bytes(all_set), BUF_LEN);
    }
    {
        char one_set[BUF_LEN];
        memset(one_set, 0, sizeof(one_set));
        one_set[0] = 1;
        CHECK_EQ_INT(nonzero_bytes(one_set), 1);
    }
    {
        char last_set[BUF_LEN];
        memset(last_set, 0, sizeof(last_set));
        last_set[BUF_LEN - 1] = (char)-1;   /* bit pattern 0xFF; (char)-1 avoids MSVC C4310 on a signed char */
        CHECK_EQ_INT(nonzero_bytes(last_set), 1);
    }
    {
        char half[BUF_LEN];
        memset(half, 0, sizeof(half));
        for (int i = 0; i < BUF_LEN / 2; i++) half[i] = (char)(i + 1);
        CHECK_EQ_INT(nonzero_bytes(half), BUF_LEN / 2);
    }
    {
        /* a byte with all bits set except being exactly 0 is still "nonzero"; -1's bit pattern (0xFF)
           must count, not be treated as falsy through a sign-extension bug. */
        char neg_one[BUF_LEN];
        memset(neg_one, (char)-1, sizeof(neg_one));
        CHECK_EQ_INT(nonzero_bytes(neg_one), BUF_LEN);
    }

    /* --- the real "secret" string used by the demo: known length, no embedded zero bytes ---- */
    {
        char secret[BUF_LEN];
        memset(secret, 0, sizeof(secret));
        strcpy(secret, "Synthetic-Password-2026");
        CHECK_EQ_INT(strlen(secret), 23);
        CHECK_EQ_INT(nonzero_bytes(secret), 23);   /* the trailing bytes are still the memset(0) padding */
    }

    /* --- crypto_wipe() actually zeroes the buffer, for several starting patterns ----------- */
    {
        char buf[BUF_LEN];
        memset(buf, 0x7A, sizeof(buf));
        CHECK_EQ_INT(nonzero_bytes(buf), BUF_LEN);      /* before */
        crypto_wipe(buf, sizeof(buf));
        CHECK_EQ_INT(nonzero_bytes(buf), 0);            /* after */
    }
    {
        char buf[BUF_LEN];
        strcpy(buf, "another secret value 123");
        int before = nonzero_bytes(buf);
        CHECK(before > 0);
        crypto_wipe(buf, sizeof(buf));
        CHECK_EQ_INT(nonzero_bytes(buf), 0);
    }
    {
        /* wiping a zero-length region must not crash and must not touch anything past it */
        char buf[BUF_LEN];
        memset(buf, 0x33, sizeof(buf));
        crypto_wipe(buf, 0);
        CHECK_EQ_INT(nonzero_bytes(buf), BUF_LEN);      /* untouched: length 0 wipes nothing */
    }
    {
        /* wiping only a prefix leaves the rest alone */
        char buf[BUF_LEN];
        memset(buf, 0x44, sizeof(buf));
        crypto_wipe(buf, 10);
        CHECK_EQ_INT(nonzero_bytes(buf), BUF_LEN - 10);
    }

    /* --- the demo program itself runs cleanly end-to-end (smoke test) ---------------------- */
    CHECK_EQ_INT(program_main(), 0);

    TEST_SUMMARY();
}
