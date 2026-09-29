/*
 * CEN429 - Week 12 - Demo 1: Unit test runner (S16 "test RESULTS").
 * Every test is a "test card": id, purpose, expected, observed, decision.
 * Exit code = number of failed tests (used in CI/grading).
 * SAFE: pure computation; no file/network/system access.
 */
#include <stdio.h>
#include <limits.h>
#include "system_under_test.h"

static int passed = 0, failed = 0;

/* One test card: PASS if the condition is true, FAIL otherwise (with the evidence line). */
static void card(const char *id, const char *purpose, int condition, const char *observed)
{
    const char *decision = condition ? "PASS" : "FAIL";
    if (condition) passed++; else failed++;
    printf("  [%s] %-6s %s\n", id, decision, purpose);
    printf("        observed: %s\n", observed);
}

int main(void)
{
    int r;
    printf("=== S16 Unit Tests (validate_input, safe_add) ===\n");

    card("T-01", "Valid input is accepted",
         validate_input("Alice_2026") == 1, "validate_input(\"Alice_2026\") = 1");

    card("T-02", "Whitespace/metacharacters are rejected",
         validate_input("rm -rf /") == 0, "validate_input(\"rm -rf /\") = 0");

    card("T-03", "Empty input is rejected",
         validate_input("") == 0, "validate_input(\"\") = 0");

    card("T-04", "Input longer than 32 characters is rejected",
         validate_input("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") == 0, "33 characters -> 0");

    r = 0;
    card("T-05", "Normal addition is correct",
         safe_add(2, 3, &r) == 1 && r == 5, "safe_add(2,3) = 5, ok");

    r = 12345;
    card("T-06", "Overflow is caught BEFORE it happens",
         safe_add(INT_MAX, 1, &r) == 0, "safe_add(INT_MAX,1) = overflow (0)");

    printf("\nRESULT: %d passed, %d failed.\n", passed, failed);
    if (failed == 0) printf("All tests PASSED. This table becomes S16 in the project.\n");
    return failed;   /* exit code = number of failed tests */
}
