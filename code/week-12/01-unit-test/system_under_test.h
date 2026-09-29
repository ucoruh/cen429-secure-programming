#ifndef CEN429_H12_SYSTEM_UNDER_TEST_H
#define CEN429_H12_SYSTEM_UNDER_TEST_H
int validate_input(const char *s);           /* 1 = accept, 0 = reject */
int safe_add(int a, int b, int *result);      /* 1 = ok, 0 = overflow */
#endif
