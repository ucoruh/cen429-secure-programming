# CEN429 - Week 10 - Demo 10: CRL/OCSP revocation checking is a pure Python program; nothing to
# compile. Run it: demo.ps1 (Windows) / demo.sh (Linux/WSL/Git Bash), or directly:
# `python revocation.py`.
#
# Test: tests/test_revocation.py checks OCSP's three states (good/revoked/unknown), that a CRL
# snapshot only reflects revocations known at publish time, and that a STALE CRL (past its own
# nextUpdate) is reported as "stale" rather than silently trusted as "good" -- including for a serial
# that actually IS revoked, so staleness can never be skipped by accident.
if(Python3_FOUND)
  cen429_test(NAME week-10/10-revocation/unit
              COMMAND ${Python3_EXECUTABLE} tests/test_revocation.py
              PASS_REGEX "ALL TESTS PASSED")
  cen429_test(NAME week-10/10-revocation/demo-runs
              COMMAND ${Python3_EXECUTABLE} revocation.py
              PASS_REGEX "CRL/OCSP trade-off")
else()
  message(STATUS "CEN429: no Python 3 interpreter found by CMake; week-10/10-revocation tests will "
                 "not be registered (run tests/test_revocation.py by hand instead)")
endif()
