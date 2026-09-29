set(CEN429_FOLDER "Week 02/11 Tamper-evident log")
# HMAC/SHA-256 use the operating system's own crypto library, per platform:
# Linux/WSL OpenSSL (crypto), Windows CNG (bcrypt).
cen429_add_demo(log_chain SOURCES log_chain.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests --------------------------------------------------------------------------------
cen429_add_demo(test_log_chain SOURCES tests/test_log_chain.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-02/11-tamper-evident-log/unit COMMAND test_log_chain
            PASS_REGEX "0 failures")

# End-to-end: run the real binary (the same one demo.ps1/demo.sh run). generate() does not create
# its own output folder (demo.ps1/demo.sh do that first), so this test does too.
cen429_test(NAME week-02/11-tamper-evident-log/make-work-folder
            COMMAND ${CMAKE_COMMAND} -E make_directory work/evolve)
set_tests_properties(week-02/11-tamper-evident-log/make-work-folder PROPERTIES FIXTURES_SETUP log_chain_dir)
cen429_test(NAME week-02/11-tamper-evident-log/generate-evolve
            COMMAND log_chain generate work/evolve evolve
            PASS_REGEX "key evolution.*access\\.auditlog")
set_tests_properties(week-02/11-tamper-evident-log/generate-evolve PROPERTIES
                      FIXTURES_REQUIRED log_chain_dir FIXTURES_SETUP log_chain_evolve)
cen429_test(NAME week-02/11-tamper-evident-log/verify-clean
            COMMAND log_chain verify work/evolve/access.auditlog work/evolve/verifier.key
            PASS_REGEX "the log is INTACT")
set_tests_properties(week-02/11-tamper-evident-log/verify-clean PROPERTIES FIXTURES_REQUIRED log_chain_evolve)
