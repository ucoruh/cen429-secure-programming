# CEN429 - Week 10 - Demo 6: encrypt-then-MAC vs MAC-then-encrypt is a pure Python program; nothing
# to compile. Run it: demo.ps1 (Windows) / demo.sh (Linux/WSL/Git Bash), or directly:
# `python ordering.py`.
#
# Test: tests/test_ordering.py checks both constructions round-trip, that Encrypt-then-MAC rejects
# every tamper via the MAC alone (never reaching cbc_decrypt), and that MAC-then-encrypt decrypts
# first and produces two OBSERVABLY DIFFERENT rejection reasons depending on whether the tamper
# happened to corrupt the padding -- the structural shape of a padding-oracle risk from Demo 4.
if(Python3_FOUND)
  cen429_test(NAME week-10/06-encrypt-then-mac/unit
              COMMAND ${Python3_EXECUTABLE} tests/test_ordering.py
              PASS_REGEX "ALL TESTS PASSED")
  cen429_test(NAME week-10/06-encrypt-then-mac/demo-runs
              COMMAND ${Python3_EXECUTABLE} ordering.py
              PASS_REGEX "the two rejection reasons are observably different")
else()
  message(STATUS "CEN429: no Python 3 interpreter found by CMake; week-10/06-encrypt-then-mac tests "
                 "will not be registered (run tests/test_ordering.py by hand instead)")
endif()
