set(CEN429_FOLDER "Week 06/07 Environment privilege")
cen429_add_demo(privilege SOURCES privilege.c MODE secure)

# --- Tests --------------------------------------------------------------------------------------
cen429_add_demo(test_privilege SOURCES tests/test_privilege.c MODE secure)
cen429_test(NAME week-06/07-environment-privilege/unit COMMAND test_privilege
            PASS_REGEX "0 failures")

# End-to-end: normal run always prints one of the two RESULT lines. It is usually "clean" (CTest
# does not run as admin/root and finds no known indicator), but some CI runners execute as root
# inside a container, in which case the elevated-privilege branch is the correct, expected one --
# the regex accepts either so this test is not flaky under both setups.
cen429_test(NAME week-06/07-environment-privilege/clean-run
            COMMAND privilege
            PASS_REGEX "RESULT: (clean - no risky-environment indicator\\.|an elevated/risky environment INDICATOR is present)")
cen429_test(NAME week-06/07-environment-privilege/extra-indicator-found
            COMMAND privilege "${CMAKE_CURRENT_SOURCE_DIR}/CMakeLists.txt"
            PASS_REGEX "RESULT: an elevated/risky environment INDICATOR is present")
