# CEN429 - Week 10 - Demo 4: PKCS#7 padding is a pure Python program; nothing to compile. Run it:
# demo.ps1 (Windows) / demo.sh (Linux/WSL/Git Bash), or directly: `python pkcs7.py`.
#
# Test: tests/test_pkcs7.py checks pad()/unpad() against hand-derived expected byte values (RFC 5652
# 6.3's rule), round trips, every way padding can be invalid, and that every rejection raises the same
# exception message (no padding-oracle-shaped distinguishable error).
if(Python3_FOUND)
  cen429_test(NAME week-10/04-pkcs7-padding/unit
              COMMAND ${Python3_EXECUTABLE} tests/test_pkcs7.py
              PASS_REGEX "ALL TESTS PASSED")
  cen429_test(NAME week-10/04-pkcs7-padding/demo-runs
              COMMAND ${Python3_EXECUTABLE} pkcs7.py
              PASS_REGEX "padding-oracle attack on CBC")
else()
  message(STATUS "CEN429: no Python 3 interpreter found by CMake; week-10/04-pkcs7-padding tests "
                 "will not be registered (run tests/test_pkcs7.py by hand instead)")
endif()
