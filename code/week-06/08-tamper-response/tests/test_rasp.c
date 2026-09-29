/* Unit tests for week-06/08-tamper-response/rasp.c.
 *
 * decide_response() is a pure function of two integers; every expected state below is the policy
 * table from the file's own top comment, transcribed by hand (not derived by calling
 * decide_response() with different arguments). run_checks() and device_fingerprint() are
 * exercised against their real, observable output for each documented mode/argument.
 */
#define main program_main
#include "../rasp.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- decide_response(): the policy table, hand-transcribed ------------------------------ */
    CHECK(decide_response(0, 0) == RASP_NORMAL);
    CHECK(decide_response(1, 0) == RASP_WARN);
    CHECK(decide_response(2, 0) == RASP_DEGRADE);
    CHECK(decide_response(3, 0) == RASP_LOCK);
    CHECK(decide_response(4, 0) == RASP_LOCK);   /* more than 3: still LOCK */
    CHECK(decide_response(5, 0) == RASP_LOCK);   /* every check failed: still LOCK */
    CHECK(decide_response(-1, 0) == RASP_NORMAL); /* invalid negative count: treated as "no failures" */

    /* --- decide_response(): a device/version mismatch always escalates straight to LOCK, no
       matter how many of the other checks passed. ------------------------------------------- */
    CHECK(decide_response(0, 1) == RASP_LOCK);
    CHECK(decide_response(1, 1) == RASP_LOCK);
    CHECK(decide_response(2, 1) == RASP_LOCK);
    CHECK(decide_response(3, 1) == RASP_LOCK);

    /* --- state_name(): every real state, plus an out-of-range value defaults to "LOCK" (the
       safe choice: an unrecognized state must never be treated as more permissive than LOCK). -- */
    CHECK_EQ_STR(state_name(RASP_NORMAL), "NORMAL");
    CHECK_EQ_STR(state_name(RASP_WARN), "WARN");
    CHECK_EQ_STR(state_name(RASP_DEGRADE), "DEGRADE");
    CHECK_EQ_STR(state_name(RASP_LOCK), "LOCK");
    CHECK_EQ_STR(state_name((rasp_state_t)99), "LOCK");

    /* --- run_checks(): each mode fails exactly the documented number of checks -------------- */
    CHECK_EQ_INT(run_checks("normal"), 0);
    CHECK_EQ_INT(run_checks("warn"), 1);
    CHECK_EQ_INT(run_checks("degrade"), 2);
    CHECK_EQ_INT(run_checks("lock"), 3);
    CHECK_EQ_INT(run_checks("other-device"), 0);   /* fails no check; it is a device mismatch instead */
    CHECK_EQ_INT(run_checks("some-unknown-mode"), 0); /* unrecognized mode: defaults to no failures */

    /* --- device_fingerprint(): the real device vs. "other" device, and they must differ ------- */
    {
        char real_fp[128], other_fp[128];
        device_fingerprint(0, real_fp, sizeof(real_fp));
        device_fingerprint(1, other_fp, sizeof(other_fp));
        CHECK(strstr(real_fp, "SN-0001") != NULL);
        CHECK(strstr(other_fp, "SN-9999") != NULL);
        CHECK(strcmp(real_fp, other_fp) != 0);
    }

    /* --- data_key(): deterministic (same fingerprint -> same key) and fingerprint-sensitive
       (different fingerprint -> a different key), checked against HKDF called directly here. --- */
    {
        char fp[128];
        device_fingerprint(0, fp, sizeof(fp));
        unsigned char first[32], second[32];
        data_key(fp, first);
        data_key(fp, second);
        CHECK_MEM(first, second, 32);   /* deterministic */

        unsigned char expected[32];
        CHECK(crypto_hkdf_sha256((const unsigned char *)fp, strlen(fp),
                                 (const unsigned char *)VERSION_STRING, strlen(VERSION_STRING),
                                 (const unsigned char *)"rasp-data-key", 13, expected, 32));
        CHECK_MEM(first, expected, 32);

        char other_fp[128];
        device_fingerprint(1, other_fp, sizeof(other_fp));
        unsigned char other_key[32];
        data_key(other_fp, other_key);
        CHECK(memcmp(first, other_key, 32) != 0);
    }

    TEST_SUMMARY();
}
