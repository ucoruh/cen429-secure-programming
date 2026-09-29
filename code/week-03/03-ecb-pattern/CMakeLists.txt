set(CEN429_FOLDER "Week 03/03 ECB pattern leak")
cen429_add_demo(ecb_pattern SOURCES ecb_pattern.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests ------------------------------------------------------------------------------------
cen429_add_demo(test_ecb_pattern SOURCES tests/test_ecb_pattern.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-03/03-ecb-pattern/unit COMMAND test_ecb_pattern
            PASS_REGEX "0 failures")

cen429_test(NAME week-03/03-ecb-pattern/runs-e2e
            COMMAND ecb_pattern
            PASS_REGEX "pattern is gone")
