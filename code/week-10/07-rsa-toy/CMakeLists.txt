# CEN429 - Week 10 - Demo 7: textbook RSA with toy primes is a pure Python program; nothing to
# compile. Run it: demo.ps1 (Windows) / demo.sh (Linux/WSL/Git Bash), or directly:
# `python rsa_toy.py`.
#
# Test: tests/test_rsa_toy.py checks keygen/encrypt/decrypt/sign/verify against the published
# Wikipedia "RSA (cryptosystem)" worked example (p=61, q=53, e=17 -> n=3233, d=2753, encrypt(65)=2790)
# and against every message in a small n by brute force -- never against rsa_toy.py's own output.
if(Python3_FOUND)
  cen429_test(NAME week-10/07-rsa-toy/unit
              COMMAND ${Python3_EXECUTABLE} tests/test_rsa_toy.py
              PASS_REGEX "ALL TESTS PASSED")
  cen429_test(NAME week-10/07-rsa-toy/demo-runs
              COMMAND ${Python3_EXECUTABLE} rsa_toy.py
              PASS_REGEX "== original message: True")
else()
  message(STATUS "CEN429: no Python 3 interpreter found by CMake; week-10/07-rsa-toy tests will not "
                 "be registered (run tests/test_rsa_toy.py by hand instead)")
endif()
