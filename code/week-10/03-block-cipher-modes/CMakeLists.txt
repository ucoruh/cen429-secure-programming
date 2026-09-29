# CEN429 - Week 10 - Demo 3: block cipher modes (ECB/CBC/CTR/GCM-like) is a pure Python program;
# there is nothing to compile. To run it: demo.ps1 (Windows) / demo.sh (Linux/WSL/Git Bash), or
# directly: `python block_modes.py`.
#
# Test: tests/test_block_modes.py (run directly by CTest, no compilation) checks round trips and the
# structural properties of each mode (ECB's identical-block leak, CBC's controlled single-bit
# malleability, CTR's exact single-bit flip, the GCM-like tag rejecting any ciphertext/tag/nonce
# tamper) against independently re-derived values, never against block_modes.py's own output.
if(Python3_FOUND)
  cen429_test(NAME week-10/03-block-cipher-modes/unit
              COMMAND ${Python3_EXECUTABLE} tests/test_block_modes.py
              PASS_REGEX "ALL TESTS PASSED")
  cen429_test(NAME week-10/03-block-cipher-modes/demo-runs
              COMMAND ${Python3_EXECUTABLE} block_modes.py
              PASS_REGEX "tampering is DETECTED")
else()
  message(STATUS "CEN429: no Python 3 interpreter found by CMake; week-10/03-block-cipher-modes "
                 "tests will not be registered (run tests/test_block_modes.py by hand instead)")
endif()
