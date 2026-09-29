/* Minimal unit-test helpers for the CEN429 C demos (no external framework needed).
 *
 * Usage in code/week-NN/<demo>/tests/test_<program>.c:
 *     #define main program_main
 *     #include "../report.c"
 *     #undef main
 *     #include "../../../common/test_check.h"
 *     int main(void) {
 *         CHECK_EQ_INT(some_function(a, b), 42);
 *         CHECK_EQ_STR(some_text(), "expected");
 *         CHECK_MEM(buffer, "\x01\x02\x03", 3);
 *         CHECK(condition);
 *         TEST_SUMMARY();          // prints the result; returns 0 only if every check passed
 *     }
 */
#ifndef CEN429_TEST_CHECK_H
#define CEN429_TEST_CHECK_H

#include <stdio.h>
#include <string.h>

static int test_checks = 0;
static int test_failures = 0;

#define CHECK(cond)                                                                    \
    do {                                                                               \
        test_checks++;                                                                 \
        if (!(cond)) {                                                                 \
            test_failures++;                                                           \
            fprintf(stderr, "%s:%d: CHECK failed: %s\n", __FILE__, __LINE__, #cond);   \
        }                                                                              \
    } while (0)

#define CHECK_EQ_INT(actual, expected)                                                 \
    do {                                                                               \
        long long a_ = (long long) (actual), e_ = (long long) (expected);              \
        test_checks++;                                                                 \
        if (a_ != e_) {                                                                \
            test_failures++;                                                           \
            fprintf(stderr, "%s:%d: %s == %lld, expected %lld\n",                      \
                    __FILE__, __LINE__, #actual, a_, e_);                              \
        }                                                                              \
    } while (0)

#define CHECK_EQ_STR(actual, expected)                                                 \
    do {                                                                               \
        const char *a_ = (actual), *e_ = (expected);                                   \
        test_checks++;                                                                 \
        if ((a_ == NULL) != (e_ == NULL) || (a_ && e_ && strcmp(a_, e_) != 0)) {        \
            test_failures++;                                                           \
            fprintf(stderr, "%s:%d: %s == \"%s\", expected \"%s\"\n",                  \
                    __FILE__, __LINE__, #actual, a_ ? a_ : "(null)", e_ ? e_ : "(null)"); \
        }                                                                              \
    } while (0)

#define CHECK_MEM(actual, expected, size)                                              \
    do {                                                                               \
        const void *a_ = (actual), *e_ = (expected);                                   \
        size_t n_ = (size_t) (size);                                                   \
        test_checks++;                                                                 \
        if (memcmp(a_, e_, n_) != 0) {                                                 \
            test_failures++;                                                           \
            fprintf(stderr, "%s:%d: %s != expected (%zu bytes)\n",                     \
                    __FILE__, __LINE__, #actual, n_);                                  \
        }                                                                              \
    } while (0)

#define TEST_SUMMARY()                                                                 \
    do {                                                                               \
        printf("%d checks, %d failures\n", test_checks, test_failures);               \
        return test_failures == 0 ? 0 : 1;                                             \
    } while (0)

#endif /* CEN429_TEST_CHECK_H */
