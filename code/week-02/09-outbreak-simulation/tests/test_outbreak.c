/* Unit tests for week-02/09-outbreak-simulation/outbreak.c.
 *
 * bar()/format_time() are pure functions. scenario()'s return value (t90, the 90%-saturation
 * time) comes from a CLOSED-FORM expression in the source, not from the iterative simulation it
 * also prints -- so an independent hand-picked case is used: when i0 = N/2, the ratio
 * (N-i0)/i0 == 1 for ANY N, which makes t90 = ln(9)/beta regardless of N. Choosing beta = ln(9)
 * (or a multiple of it) then gives an exact, easily hand-checked expected t90, without
 * duplicating scenario()'s own formula.
 */
#define main program_main
#include "../outbreak.c"
#undef main
#include "../../../common/test_check.h"

int main(void)
{
    /* --- bar(): 0, full, half, and clamping outside [0,1] ---------------------------------- */
    {
        char out[41];
        bar(0.0, out, 10);
        CHECK_EQ_STR(out, "..........");
        bar(1.0, out, 10);
        CHECK_EQ_STR(out, "##########");
        bar(0.5, out, 10);
        CHECK_EQ_STR(out, "#####.....");
        bar(-0.3, out, 4);
        CHECK_EQ_STR(out, "....");                 /* clamped to 0 */
        bar(1.3, out, 4);
        CHECK_EQ_STR(out, "####");                  /* clamped to 1 */
        bar(0.75, out, 20);
        CHECK_EQ_INT((int)strlen(out), 20);
    }

    /* --- format_time(): the three unit branches, at and around their boundaries ------------ */
    {
        char out[16];
        format_time(45.0, out, sizeof out);
        CHECK_EQ_STR(out, "    45 s ");
        format_time(90.0, out, sizeof out);          /* s < 90.0 is false at exactly 90 */
        CHECK_EQ_STR(out, "   1.5 min");
        format_time(150.0, out, sizeof out);
        CHECK_EQ_STR(out, "   2.5 min");
        format_time(5400.0, out, sizeof out);        /* s < 5400.0 is false at exactly 5400 */
        CHECK_EQ_STR(out, "  1.50 hr");
        format_time(36000.0, out, sizeof out);
        CHECK_EQ_STR(out, " 10.00 hr");
    }

    /* --- scenario(): t90 at i0 = N/2, where (N-i0)/i0 == 1 for any N ------------------------ */
    {
        double t90 = scenario("unit-test A", 500.0, log(9.0), 1000.0);
        CHECK(fabs(t90 - 1.0) < 1e-9);               /* t90 = ln(9)/beta = ln(9)/ln(9) = 1 */
    }
    {
        double t90 = scenario("unit-test B", 250.0, 2.0 * log(9.0), 500.0);
        CHECK(fabs(t90 - 0.5) < 1e-9);                /* t90 = ln(9)/(2 ln 9) = 0.5 */
    }
    {
        double t90 = scenario("unit-test C", 5000.0, 0.5 * log(9.0), 10000.0);
        CHECK(fabs(t90 - 2.0) < 1e-9);                 /* t90 = ln(9)/(0.5 ln 9) = 2 */
    }
    {
        /* --- scenario(): boundary, i0 already AT 90% saturation: (N-i0)/i0 = 1/9, so
           9*(N-i0)/i0 = 1, log(1) = 0 -> t90 = 0 regardless of beta (already there). */
        double t90 = scenario("unit-test D (already at 90%)", 900.0, log(9.0), 1000.0);
        CHECK(fabs(t90 - 0.0) < 1e-9);
    }

    TEST_SUMMARY();
}
