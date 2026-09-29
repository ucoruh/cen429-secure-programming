set(CEN429_FOLDER "Week 12/01 Unit test runner (S16)")
cen429_add_demo(unit_test SOURCES test_runner.c system_under_test.c MODE secure)

# --- Tests --------------------------------------------------------------------------------------
cen429_add_demo(test_system_under_test SOURCES tests/test_system_under_test.c MODE secure)
cen429_test(NAME week-12/01-unit-test/unit COMMAND test_system_under_test
            PASS_REGEX "0 failures")

# End-to-end: the real compiled test-card runner must report all six cards PASSED.
cen429_test(NAME week-12/01-unit-test/end-to-end COMMAND unit_test
            PASS_REGEX "RESULT: 6 passed, 0 failed")
