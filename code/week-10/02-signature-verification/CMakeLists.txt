# CEN429 - Week 10 - Demo 2: ECDSA (P-256) signature creation/verification and its pitfalls. The demo
# itself (demo.sh) is a POSIX shell script that drives the real `openssl` CLI; there is nothing to
# compile. To run it by hand: `sh demo.sh` (Windows: from Git Bash).
#
# Test: tests/test_signature_verification.py (run directly by CTest, no compilation) runs the real
# demo.sh end to end in its own temporary "sig/" lab folder and checks the printed VERIFY-RESULT of
# every step: a correct signature verifies, a one-byte-tampered message is rejected, an older but
# validly signed message still verifies (the documented downgrade pitfall), and a message signed by an
# attacker's key verifies only against the attacker's own key, never against the real publisher's key.
# It skips (CTest "Not Run") instead of failing when `sh` or `openssl` is not on PATH.
if(Python3_FOUND)
  cen429_test(NAME week-10/02-signature-verification/e2e
              COMMAND ${Python3_EXECUTABLE} tests/test_signature_verification.py
              PASS_REGEX "ALL TESTS PASSED")
  set_tests_properties(week-10/02-signature-verification/e2e PROPERTIES SKIP_RETURN_CODE 125)
else()
  message(STATUS "CEN429: no Python 3 interpreter found by CMake; "
                 "week-10/02-signature-verification/e2e will not be registered (run "
                 "tests/test_signature_verification.py by hand instead: see README.md)")
endif()
