set(CEN429_FOLDER "Week 11/02 Embedded key (naive fix)")
cen429_add_demo(embedded_key SOURCES embedded_key.c MODE optimize)

# --- Tests ------------------------------------------------------------------------------------
cen429_add_demo(test_embedded_key SOURCES tests/test_embedded_key.c MODE optimize)
cen429_test(NAME week-11/02-embedded-key/embedded_key-unit COMMAND test_embedded_key
            PASS_REGEX "0 failures")

# End-to-end: run the real binary. Without --scan it just prints the checksum + usage line;
# with --scan it must find its OWN embedded key inside its OWN compiled binary. This demo IS the
# vulnerability (a key embedded in software); the assertion is the documented, deterministic
# printed message, never a raw exploit re-run.
cen429_test(NAME week-11/02-embedded-key/no-args-prints-usage
            COMMAND embedded_key
            PASS_REGEX "Pseudo-operation done")
cen429_test(NAME week-11/02-embedded-key/scan-finds-embedded-key
            COMMAND embedded_key --scan
            PASS_REGEX "LEAKED: the 16-byte embedded key was found")
set_tests_properties(week-11/02-embedded-key/scan-finds-embedded-key
                      PROPERTIES LABELS "intentional-bug")
