set(CEN429_FOLDER "Week 11/01 Toy whitebox table")
cen429_add_demo(toy_table SOURCES toy_table.c MODE optimize)

# --- Tests ------------------------------------------------------------------------------------
cen429_add_demo(test_toy_table SOURCES tests/test_toy_table.c MODE optimize)
cen429_test(NAME week-11/01-toy-table/toy_table-unit COMMAND test_toy_table
            PASS_REGEX "0 failures")

# End-to-end: the real binary's own output. The naive table must leak the key; the encoded
# table must not. This demo IS the vulnerability (an unencoded lookup table); the assertion is
# the documented, deterministic printed message, never a raw exploit re-run.
cen429_test(NAME week-11/01-toy-table/naive-table-leaks-key
            COMMAND toy_table
            PASS_REGEX "KEY LEAKED")
cen429_test(NAME week-11/01-toy-table/encoded-table-blocks-recovery
            COMMAND toy_table
            PASS_REGEX "Naive recovery FAILED")
set_tests_properties(week-11/01-toy-table/naive-table-leaks-key
                      week-11/01-toy-table/encoded-table-blocks-recovery
                      PROPERTIES LABELS "intentional-bug")
