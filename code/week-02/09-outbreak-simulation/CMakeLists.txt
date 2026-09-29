set(CEN429_FOLDER "Week 02/09 Outbreak simulation")
# log2/log needs the math library (m) linked separately on Linux.
cen429_add_demo(outbreak SOURCES outbreak.c MODE optimize
             LIBS $<$<NOT:$<PLATFORM_ID:Windows>>:m>)

# --- Tests --------------------------------------------------------------------------------
cen429_add_demo(test_outbreak SOURCES tests/test_outbreak.c MODE optimize
             LIBS $<$<NOT:$<PLATFORM_ID:Windows>>:m>)
cen429_test(NAME week-02/09-outbreak-simulation/unit COMMAND test_outbreak
            PASS_REGEX "0 failures")

cen429_test(NAME week-02/09-outbreak-simulation/runs
            COMMAND outbreak
            PASS_REGEX "COMPARISON \\(time to reach 90% saturation\\)")
