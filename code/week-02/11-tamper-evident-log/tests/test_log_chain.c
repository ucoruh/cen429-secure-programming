/* Unit tests for week-02/11-tamper-evident-log/log_chain.c.
 *
 * evolve_key()/record_mac() are pure/bounded crypto glue, safe to call in-process. generate()/
 * verify()/modify()/delete_record()/swap()/forge() do real file I/O, only under tests/tmp/ (this
 * test's own scratch folder). Every expected outcome is the DOCUMENTED, deterministic behaviour
 * from the file's own header comment (a broken chain is caught; key evolution defeats a captured
 * key; a static key does not) -- never a value copied from a prior run of this same program.
 */
#define main program_main
#include "../log_chain.c"
#undef main
#include "../../../common/test_check.h"
#ifdef _WIN32
#include <direct.h>
#else
#include <sys/stat.h>
#endif

#define TMP "tests/tmp"

int main(void)
{
#ifdef _WIN32
    _mkdir(TMP);
#else
    mkdir(TMP, 0700);
#endif

    /* --- evolve_key(): deterministic, and it really changes the key ------------------------ */
    {
        unsigned char k1[32], k2[32];
        memset(k1, 0x11, 32);
        memcpy(k2, k1, 32);
        evolve_key(k1);
        CHECK(memcmp(k1, k2, 32) != 0);               /* the key really changed */
        evolve_key(k2);
        CHECK_MEM(k1, k2, 32);                          /* same input -> same output (deterministic) */
    }

    /* --- record_mac(): changing any one input changes the MAC (avalanche, not equality) ---- */
    {
        unsigned char k[32], prev[32], mac1[32], mac2[32];
        memset(k, 0x22, 32);
        memset(prev, 0, 32);
        record_mac(k, prev, 1, "hello", mac1);
        record_mac(k, prev, 1, "hello", mac2);
        CHECK_MEM(mac1, mac2, 32);                       /* same inputs -> same MAC */
        record_mac(k, prev, 1, "HELLO", mac2);
        CHECK(memcmp(mac1, mac2, 32) != 0);              /* different message -> different MAC */
        record_mac(k, prev, 2, "hello", mac2);
        CHECK(memcmp(mac1, mac2, 32) != 0);              /* different seq -> different MAC */
        unsigned char prev2[32];
        memset(prev2, 0xAA, 32);
        record_mac(k, prev2, 1, "hello", mac2);
        CHECK(memcmp(mac1, mac2, 32) != 0);              /* different prev -> different MAC */
    }

    /* --- generate() + verify(): a freshly generated log verifies clean, both modes -------- */
    {
        CHECK_EQ_INT(generate(TMP, "evolve"), 0);
        CHECK_EQ_INT(verify(TMP "/access.auditlog", TMP "/verifier.key"), 0);
        CHECK_EQ_INT(generate(TMP, "static"), 0);
        CHECK_EQ_INT(verify(TMP "/access.auditlog", TMP "/verifier.key"), 0);
    }

    /* --- modify(): a raw edit with a stale MAC is caught ------------------------------------ */
    {
        generate(TMP, "evolve");
        CHECK_EQ_INT(modify(TMP "/access.auditlog", 2, "TAMPERED MESSAGE"), 0);
        CHECK(verify(TMP "/access.auditlog", TMP "/verifier.key") != 0);
    }

    /* --- delete_record(): deleting a record breaks the chain -------------------------------- */
    {
        generate(TMP, "evolve");
        CHECK_EQ_INT(delete_record(TMP "/access.auditlog", 3), 0);
        CHECK(verify(TMP "/access.auditlog", TMP "/verifier.key") != 0);
    }

    /* --- swap(): reordering two records breaks the chain ------------------------------------ */
    {
        generate(TMP, "evolve");
        CHECK_EQ_INT(swap(TMP "/access.auditlog", 2, 3), 0);
        CHECK(verify(TMP "/access.auditlog", TMP "/verifier.key") != 0);
    }

    /* --- forge(): key evolution defeats a captured key; a static key does not -------------- */
    {
        generate(TMP, "evolve");
        CHECK_EQ_INT(forge(TMP "/access.auditlog", 2, "FORGED", TMP "/stolen.key"), 0);
        CHECK(verify(TMP "/access.auditlog", TMP "/verifier.key") != 0);   /* caught */

        generate(TMP, "static");
        CHECK_EQ_INT(forge(TMP "/access.auditlog", 2, "FORGED", TMP "/stolen.key"), 0);
        CHECK_EQ_INT(verify(TMP "/access.auditlog", TMP "/verifier.key"), 0);  /* NOT caught */
    }

    TEST_SUMMARY();
}
