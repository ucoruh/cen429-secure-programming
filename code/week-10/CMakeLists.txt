# CEN429 - Week 10 demos: certificates and cryptographic methods (block modes, padding, MAC
# construction, RSA/DH/ECDH toy math, signatures, X.509 chains, revocation, HSM key handling).
# No C code this week -- demos are POSIX shell scripts driving the real OpenSSL CLI (01, 02) or small,
# independent Python programs (03-11) -- but every subfolder with a CMakeLists.txt is still added the
# same way as any other week (see cmake/cen429.cmake's cen429_add_week_demos()).
#
# Python is found ONCE here and reused by every demo subdirectory below, so a missing interpreter only
# prints one status message instead of one per demo (same pattern as week-05/CMakeLists.txt).
find_package(Python3 COMPONENTS Interpreter)
if(NOT Python3_FOUND)
  message(STATUS "CEN429 week 10: no Python 3 interpreter found -- the demos and tests in "
                 "week-10/03.. through week-10/11.. are skipped.")
endif()

cen429_add_week_demos()
