set(CEN429_FOLDER "Week 01/04 Signed length")
# The signed -> unsigned conversion warning is enabled in GCC with -Wsign-conversion (off by default).
# MSVC's C compiler has no equivalent; C4365 only shows up when the code is compiled as C++ (see demo.ps1).
set(_uyari $<$<C_COMPILER_ID:GNU,Clang>:-Wsign-conversion>)
cen429_add_demo(copy        SOURCES copy.c        MODE unprotected OPTIONS ${_uyari} ALLOW_WARNINGS)
cen429_add_demo(copy_asan   SOURCES copy.c        MODE asan)
cen429_add_demo(copy_secure SOURCES copy_secure.c MODE secure   OPTIONS ${_uyari})

# --- Tests ------------------------------------------------------------------------------------
# Unit tests: copy_record() (copy.c) and read_length() (copy_secure.c) — see the comment at the
# top of each tests/test_*.c for why a negative length is never passed to copy_record() in-process.
cen429_add_demo(test_copy SOURCES tests/test_copy.c MODE optimize)
cen429_test(NAME week-01/04-signed-length/copy-unit COMMAND test_copy PASS_REGEX "0 failures")
cen429_add_demo(test_copy_secure SOURCES tests/test_copy_secure.c MODE optimize)
cen429_test(NAME week-01/04-signed-length/copy_secure-unit COMMAND test_copy_secure
            PASS_REGEX "0 failures")

# End-to-end: run the real binaries.
cen429_test(NAME week-01/04-signed-length/copy-accepts-valid-length
            COMMAND copy 8
            PASS_REGEX "Copied: SAMPLE-R")
cen429_test(NAME week-01/04-signed-length/copy-rejects-too-large
            COMMAND copy 17
            PASS_REGEX "Rejected: length is too large\\.")
# A negative length passes the (upper-bound-only) check and reaches memcpy() with a huge size_t:
# a real, documented crash (SIGSEGV on Linux; on Windows the /GS stack-cookie check turns it into
# a fail-fast STATUS_STACK_BUFFER_OVERRUN). Deliberately NOT a CTest case here: a crash's exact
# exit status is not something WILL_FAIL can reliably invert (a fail-fast/SEH termination is not
# just "a nonzero exit code" to CTest), and the crash can cut stdio output before it is flushed.
# The deterministic, testable half of this bug is one step down: what the ASan build reports, and
# what the fixed build rejects — both covered below.
cen429_test(NAME week-01/04-signed-length/copy_asan-reports-negative-size
            COMMAND copy_asan -1
            PASS_REGEX "negative-size-param"
            LABELS "intentional-bug")

cen429_test(NAME week-01/04-signed-length/copy_secure-accepts-valid-length
            COMMAND copy_secure 8
            PASS_REGEX "Copied \\(8 bytes\\): SAMPLE-R")
cen429_test(NAME week-01/04-signed-length/copy_secure-accepts-upper-bound
            COMMAND copy_secure 16
            PASS_REGEX "Copied \\(16 bytes\\): SAMPLE-RECORD-1")
cen429_test(NAME week-01/04-signed-length/copy_secure-rejects-negative-length
            COMMAND copy_secure -1
            PASS_REGEX "Rejected: length must be an integer")
cen429_test(NAME week-01/04-signed-length/copy_secure-rejects-garbage
            COMMAND copy_secure 12abc
            PASS_REGEX "Rejected: length must be an integer")
