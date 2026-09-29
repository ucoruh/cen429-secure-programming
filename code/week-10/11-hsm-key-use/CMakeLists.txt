# CEN429 - Week 10 - Demo 11: the simulated HSM/PKCS#11-style key-handle API is a pure Python
# program; nothing to compile. Run it: demo.ps1 (Windows) / demo.sh (Linux/WSL/Git Bash), or
# directly: `python hsm_sim.py`.
#
# Test: tests/test_hsm_sim.py checks that the public API never exposes a way to read a private key
# out, that sign/verify behave correctly across handles and after a key is destroyed, and that
# unknown handles are rejected rather than silently accepted.
if(Python3_FOUND)
  cen429_test(NAME week-10/11-hsm-key-use/unit
              COMMAND ${Python3_EXECUTABLE} tests/test_hsm_sim.py
              PASS_REGEX "ALL TESTS PASSED")
  cen429_test(NAME week-10/11-hsm-key-use/demo-runs
              COMMAND ${Python3_EXECUTABLE} hsm_sim.py
              PASS_REGEX "no such key handle")
else()
  message(STATUS "CEN429: no Python 3 interpreter found by CMake; week-10/11-hsm-key-use tests "
                 "will not be registered (run tests/test_hsm_sim.py by hand instead)")
endif()
