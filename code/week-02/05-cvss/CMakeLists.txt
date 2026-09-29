# CEN429 — Week 2 — Demo 5: the CVSS calculator is written in Python; there is
# no build target. To run it: demo.ps1 (Windows) / demo.sh (Linux).
#
# Test: test_cvss.py (run directly by CTest, no compilation) checks base_score()/round_up()/
# severity()/parse_vector() against values published in the FIRST CVSS v3.1 specification.
find_package(Python3 COMPONENTS Interpreter QUIET)
if(Python3_Interpreter_FOUND)
  cen429_test(NAME week-02/05-cvss/unit
              COMMAND ${Python3_EXECUTABLE} test_cvss.py
              PASS_REGEX "ALL TESTS PASSED")
else()
  message(STATUS "CEN429: no Python 3 interpreter found by CMake; week-02/05-cvss/unit will not "
                 "be registered (run test_cvss.py by hand instead: see README.md)")
endif()
