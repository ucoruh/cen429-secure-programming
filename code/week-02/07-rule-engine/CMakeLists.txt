set(CEN429_FOLDER "Week 02/07 Rule engine")
cen429_add_demo(rule_engine  SOURCES engine.c           MODE secure)
cen429_add_demo(rule_samples SOURCES generate_samples.c MODE optimize)

# --- Tests --------------------------------------------------------------------------------
cen429_add_demo(test_engine SOURCES tests/test_engine.c MODE secure)
cen429_test(NAME week-02/07-rule-engine/unit COMMAND test_engine
            PASS_REGEX "0 failures")

# generate_samples() does not create its own output folder (a fresh checkout has none, since
# code/**/output/ is gitignored); demo.ps1/demo.sh create it first, and so does this test.
cen429_test(NAME week-02/07-rule-engine/make-output-folder
            COMMAND ${CMAKE_COMMAND} -E make_directory output)
set_tests_properties(week-02/07-rule-engine/make-output-folder PROPERTIES FIXTURES_SETUP rule_dir)
cen429_test(NAME week-02/07-rule-engine/generate-samples
            COMMAND rule_samples output
            PASS_REGEX "5 sample files generated")
set_tests_properties(week-02/07-rule-engine/generate-samples PROPERTIES
                      FIXTURES_REQUIRED rule_dir FIXTURES_SETUP rule_samples)

cen429_test(NAME week-02/07-rule-engine/clean-file-matches-nothing
            COMMAND rule_engine rules.txt output/clean.txt
            PASS_REGEX "clean\\.txt +\\(no match\\)")
set_tests_properties(week-02/07-rule-engine/clean-file-matches-nothing PROPERTIES FIXTURES_REQUIRED rule_samples)

cen429_test(NAME week-02/07-rule-engine/broken-rule-file-rejected
            COMMAND rule_engine broken_rule.txt output/clean.txt
            WILL_FAIL)
set_tests_properties(week-02/07-rule-engine/broken-rule-file-rejected PROPERTIES FIXTURES_REQUIRED rule_samples)
