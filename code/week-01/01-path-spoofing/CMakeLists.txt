set(CEN429_FOLDER "Week 01/01 PATH spoofing")
cen429_add_demo(report        SOURCES report.c        MODE optimize)
cen429_add_demo(report_secure SOURCES report_secure.c MODE secure)

# --- Tests ------------------------------------------------------------------------------------
# No unit tests: both programs are a bare main() that launches an OS command; there is no pure
# function to call in-process. Everything here is end-to-end: run the real compiled binary, once
# with the normal PATH and once with fake/ prepended to PATH (the same attack demo.ps1/demo.sh
# perform), and match its real, observed output.
if(NOT WIN32)
  # The exec bit rarely survives a Git checkout on a Drive-synced Windows folder; demo.sh chmods
  # it too, for the same reason.
  execute_process(COMMAND chmod +x "${CMAKE_CURRENT_SOURCE_DIR}/fake/date")
endif()

if(WIN32)
  set(_fake_path "${CMAKE_CURRENT_SOURCE_DIR}\\fake;$ENV{PATH}")
else()
  set(_fake_path "${CMAKE_CURRENT_SOURCE_DIR}/fake:$ENV{PATH}")
endif()

# Normal run (no attack): the real OS command answers; the fake marker must never appear.
cen429_test(NAME week-01/01-path-spoofing/report-normal-run
            COMMAND report
            FAIL_REGEX "FAKE")
cen429_test(NAME week-01/01-path-spoofing/report_secure-normal-run
            COMMAND report_secure
            FAIL_REGEX "FAKE")

# Attack: fake/ is prepended to PATH. The vulnerable version is fooled; the secure version (an
# absolute path + no shell) ignores PATH entirely and is not.
cen429_test(NAME week-01/01-path-spoofing/report-fooled-by-path
            COMMAND report
            PASS_REGEX "FAKE 'date' ran|FAKE 'hostname' ran"
            ENV "PATH=${_fake_path}"
            LABELS "intentional-bug;plain-vulnerable")
cen429_test(NAME week-01/01-path-spoofing/report_secure-resists-path-attack
            COMMAND report_secure
            FAIL_REGEX "FAKE"
            ENV "PATH=${_fake_path}"
            LABELS "intentional-bug")
