/* Unit tests for week-06/05-flow-counter/flow_counter.c.
 *
 * flow_start()/checkpoint() are exercised against an HMAC chain computed independently in this
 * file with direct calls to crypto_hmac_sha256() (the same primitive checkpoint() itself calls,
 * but never through checkpoint() or flow_start() for the expected side), never by trusting
 * checkpoint()'s own prior output. critical_operation()'s pass/fail behaviour is the protocol's
 * whole point (a data-dependent AEAD open), so those checks are end-to-end: build a real sealed
 * packet, run real checkpoint sequences, and observe the real accept/reject result.
 */
#define main program_main
#include "../flow_counter.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- flow_start(): the seed is copied verbatim, count and visited_mask reset ------------- */
    {
        flow_t f;
        flow_start(&f);
        unsigned char expected_seed[32] = "CEN429-flow-counter-seed-v1---"; /* same literal as the source */
        CHECK_MEM(f.acc, expected_seed, 32);
        CHECK_EQ_INT(f.count, 0);
        CHECK_EQ_INT(f.visited_mask, 0);
    }

    /* --- checkpoint(): one step matches an independently computed HMAC(seed, "stage-0") ------- */
    {
        flow_t f;
        flow_start(&f);
        unsigned char seed[32] = "CEN429-flow-counter-seed-v1---";
        unsigned char expected[32];
        CHECK(crypto_hmac_sha256(seed, 32, "stage-0", 7, expected));

        checkpoint(&f, 0, "unit-test");
        CHECK_MEM(f.acc, expected, 32);
        CHECK_EQ_INT(f.count, 1);
        CHECK_EQ_INT(f.visited_mask, 0x1);
    }

    /* --- checkpoint(): three steps in order == the SAME chain the packet was sealed with ------ */
    {
        flow_t a, b;
        flow_start(&a);
        checkpoint(&a, 0, "x"); checkpoint(&a, 1, "x"); checkpoint(&a, 2, "x");
        flow_start(&b);
        checkpoint(&b, 0, "x"); checkpoint(&b, 1, "x"); checkpoint(&b, 2, "x");
        CHECK_MEM(a.acc, b.acc, 32);           /* deterministic: same order -> same chain */
        CHECK_EQ_INT(a.count, 3);
        CHECK_EQ_INT(a.visited_mask, 0x7);
    }

    /* --- checkpoint(): reordered stages give a DIFFERENT chain than in-order (HMAC is not
       commutative in how the label is folded in at each step). ------------------------------- */
    {
        flow_t in_order, reordered;
        flow_start(&in_order);
        checkpoint(&in_order, 0, "x"); checkpoint(&in_order, 1, "x"); checkpoint(&in_order, 2, "x");
        flow_start(&reordered);
        checkpoint(&reordered, 2, "x"); checkpoint(&reordered, 0, "x"); checkpoint(&reordered, 1, "x");
        CHECK(memcmp(in_order.acc, reordered.acc, 32) != 0);
        CHECK_EQ_INT(reordered.visited_mask, 0x7);   /* same set of stages, different chain */
    }

    /* --- critical_operation(): end to end -- seal with the correct in-order chain, then try
       normal / skipped / partial / reordered runs against that SAME sealed packet. ------------ */
    {
        const char *secret = "TEST-SECRET-VALUE";
        flow_t setup;
        flow_start(&setup);
        checkpoint(&setup, 0, "setup"); checkpoint(&setup, 1, "setup"); checkpoint(&setup, 2, "setup");
        unsigned char packet[12 + 64 + 16];
        crypto_random(packet, 12);
        unsigned char tag[16];
        CHECK(crypto_gcm_encrypt(setup.acc, packet, 12, NULL, 0,
                                 (const unsigned char *)secret, strlen(secret), packet + 12, tag));
        memcpy(packet + 12 + strlen(secret), tag, 16);
        size_t packet_size = 12 + strlen(secret) + 16;

        /* normal: same order -> opens, and the plaintext is exactly the secret that was sealed. */
        {
            flow_t f;
            flow_start(&f);
            checkpoint(&f, 0, "a"); checkpoint(&f, 1, "a"); checkpoint(&f, 2, "a");
            unsigned char out[64] = {0};
            CHECK(critical_operation(&f, packet, packet_size, out, sizeof(out)));
            CHECK_MEM(out, secret, strlen(secret));
        }
        /* skip: no checkpoint at all -> still the seed key -> must NOT open. */
        {
            flow_t f;
            flow_start(&f);
            unsigned char out[64] = {0};
            CHECK(!critical_operation(&f, packet, packet_size, out, sizeof(out)));
        }
        /* partial: only checkpoint 0 -> must NOT open. */
        {
            flow_t f;
            flow_start(&f);
            checkpoint(&f, 0, "a");
            unsigned char out[64] = {0};
            CHECK(!critical_operation(&f, packet, packet_size, out, sizeof(out)));
        }
        /* reordered: all three stages but in the wrong order -> must NOT open. */
        {
            flow_t f;
            flow_start(&f);
            checkpoint(&f, 2, "a"); checkpoint(&f, 0, "a"); checkpoint(&f, 1, "a");
            unsigned char out[64] = {0};
            CHECK(!critical_operation(&f, packet, packet_size, out, sizeof(out)));
        }
    }

    TEST_SUMMARY();
}
