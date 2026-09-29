set(CEN429_FOLDER "Week 04/01 Format string vulnerability")
# GCC/Clang: turn ON the format-string warnings. -Wformat-security is not on by default;
# -Werror=format-security would turn a non-constant format string into a build error.
set(_fmt_opts $<$<C_COMPILER_ID:GNU,Clang>:-Wformat>
              $<$<C_COMPILER_ID:GNU,Clang>:-Wformat-security>)

cen429_add_demo(leak         SOURCES leak.c        MODE unprotected ALLOW_WARNINGS)
cen429_add_demo(leak_checked SOURCES leak.c        MODE checked ALLOW_WARNINGS)
cen429_add_demo(leak_secure  SOURCES leak_secure.c  MODE secure OPTIONS ${_fmt_opts})

# --- Tests ------------------------------------------------------------------------------------
cen429_add_demo(test_leak_secure SOURCES tests/test_leak_secure.c MODE optimize)
cen429_test(NAME week-04/01-format-string/leak_secure-unit COMMAND test_leak_secure
            PASS_REGEX "0 failures")

cen429_test(NAME week-04/01-format-string/leak-normal
            COMMAND leak Hello
            PASS_REGEX "Program output -> Hello")
# %x.%x... : the format string is consumed as specifiers -> hex words appear where the literal
# text would otherwise be (never asserting WHICH value leaked, only that specifiers were consumed).
cen429_test(NAME week-04/01-format-string/leak-percent-x-reads-stack
            COMMAND leak "%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x.%x"
            PASS_REGEX "[0-9a-f]+\\.[0-9a-f]+\\.[0-9a-f]+"
            LABELS "intentional-bug;plain-vulnerable")

cen429_test(NAME week-04/01-format-string/leak_secure-normal
            COMMAND leak_secure Hello
            PASS_REGEX "Program output -> Hello")
# The secure version treats %x/%n as plain text: the literal specifiers survive unchanged.
cen429_test(NAME week-04/01-format-string/leak_secure-percent-n-is-just-text
            COMMAND leak_secure "%x %x %n attack attempt"
            PASS_REGEX "%x %x %n attack attempt")
cen429_test(NAME week-04/01-format-string/leak_secure-rejects-too-long
            COMMAND leak_secure "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
            PASS_REGEX "Rejected: text too long")
