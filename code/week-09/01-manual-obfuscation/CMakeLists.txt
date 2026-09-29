set(CEN429_FOLDER "Week 09/01 Manual obfuscation and cost")

# Same behavior, two versions. Built with the same optimization level so the comparison is fair.
cen429_add_demo(access_clean      SOURCES run.c clean.c      MODE optimize)
cen429_add_demo(access_obfuscated SOURCES run.c obfuscated.c MODE optimize)

# --- Tests ------------------------------------------------------------------------------------
# Unit tests: grant_access() is pure and safe to call in-process. Test it against BOTH
# implementation files independently (same interface, different bodies) so a bug hiding behind
# the obfuscation cannot slip past the clean version's tests, or vice versa.
cen429_add_demo(test_access_clean      SOURCES tests/test_access_clean.c      MODE optimize)
cen429_add_demo(test_access_obfuscated SOURCES tests/test_access_obfuscated.c MODE optimize)
cen429_test(NAME week-09/01-manual-obfuscation/access_clean-unit COMMAND test_access_clean
            PASS_REGEX "0 failures")
cen429_test(NAME week-09/01-manual-obfuscation/access_obfuscated-unit COMMAND test_access_obfuscated
            PASS_REGEX "0 failures")

# End-to-end: run the real binaries; both must accept the same valid token and reject the same
# invalid one (behavior preservation is the whole point of this demo).
cen429_test(NAME week-09/01-manual-obfuscation/access_clean-grants-valid-token
            COMMAND access_clean CEN429-OK
            PASS_REGEX "token=\"CEN429-OK\"  -> GRANTED")
cen429_test(NAME week-09/01-manual-obfuscation/access_obfuscated-grants-valid-token
            COMMAND access_obfuscated CEN429-OK
            PASS_REGEX "token=\"CEN429-OK\"  -> GRANTED")
cen429_test(NAME week-09/01-manual-obfuscation/access_clean-rejects-invalid
            COMMAND access_clean CEN429-XX
            PASS_REGEX "token=\"CEN429-XX\"  -> DENIED")
cen429_test(NAME week-09/01-manual-obfuscation/access_obfuscated-rejects-invalid
            COMMAND access_obfuscated CEN429-XX
            PASS_REGEX "token=\"CEN429-XX\"  -> DENIED")
