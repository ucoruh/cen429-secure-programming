set(CEN429_FOLDER "Week 13/02 Requirement quality checker")
cen429_add_demo(requirement_quality SOURCES requirement_quality.c MODE secure)

# --- Tests --------------------------------------------------------------------------------------
cen429_add_demo(test_requirement_quality SOURCES tests/test_requirement_quality.c MODE secure)
cen429_test(NAME week-13/02-requirement-quality/unit COMMAND test_requirement_quality
            PASS_REGEX "0 failures")

# End-to-end: the built-in sample set (run with no arguments) has exactly 3 weak requirements out
# of 5; a requirement passed as a single command-line argument is checked the same way.
cen429_test(NAME week-13/02-requirement-quality/embedded-sample
            COMMAND requirement_quality
            PASS_REGEX "Summary: 3/5 requirements are WEAK")
cen429_test(NAME week-13/02-requirement-quality/cli-weak
            COMMAND requirement_quality "The application should be secure."
            PASS_REGEX "1 weak requirement")
cen429_test(NAME week-13/02-requirement-quality/cli-ok
            COMMAND requirement_quality "The build must use PIE and full RELRO."
            PASS_REGEX "0 weak requirement")
