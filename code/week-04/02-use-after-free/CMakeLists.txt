set(CEN429_FOLDER "Week 04/02 Use-after-free and double-free")
cen429_add_demo(uaf        SOURCES uaf.c        MODE unprotected)
cen429_add_demo(uaf_asan   SOURCES uaf.c        MODE asan)
cen429_add_demo(uaf_secure SOURCES uaf_secure.c MODE secure)

# --- Tests ------------------------------------------------------------------------------------
cen429_add_demo(test_uaf_secure SOURCES tests/test_uaf_secure.c MODE optimize)
cen429_test(NAME week-04/02-use-after-free/uaf_secure-unit COMMAND test_uaf_secure
            PASS_REGEX "0 failures")

# End-to-end: only the part of the unprotected run that happens BEFORE the use-after-free is
# deterministic (what happens after depends on the allocator/platform — see uaf.c's own comment
# and demo.ps1/demo.sh, which print the dangling read/call but never assert its value).
cen429_test(NAME week-04/02-use-after-free/uaf-opens-session
            COMMAND uaf uaf
            PASS_REGEX "1\\) Session opened: role=user"
            LABELS "intentional-bug")
# ASan deterministically catches both bugs regardless of what the allocator happened to reuse.
cen429_test(NAME week-04/02-use-after-free/uaf_asan-catches-use-after-free
            COMMAND uaf_asan uaf
            PASS_REGEX "AddressSanitizer"
            LABELS "intentional-bug;plain-vulnerable")
cen429_test(NAME week-04/02-use-after-free/uaf_asan-catches-double-free
            COMMAND uaf_asan double
            PASS_REGEX "double-free"
            LABELS "intentional-bug;plain-vulnerable")

cen429_test(NAME week-04/02-use-after-free/uaf_secure-uaf-rejects
            COMMAND uaf_secure uaf
            PASS_REGEX "NULL check before use: no session, action rejected\\.")
cen429_test(NAME week-04/02-use-after-free/uaf_secure-double-is-safe
            COMMAND uaf_secure double
            PASS_REGEX "no double-free")
