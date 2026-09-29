/*
 * CEN429 — Week 2 — Demo 09: a worm outbreak simulation (the SI model)
 *
 * Usage: bin/.../outbreak
 *
 * Simulates a worm spreading across a network with the "Susceptible–Infected"
 * (SI) epidemic model. It performs NO network operation and connects to
 * nothing; it only solves a difference equation and prints the result as an
 * ASCII bar chart.
 *
 * The SI difference equation (discrete time, Euler):
 *
 *     i(t+dt) = i(t) + beta * i(t) * (1 - i(t)/N) * dt
 *
 *   i(t) : the number of machines infected so far
 *   N    : the total number of vulnerable (susceptible) machines
 *   beta : the effective infection rate (1/second) — a measure of how many
 *          new machines one infected machine infects per unit time
 *
 * In the early (exponential) phase, doubling time = ln(2)/beta. This demo
 * compares three scenarios: slow random scanning (Code-Red-like), fast
 * random scanning (SQL-Slammer-like), and a worm at the same speed but
 * starting from a "hitlist" (i.e. i0 is large). The figures are examples;
 * the doubling times actually observed are discussed in the lecture notes.
 */
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
#include "cen429_demo.h"

#define MAX_STEPS 200000

/* Turns a fraction between 0 and 1 into a bar `width` characters wide. */
static void bar(double frac, char *out, int width)
{
    if (frac < 0.0)
        frac = 0.0;
    if (frac > 1.0)
        frac = 1.0;
    int filled = (int)(frac * width + 0.5);
    for (int i = 0; i < width; i++)
        out[i] = i < filled ? '#' : '.';
    out[width] = '\0';
}

/* Formats a duration in human-readable form (s / min / hr). */
static void format_time(double s, char *out, size_t len)
{
    if (s < 90.0)
        snprintf(out, len, "%6.0f s ", s);
    else if (s < 5400.0)
        snprintf(out, len, "%6.1f min", s / 60.0);
    else
        snprintf(out, len, "%6.2f hr", s / 3600.0);
}

/*
 * Simulates one SI scenario and prints its summary lines.
 *   name  : the scenario's name
 *   i0    : the initial number of infected machines (> 1 for a hitlist)
 *   beta  : the infection rate (1/s)
 *   N     : the total number of vulnerable machines
 * Returns: the time (in seconds) to reach 90% saturation.
 */
static double scenario(const char *name, double i0, double beta, double N)
{
    double doubling = log(2.0) / beta;      /* early-phase doubling time */
    double dt = doubling / 40.0;            /* split every doubling into 40 steps */
    char b[41], sbuf[16];

    /* Estimate the time to reach 99% saturation in closed form. */
    double t99 = (1.0 / beta) * log((0.99 / 0.01) * ((N - i0) / i0));
    double end_t = t99 * 1.02;
    int samples = 12;                       /* how many lines to print */

    printf("  Scenario: %s\n", name);
    printf("    N=%.0f susceptible  i0=%.0f  doubling=%.2f s\n", N, i0,
           doubling);
    printf("      %-9s %10s  %6s\n", "time", "infected", "fraction");

    /* Sampling instants: evenly spaced from 0 to end_t. */
    double t = 0.0, i = i0;
    int step = 0, printed = 0;
    double next_sample = 0.0;
    double sample_interval = end_t / (double)(samples - 1);

    while (step < MAX_STEPS && printed < samples) {
        if (t + 1e-9 >= next_sample) {
            double frac = i / N;
            bar(frac, b, 30);
            format_time(t, sbuf, sizeof sbuf);
            printf("      %s %10.0f  %5.1f%% |%s|\n", sbuf, i, frac * 100.0,
                   b);
            next_sample += sample_interval;
            printed++;
        }
        /* the SI difference equation (an Euler step) */
        i = i + beta * i * (1.0 - i / N) * dt;
        if (i > N)
            i = N;
        t += dt;
        step++;
    }

    /* 90% saturation time (closed form). */
    double t90 = (1.0 / beta) * log((0.90 / 0.10) * ((N - i0) / i0));
    format_time(t90, sbuf, sizeof sbuf);
    printf("      -> 90%% saturation: %s\n\n", sbuf);
    return t90;
}

int main(void)
{
    demo_prepare();

    printf("SI (Susceptible-Infected) outbreak model - calculation only, no network\n");
    printf("i(t+dt) = i(t) + beta*i(t)*(1 - i(t)/N)*dt\n\n");

    /* 1) Code-Red-like: slow random scanning (needs a TCP handshake).
          Observed doubling ~37 min; beta = ln2 / (37*60). */
    double cr = scenario("Code-Red-like (random scanning, slow)",
                        1.0, log(2.0) / (37.0 * 60.0), 360000.0);

    /* 2) SQL-Slammer-like: a single UDP packet, very fast.
          Observed first-minute doubling ~8.5 s; beta = ln2 / 8.5. */
    double sl = scenario("Slammer-like (random scanning, fast UDP)",
                        1.0, log(2.0) / 8.5, 75000.0);

    /* 3) Hitlist: the same speed, but starting from a ready list of 10000
          machines (i0 is large). The slow opening phase disappears. */
    double hl = scenario("Hitlist (Slammer speed, i0=10000 pre-built targets)",
                        10000.0, log(2.0) / 8.5, 75000.0);

    printf("  COMPARISON (time to reach 90%% saturation):\n");
    printf("    Code-Red-like : %.0f s (~%.1f hours)\n", cr, cr / 3600.0);
    printf("    Slammer-like  : %.0f s (~%.1f minutes)\n", sl, sl / 60.0);
    printf("    Hitlist       : %.0f s (~%.1f minutes)\n", hl, hl / 60.0);
    printf("  At the same beta, the hitlist skips the slow opening phase and\n");
    printf("  brings saturation forward. A high beta (Slammer) instead pulls\n");
    printf("  the curve in from hours to minutes.\n");
    return 0;
}
