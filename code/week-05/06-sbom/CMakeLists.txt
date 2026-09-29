set(CEN429_FOLDER "Week 05/06 SBOM")

if(Python3_FOUND)
  cen429_test(NAME week-05/06-sbom/python-unit
              COMMAND ${Python3_EXECUTABLE} tests/test_sbom.py
              PASS_REGEX "0 failures")

  # End-to-end: the real demo output, including both synthetic vulnerability
  # warnings it is expected to raise.
  cen429_test(NAME week-05/06-sbom/python-demo-runs
              COMMAND ${Python3_EXECUTABLE} sbom.py
              PASS_REGEX "\\[WARNING\\] log-core 2\\.14\\.0")
endif()
