set(CEN429_FOLDER "Week 06/02 Debugger detection")
cen429_add_demo(antidebug SOURCES antidebug.c MODE secure)

# --- Tests --------------------------------------------------------------------------------------
# parse_tracer_pid() and parent_name_is_suspicious() are pure text-parsing helpers, only compiled
# into the non-Windows half of antidebug.c; the Windows debugger checks are direct OS API calls
# with no in-process alternative to compare against, so on Windows everything is end-to-end.
if(NOT WIN32)
  cen429_add_demo(test_antidebug SOURCES tests/test_antidebug.c MODE secure)
  cen429_test(NAME week-06/02-debugger-detection/unit COMMAND test_antidebug
              PASS_REGEX "0 failures")
endif()

# End-to-end: run the real compiled binary (undebugged, in CTest's own process tree) and match its
# real, observed output.
cen429_test(NAME week-06/02-debugger-detection/clean-run
            COMMAND antidebug
            PASS_REGEX "RESULT: clean - no tracing tool visible\\.")
if(NOT WIN32)
  cen429_test(NAME week-06/02-debugger-detection/tracerpid-zero-when-undebugged
              COMMAND antidebug
              PASS_REGEX "TracerPid *: 0 \\(no tracer\\)")
endif()
