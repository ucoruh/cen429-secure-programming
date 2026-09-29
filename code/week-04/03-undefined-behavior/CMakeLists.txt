set(CEN429_FOLDER "Week 04/03 Undefined behavior (UBSan)")
cen429_add_demo(ub        SOURCES ub.c        MODE unprotected)
cen429_add_demo(ub_secure SOURCES ub_secure.c MODE secure)

# UBSan is only reliable on Linux/macOS GCC/Clang (no libubsan on MinGW, no UBSan on MSVC).
# This target is SKIPPED on Windows; demo.ps1 explains the alternatives (/analyze, /RTC, CERT).
if(NOT WIN32)
  cen429_add_demo(ub_ubsan SOURCES ub.c MODE unprotected
               OPTIONS -fsanitize=undefined -fno-omit-frame-pointer)
  target_link_options(ub_ubsan PRIVATE -fsanitize=undefined)
endif()

# --- Tests ------------------------------------------------------------------------------------
cen429_add_demo(test_ub_secure SOURCES tests/test_ub_secure.c MODE optimize)
cen429_test(NAME week-04/03-undefined-behavior/ub_secure-unit COMMAND test_ub_secure
            PASS_REGEX "0 failures")

# End-to-end: on x86(-64), these three UB cases happen to compute a specific, reproducible value
# with an unhardened build (that predictability is itself part of the lesson: the compiler is
# NOT required to give this answer, and a different compiler/architecture/optimization level can
# legally give a different one) — labeled intentional-bug because the pass condition documents
# what THIS compiler currently does, not what the standard guarantees.
cen429_test(NAME week-04/03-undefined-behavior/ub-overflow-wraps
            COMMAND ub overflow 1
            PASS_REGEX "INT_MAX \\+ 1 = -2147483648"
            LABELS "intentional-bug")
cen429_test(NAME week-04/03-undefined-behavior/ub-shift-31
            COMMAND ub shift 31
            PASS_REGEX "1 << 31 = -2147483648"
            LABELS "intentional-bug")
cen429_test(NAME week-04/03-undefined-behavior/ub-unaligned-read
            COMMAND ub unaligned
            PASS_REGEX "int read from a misaligned address = 84148994"
            LABELS "intentional-bug")
if(NOT WIN32)
  cen429_test(NAME week-04/03-undefined-behavior/ub_ubsan-reports-overflow
              COMMAND ub_ubsan overflow 1
              PASS_REGEX "runtime error"
              LABELS "intentional-bug")
  cen429_test(NAME week-04/03-undefined-behavior/ub_ubsan-reports-shift
              COMMAND ub_ubsan shift 31
              PASS_REGEX "runtime error"
              LABELS "intentional-bug")
endif()

cen429_test(NAME week-04/03-undefined-behavior/ub_secure-rejects-overflow
            COMMAND ub_secure overflow 1
            PASS_REGEX "Rejected: INT_MAX \\+ 1 overflows")
cen429_test(NAME week-04/03-undefined-behavior/ub_secure-rejects-shift-31
            COMMAND ub_secure shift 31
            PASS_REGEX "Rejected: 31 is outside the valid shift range")
cen429_test(NAME week-04/03-undefined-behavior/ub_secure-accepts-shift-8
            COMMAND ub_secure shift 8
            PASS_REGEX "1 << 8 = 256")
cen429_test(NAME week-04/03-undefined-behavior/ub_secure-unaligned-via-memcpy
            COMMAND ub_secure unaligned
            PASS_REGEX "int safely read with memcpy = 84148994")
