/*
 * CEN429 - Week 6 - Demo 4: FAKE hook library (for the demo only)
 *
 * This small shared library shows how an attacker REPLACES a standard function
 * (interposition) with LD_PRELOAD. It only takes over the time() function and returns a
 * fixed, fake value. Harmless: it prints nothing and touches no file; it only affects the demo
 * process that is run with LD_PRELOAD.
 *
 * How a real hook gets CAUGHT is explained in preload_hook.c.
 */
#include <time.h>

time_t time(time_t *t)
{
    time_t fake = (time_t)1234567890;   /* the fixed value the attacker imposes */
    if (t)
        *t = fake;
    return fake;
}
