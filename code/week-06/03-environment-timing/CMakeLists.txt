set(CEN429_FOLDER "Week 06/03 Environment + timing")
cen429_add_demo(environment SOURCES environment.c MODE secure)

# --- Tests --------------------------------------------------------------------------------------
cen429_add_demo(test_environment SOURCES tests/test_environment.c MODE secure)
cen429_test(NAME week-06/03-environment-timing/unit COMMAND test_environment
            PASS_REGEX "0 failures")

# End-to-end: the real compiled binary always runs to completion and prints a RESULT line,
# whichever branch (hypervisor seen or not) CTest's own machine happens to take.
cen429_test(NAME week-06/03-environment-timing/runs
            COMMAND environment
            PASS_REGEX "RESULT: (a hypervisor was SEEN|no hypervisor visible)")
