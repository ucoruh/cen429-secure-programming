# CEN429 - Week 10 - Demo 5: HMAC inner/outer construction is a pure Python program; nothing to
# compile. Run it: demo.ps1 (Windows) / demo.sh (Linux/WSL/Git Bash), or directly:
# `python hmac_construction.py`.
#
# Test: tests/test_hmac_construction.py checks the by-hand implementation against the published RFC
# 4231 HMAC-SHA-256 test vectors and, for random inputs, against Python's own stdlib `hmac` module (a
# separate implementation) -- never against this file's own prior output.
if(Python3_FOUND)
  cen429_test(NAME week-10/05-hmac-construction/unit
              COMMAND ${Python3_EXECUTABLE} tests/test_hmac_construction.py
              PASS_REGEX "ALL TESTS PASSED")
  cen429_test(NAME week-10/05-hmac-construction/demo-runs
              COMMAND ${Python3_EXECUTABLE} hmac_construction.py
              PASS_REGEX "wrong tag rejected  : False")
else()
  message(STATUS "CEN429: no Python 3 interpreter found by CMake; week-10/05-hmac-construction tests "
                 "will not be registered (run tests/test_hmac_construction.py by hand instead)")
endif()
