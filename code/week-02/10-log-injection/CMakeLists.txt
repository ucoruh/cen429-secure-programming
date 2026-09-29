set(CEN429_FOLDER "Week 02/10 Log injection")
cen429_add_demo(logtool SOURCES logtool.c MODE secure)

# --- Tests --------------------------------------------------------------------------------
cen429_add_demo(test_logtool SOURCES tests/test_logtool.c MODE secure)
cen429_test(NAME week-02/10-log-injection/unit COMMAND test_logtool
            PASS_REGEX "0 failures")

# generate() does not create its own work folder (a fresh checkout has none, since
# code/**/work/ is gitignored); demo.ps1/demo.sh create it first, and so does this test.
cen429_test(NAME week-02/10-log-injection/make-work-folder
            COMMAND ${CMAKE_COMMAND} -E make_directory work)
set_tests_properties(week-02/10-log-injection/make-work-folder PROPERTIES FIXTURES_SETUP logtool_dir)
cen429_test(NAME week-02/10-log-injection/generate-samples
            COMMAND logtool generate work
            PASS_REGEX "Sample input files written")
set_tests_properties(week-02/10-log-injection/generate-samples PROPERTIES
                      FIXTURES_REQUIRED logtool_dir FIXTURES_SETUP logtool_samples)

# write_unsafe()/write_safe() APPEND (fopen "ab"): start from a known-empty log every run, so a
# previous run (or a manually-run demo.ps1/demo.sh) can never change this test's line count.
cen429_test(NAME week-02/10-log-injection/clean-log
            COMMAND ${CMAKE_COMMAND} -E rm -f work/unsafe.log)
set_tests_properties(week-02/10-log-injection/clean-log PROPERTIES
                      FIXTURES_REQUIRED logtool_samples FIXTURES_SETUP logtool_clean_log)

cen429_test(NAME week-02/10-log-injection/unsafe-injection-creates-forged-line
            COMMAND logtool write unsafe work/02-injection.bin work/unsafe.log
            LABELS "intentional-bug")
set_tests_properties(week-02/10-log-injection/unsafe-injection-creates-forged-line PROPERTIES
                      FIXTURES_REQUIRED logtool_clean_log)
cen429_test(NAME week-02/10-log-injection/unsafe-log-has-forged-admin-line
            COMMAND logtool count work/unsafe.log
            PASS_REGEX "forged 'admin SUCCESS' line\\(s\\): 1")
set_tests_properties(week-02/10-log-injection/unsafe-log-has-forged-admin-line PROPERTIES
                      FIXTURES_REQUIRED logtool_clean_log
                      DEPENDS week-02/10-log-injection/unsafe-injection-creates-forged-line)
