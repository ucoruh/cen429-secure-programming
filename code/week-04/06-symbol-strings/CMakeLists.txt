set(CEN429_FOLDER "Week 04/06 Symbol and string leakage")

# EXPOSED version: LOG on, plain-text string, symbols left in place (no strip).
cen429_add_demo(secret_exposed SOURCES secret.c MODE unprotected DEFINES CEN429_LOG)

# HIDDEN version: no LOG, string hidden, symbols stripped, hidden visibility.
cen429_add_demo(secret_hidden SOURCES secret.c MODE secure DEFINES CEN429_HIDE)
target_compile_options(secret_hidden PRIVATE
  $<$<C_COMPILER_ID:GNU,Clang>:-fvisibility=hidden>)
if(NOT MSVC)
  target_link_options(secret_hidden PRIVATE -s)          # strip: remove symbols
else()
  target_link_options(secret_hidden PRIVATE /DEBUG:NONE) # do not produce a PDB
endif()

# --- Tests ------------------------------------------------------------------------------------
cen429_add_demo(test_secret SOURCES tests/test_secret.c MODE optimize)
cen429_test(NAME week-04/06-symbol-strings/secret-unit COMMAND test_secret
            PASS_REGEX "0 failures")

cen429_test(NAME week-04/06-symbol-strings/secret_exposed-accepts-correct-key
            COMMAND secret_exposed CEN429-LICENSE-2026
            PASS_REGEX "License: VALID")
cen429_test(NAME week-04/06-symbol-strings/secret_exposed-rejects-wrong-key
            COMMAND secret_exposed WRONG
            PASS_REGEX "License: invalid")
cen429_test(NAME week-04/06-symbol-strings/secret_hidden-accepts-correct-key
            COMMAND secret_hidden CEN429-LICENSE-2026
            PASS_REGEX "License: VALID")
cen429_test(NAME week-04/06-symbol-strings/secret_hidden-rejects-wrong-key
            COMMAND secret_hidden WRONG
            PASS_REGEX "License: invalid")
cen429_test(NAME week-04/06-symbol-strings/secret_hidden-has-no-log-output
            COMMAND secret_hidden CEN429-LICENSE-2026
            FAIL_REGEX "\\[LOG\\]")
