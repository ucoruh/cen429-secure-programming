set(CEN429_FOLDER "Week 02/02 Entropy")
# entropy: the math library on Linux, for log2. generate: AES-GCM encryption
# needs OpenSSL (crypto) on Linux, BCrypt (bcrypt) on Windows.
cen429_add_demo(entropy  SOURCES entropy.c  MODE optimize
             LIBS $<$<NOT:$<PLATFORM_ID:Windows>>:m>)
cen429_add_demo(generate SOURCES generate.c MODE optimize
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests --------------------------------------------------------------------------------
cen429_add_demo(test_entropy SOURCES tests/test_entropy.c MODE optimize
             LIBS $<$<NOT:$<PLATFORM_ID:Windows>>:m>)
cen429_test(NAME week-02/02-entropy/unit COMMAND test_entropy
            PASS_REGEX "0 failures")

# generate() does not create its own output folder (a fresh checkout has none, since
# code/**/output/ is gitignored); demo.ps1/demo.sh create it first, and so does this test.
cen429_test(NAME week-02/02-entropy/make-output-folder
            COMMAND ${CMAKE_COMMAND} -E make_directory output)
set_tests_properties(week-02/02-entropy/make-output-folder PROPERTIES FIXTURES_SETUP entropy_dir)
cen429_test(NAME week-02/02-entropy/generate-samples
            COMMAND generate output
            PASS_REGEX "6 sample files generated")
set_tests_properties(week-02/02-entropy/generate-samples PROPERTIES
                      FIXTURES_REQUIRED entropy_dir FIXTURES_SETUP entropy_samples)

cen429_test(NAME week-02/02-entropy/uniform-is-near-zero
            COMMAND entropy output/uniform.txt
            PASS_REGEX "uniform\\.txt +4096 +0\\.00 .* uniform")
set_tests_properties(week-02/02-entropy/uniform-is-near-zero PROPERTIES FIXTURES_REQUIRED entropy_samples)

cen429_test(NAME week-02/02-entropy/random-is-high
            COMMAND entropy output/random.bin
            PASS_REGEX "HIGH")
set_tests_properties(week-02/02-entropy/random-is-high PROPERTIES FIXTURES_REQUIRED entropy_samples)

cen429_test(NAME week-02/02-entropy/windowed-scan-of-mixed-file
            COMMAND entropy -p 1536 output/mixed.bin
            PASS_REGEX "mixed\\.bin \\(4608 bytes\\), window 1536 bytes")
set_tests_properties(week-02/02-entropy/windowed-scan-of-mixed-file PROPERTIES FIXTURES_REQUIRED entropy_samples)
