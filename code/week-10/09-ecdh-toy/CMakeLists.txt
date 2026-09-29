# CEN429 - Week 10 - Demo 9: ECDH on a tiny curve is a pure Python program; nothing to compile. Run
# it: demo.ps1 (Windows) / demo.sh (Linux/WSL/Git Bash), or directly: `python ecdh_toy.py`.
#
# Test: tests/test_ecdh_toy.py checks the curve's group laws (identity, commutativity, closure, point
# negation) and cross-checks scalar_mult()'s double-and-add against a DIFFERENT algorithm (repeated
# one-at-a-time addition) for many scalars, then runs 60 random ECDH exchanges and checks both sides
# land on the same shared point -- never against ecdh_toy.py's own prior output.
if(Python3_FOUND)
  cen429_test(NAME week-10/09-ecdh-toy/unit
              COMMAND ${Python3_EXECUTABLE} tests/test_ecdh_toy.py
              PASS_REGEX "ALL TESTS PASSED")
  cen429_test(NAME week-10/09-ecdh-toy/demo-runs
              COMMAND ${Python3_EXECUTABLE} ecdh_toy.py
              PASS_REGEX "shared points match: True")
else()
  message(STATUS "CEN429: no Python 3 interpreter found by CMake; week-10/09-ecdh-toy tests will "
                 "not be registered (run tests/test_ecdh_toy.py by hand instead)")
endif()
