set(CEN429_FOLDER "Week 01/03 Privilege escalation through overflow")
cen429_add_demo(login         SOURCES login.c        MODE unprotected)
cen429_add_demo(login_checked SOURCES login.c        MODE checked)
cen429_add_demo(login_asan    SOURCES login.c        MODE asan)
cen429_add_demo(login_secure  SOURCES login_secure.c MODE secure)

# --- Tests ------------------------------------------------------------------------------------
# Unit tests: only login_secure.c's name_is_valid() is safe to call in-process (see the comment at
# the top of tests/test_login_secure.c for why login.c's own overflow is end-to-end-only).
cen429_add_demo(test_login_secure SOURCES tests/test_login_secure.c MODE optimize)
cen429_test(NAME week-01/03-overflow-input/login_secure-unit COMMAND test_login_secure
            PASS_REGEX "0 failures")

# End-to-end: run the real binaries.
cen429_test(NAME week-01/03-overflow-input/login-normal
            COMMAND login alice
            PASS_REGEX "Normal user session\\.")

# Exactly 16 chars: the NUL terminator lands on admin's low byte, which was already 0 -> no
# visible change. Safe: still fully inside the struct.
cen429_test(NAME week-01/03-overflow-input/login-16char-fills-name-exactly
            COMMAND login abcdefghij123456
            PASS_REGEX "Normal user session\\.")

# 16 'A' + 'B': the documented, reproducible overflow that lands inside the struct (ASan stays
# silent for this one — see login_asan's test below for one that goes past the whole struct).
cen429_test(NAME week-01/03-overflow-input/login-17char-overflow-grants-admin
            COMMAND login AAAAAAAAAAAAAAAAB
            PASS_REGEX "ADMIN panel"
            LABELS "intentional-bug;plain-vulnerable")

# The "checked" build's stop message differs by platform (Windows: our own invalid-parameter
# handler in cen429_demo.h, reached through a controlled _exit(3) — PASS_REGULAR_EXPRESSION can
# freely override a controlled nonzero exit. Linux: glibc's _FORTIFY_SOURCE=2 check calls abort(),
# which raises SIGABRT — CTest's own crash/signal detection reports that as FAILED no matter what
# PASS_REGULAR_EXPRESSION says, so a tiny shell wrapper captures the crash's own output first and
# turns the check into an ordinary, un-crashed `grep` exit code instead).
if(WIN32)
  cen429_test(NAME week-01/03-overflow-input/login_checked-rejects-overflow
              COMMAND login_checked AAAAAAAAAAAAAAAAB
              PASS_REGEX "secure library function detected an overflow"
              LABELS "intentional-bug")
else()
  # CMake note: a bare ';' inside this string would be split into separate COMMAND arguments (it
  # is a list separator everywhere a CMake variable gets expanded, quoted string or not, and
  # cen429_test() stores COMMAND in a variable before handing it to add_test()) — real newlines
  # are used as the shell statement separator instead, so nothing here is a ';' to split on.
  cen429_test(NAME week-01/03-overflow-input/login_checked-rejects-overflow
              COMMAND sh -c "out=$(bin/linux/login_checked AAAAAAAAAAAAAAAAB 2>&1)
echo \"$out\"
echo \"$out\" | grep -q 'buffer overflow detected'"
              LABELS "intentional-bug")
endif()

# 50 chars: well past the whole struct, not just the admin field next to it.
cen429_test(NAME week-01/03-overflow-input/login_asan-reports-past-the-struct
            COMMAND login_asan AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
            PASS_REGEX "AddressSanitizer"
            LABELS "intentional-bug")

cen429_test(NAME week-01/03-overflow-input/login_secure-normal
            COMMAND login_secure alice
            PASS_REGEX "Normal user session\\.")
cen429_test(NAME week-01/03-overflow-input/login_secure-rejects-overflow
            COMMAND login_secure AAAAAAAAAAAAAAAAB
            PASS_REGEX "Rejected:")
