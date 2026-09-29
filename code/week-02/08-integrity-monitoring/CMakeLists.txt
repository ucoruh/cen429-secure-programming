set(CEN429_FOLDER "Week 02/08 Integrity monitoring")
# SHA-256 and HMAC: OpenSSL (crypto) on Linux, BCrypt (bcrypt) on Windows.
cen429_add_demo(integrity_monitor SOURCES integrity.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests --------------------------------------------------------------------------------
cen429_add_demo(test_integrity SOURCES tests/test_integrity.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-02/08-integrity-monitoring/unit COMMAND test_integrity
            PASS_REGEX "0 failures")

# End-to-end: create a baseline over a small scratch folder (output/itest/, never the source
# tree), then verify it clean. Each stage's FIXTURES_SETUP is the next stage's FIXTURES_REQUIRED,
# a straight chain (never the same fixture name on both sides of one test -- that is a cycle).
cen429_test(NAME week-02/08-integrity-monitoring/make-scratch-folder
            COMMAND ${CMAKE_COMMAND} -E make_directory output/itest)
set_tests_properties(week-02/08-integrity-monitoring/make-scratch-folder PROPERTIES
                      FIXTURES_SETUP integrity_scratch_dir)
cen429_test(NAME week-02/08-integrity-monitoring/write-scratch-file
            COMMAND ${CMAKE_COMMAND} -E copy README.md output/itest/sample.txt)
set_tests_properties(week-02/08-integrity-monitoring/write-scratch-file PROPERTIES
                      FIXTURES_REQUIRED integrity_scratch_dir FIXTURES_SETUP integrity_scratch_file)
cen429_test(NAME week-02/08-integrity-monitoring/create-baseline
            COMMAND integrity_monitor create output/itest output/itest/manifest.txt
            PASS_REGEX "Baseline written")
set_tests_properties(week-02/08-integrity-monitoring/create-baseline PROPERTIES
                      FIXTURES_REQUIRED integrity_scratch_file FIXTURES_SETUP integrity_baseline)
cen429_test(NAME week-02/08-integrity-monitoring/verify-clean
            COMMAND integrity_monitor verify output/itest output/itest/manifest.txt
            PASS_REGEX "integrity preserved")
set_tests_properties(week-02/08-integrity-monitoring/verify-clean PROPERTIES FIXTURES_REQUIRED integrity_baseline)
