set(CEN429_FOLDER "Week 01/02 Password left in memory")
# Building with optimization matters: memset's removal as a "dead store" only happens with optimization.
if(WIN32)
  set(_ek LIBS Dbghelp)
endif()
cen429_add_demo(password_no_wipe  SOURCES password.c MODE optimize DEFINES WIPE=0 ${_ek})
cen429_add_demo(password_memset   SOURCES password.c MODE optimize DEFINES WIPE=1 ${_ek})
cen429_add_demo(password_explicit SOURCES password.c MODE optimize DEFINES WIPE=2 ${_ek})

# --- Tests ------------------------------------------------------------------------------------
# Unit tests: derive_key()/log_in()/deep_call_chain() are all bounded, safe to call in-process.
cen429_add_demo(test_password SOURCES tests/test_password.c MODE optimize ${_ek})
cen429_test(NAME week-01/02-password-in-memory/unit COMMAND test_password
            PASS_REGEX "0 failures")

# End-to-end: run each real build variant against the real password.txt and check the printed
# key line's shape (the exact hex value legitimately differs Windows/Linux: `unsigned long` is
# 32-bit LLP64 on Windows, 64-bit LP64 on Linux, so derive_key()'s wraparound differs by platform).
foreach(_variant password_no_wipe:0 password_memset:1 password_explicit:2)
  string(REPLACE ":" ";" _pair ${_variant})
  list(GET _pair 0 _target)
  list(GET _pair 1 _wipe)
  cen429_test(NAME week-01/02-password-in-memory/${_target}-runs
              COMMAND ${_target}
              PASS_REGEX "Key computed: [0-9a-f]+ \\(WIPE=${_wipe}\\)")
endforeach()
