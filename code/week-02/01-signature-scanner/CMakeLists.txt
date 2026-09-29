set(CEN429_FOLDER "Week 02/01 Signature scanner")
# SHA-256: OpenSSL (crypto) on Linux, BCrypt (bcrypt) on Windows. For entropy the
# math library is linked separately, and only on Linux.
cen429_add_demo(scanner          SOURCES scanner.c          MODE optimize
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>
                       $<$<NOT:$<PLATFORM_ID:Windows>>:m>)
cen429_add_demo(generate_samples SOURCES generate_samples.c MODE optimize)

# --- Tests --------------------------------------------------------------------------------
# Unit tests: entropy()/contains()/split_capsule()/find_pattern()/sha256_hex() are all pure,
# bounded, safe to call in-process.
cen429_add_demo(test_scanner SOURCES tests/test_scanner.c MODE optimize
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>
                       $<$<NOT:$<PLATFORM_ID:Windows>>:m>)
cen429_test(NAME week-02/01-signature-scanner/unit COMMAND test_scanner
            PASS_REGEX "0 failures")

# End-to-end: generate_samples writes real files, then scanner is run against them.
# generate_samples() does not create its own output folder (a fresh checkout has none, since
# code/**/output/ is gitignored); demo.ps1/demo.sh create it first, and so does this test.
cen429_test(NAME week-02/01-signature-scanner/make-output-folder
            COMMAND ${CMAKE_COMMAND} -E make_directory output)
set_tests_properties(week-02/01-signature-scanner/make-output-folder PROPERTIES FIXTURES_SETUP scanner_dir)
cen429_test(NAME week-02/01-signature-scanner/generate-samples
            COMMAND generate_samples output
            PASS_REGEX "7 sample files generated")
set_tests_properties(week-02/01-signature-scanner/generate-samples PROPERTIES
                      FIXTURES_REQUIRED scanner_dir FIXTURES_SETUP scanner_samples)

cen429_test(NAME week-02/01-signature-scanner/hash-catches-exact-sample
            COMMAND scanner hash signatures.txt output/sample_a.bin
            PASS_REGEX "CAUGHT +Sample\\.BlueCat\\.A")
set_tests_properties(week-02/01-signature-scanner/hash-catches-exact-sample PROPERTIES FIXTURES_REQUIRED scanner_samples)

cen429_test(NAME week-02/01-signature-scanner/hash-evaded-by-one-byte-change
            COMMAND scanner hash signatures.txt output/sample_a_1byte.bin
            PASS_REGEX "CLEAN"
            LABELS "intentional-bug")
set_tests_properties(week-02/01-signature-scanner/hash-evaded-by-one-byte-change PROPERTIES FIXTURES_REQUIRED scanner_samples)

cen429_test(NAME week-02/01-signature-scanner/pattern-survives-polymorphic-copy
            COMMAND scanner pattern signatures.txt output/poly_1.bin
            PASS_REGEX "CAUGHT +Sample\\.Decoder\\.xs32")
set_tests_properties(week-02/01-signature-scanner/pattern-survives-polymorphic-copy PROPERTIES FIXTURES_REQUIRED scanner_samples)

cen429_test(NAME week-02/01-signature-scanner/emulation-catches-decoded-body
            COMMAND scanner emulation signatures.txt output/poly_1.bin
            PASS_REGEX "CAUGHT")
set_tests_properties(week-02/01-signature-scanner/emulation-catches-decoded-body PROPERTIES FIXTURES_REQUIRED scanner_samples)
