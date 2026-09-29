# CEN429 - Week 10 - Demo 1: certificate chain with OpenSSL. The demo itself (demo.sh) is a POSIX
# shell script that drives the real `openssl` CLI; there is nothing to compile. To run it by hand:
# `sh demo.sh` (Windows: from Git Bash).
#
# Test: tests/test_pki_chain.py (run directly by CTest, no compilation) runs the real demo.sh end to
# end in its own temporary "pki/" lab folder and checks the printed VERIFY-RESULT of every step: the
# full chain verifies, and the missing-intermediate / expired / wrong-CA / CA:FALSE-issuer / wrong-
# hostname cases are all rejected as documented. It skips (CTest "Not Run") instead of failing when
# `sh` or `openssl` is not on PATH.
if(Python3_FOUND)
  cen429_test(NAME week-10/01-pki-chain/e2e
              COMMAND ${Python3_EXECUTABLE} tests/test_pki_chain.py
              PASS_REGEX "ALL TESTS PASSED")
  set_tests_properties(week-10/01-pki-chain/e2e PROPERTIES SKIP_RETURN_CODE 125)
else()
  message(STATUS "CEN429: no Python 3 interpreter found by CMake; week-10/01-pki-chain/e2e will not "
                 "be registered (run tests/test_pki_chain.py by hand instead: see README.md)")
endif()
