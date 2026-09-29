set(CEN429_FOLDER "Week 02/06 TOCTOU")
# This demo is Unix-specific (symbolic links, O_NOFOLLOW, the POSIX file API).
# It does not build on Windows; demo.ps1 explains how to run it under WSL.
if(NOT WIN32)
  cen429_add_demo(logwriter SOURCES logwriter.c MODE secure)

  # --- Tests ------------------------------------------------------------------------------
  # write_safe()/write_unsafe() only touch tests/tmp/ inside this folder.
  cen429_add_demo(test_logwriter SOURCES tests/test_logwriter.c MODE secure)
  cen429_test(NAME week-02/06-toctou/unit COMMAND test_logwriter
              PASS_REGEX "0 failures")

  # End-to-end: attack.sh runs the real race (background process + a symlink swap mid-flight).
  cen429_test(NAME week-02/06-toctou/unsafe-race-succeeds
              COMMAND sh -c "cd ${CMAKE_CURRENT_SOURCE_DIR} && sh attack.sh unsafe"
              PASS_REGEX "ATTACK SUCCEEDED"
              LABELS "intentional-bug;plain-vulnerable")
  cen429_test(NAME week-02/06-toctou/safe-race-blocked
              COMMAND sh -c "cd ${CMAKE_CURRENT_SOURCE_DIR} && sh attack.sh safe"
              PASS_REGEX "Attack blocked")
endif()
