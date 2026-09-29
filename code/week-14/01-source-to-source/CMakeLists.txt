set(CEN429_FOLDER "Week 14/01 Source-to-source obfuscation (Tigress)")

cen429_add_demo(source SOURCES source.c MODE optimize)

# --- Tests --------------------------------------------------------------------------------
# Unit tests: grant_access() is pure and safe to call in-process.
cen429_add_demo(test_source SOURCES tests/test_source.c MODE optimize)
cen429_test(NAME week-14/01-source-to-source/unit COMMAND test_source
            PASS_REGEX "0 failures")

# End-to-end: the real compiled binary, both the valid and an invalid token.
cen429_test(NAME week-14/01-source-to-source/grants-valid-token
            COMMAND source CEN429-OK
            PASS_REGEX "grant_access\\(\"CEN429-OK\"\\) = GRANTED")
cen429_test(NAME week-14/01-source-to-source/rejects-invalid-token
            COMMAND source wrong
            PASS_REGEX "grant_access\\(\"wrong\"\\) = DENIED")

# End-to-end: the full source-to-source PIPELINE (pipeline_check.py). Uses the real Tigress
# tool if it is installed and found on PATH; otherwise prints a message and uses the
# documented local fallback transform (fallback_transform.py) instead, so this test always
# runs and always exercises the pipeline, on every machine, with or without Tigress. Checks
# semantic equivalence across two diversification seeds and that the two seeds' compiled
# variants differ in bytes. Python does its own ad hoc compilation of the generated variant
# sources (they do not exist until the test itself runs, so cannot be ordinary CMake targets):
# MSVC via vswhere/vcvars64.bat on Windows (mirrors common/cen429_msvc.ps1's Invoke-Cl),
# cc/gcc/clang on Linux/WSL.
find_package(Python3 COMPONENTS Interpreter)
if(Python3_FOUND)
  cen429_test(NAME week-14/01-source-to-source/pipeline-e2e
              COMMAND ${Python3_EXECUTABLE} pipeline_check.py
              PASS_REGEX "PIPELINE CHECK PASSED")
else()
  message(STATUS "CEN429 week 14: no Python 3 interpreter found -- "
                 "week-14/01-source-to-source/pipeline-e2e will not be registered")
endif()
