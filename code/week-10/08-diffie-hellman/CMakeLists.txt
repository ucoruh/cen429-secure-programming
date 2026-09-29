# CEN429 - Week 10 - Demo 8: Diffie-Hellman with a toy modulus, plus a man-in-the-middle simulation,
# is a pure Python program; nothing to compile. Run it: demo.ps1 (Windows) / demo.sh (Linux/WSL/Git
# Bash), or directly: `python dh_toy.py`.
#
# Test: tests/test_dh_toy.py checks modexp() against Python's own built-in pow() (an independent
# implementation of modular exponentiation) for 200 random cases, the standard DH textbook worked
# example (p=23, g=5, a=6, b=15 -> shared=2), 100 random honest exchanges, and that the MITM
# simulation reproduces the textbook break (Mallory shares a DIFFERENT key with each honest party).
if(Python3_FOUND)
  cen429_test(NAME week-10/08-diffie-hellman/unit
              COMMAND ${Python3_EXECUTABLE} tests/test_dh_toy.py
              PASS_REGEX "ALL TESTS PASSED")
  cen429_test(NAME week-10/08-diffie-hellman/demo-runs
              COMMAND ${Python3_EXECUTABLE} dh_toy.py
              PASS_REGEX "shared secrets match: True")
else()
  message(STATUS "CEN429: no Python 3 interpreter found by CMake; week-10/08-diffie-hellman tests "
                 "will not be registered (run tests/test_dh_toy.py by hand instead)")
endif()
