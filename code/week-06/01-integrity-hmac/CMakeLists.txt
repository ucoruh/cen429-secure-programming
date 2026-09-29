set(CEN429_FOLDER "Week 06/01 Integrity HMAC")
# Crypto (HMAC-SHA-256): Linux/WSL OpenSSL (crypto), Windows BCrypt (CNG).
cen429_add_demo(integrity SOURCES integrity.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests --------------------------------------------------------------------------------------
cen429_add_demo(test_integrity SOURCES tests/test_integrity.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-06/01-integrity-hmac/unit COMMAND test_integrity
            PASS_REGEX "0 failures")

# End-to-end: save the golden HMAC of a known file (this CMakeLists.txt itself, a stable real file),
# verify it (must pass), then verify a DIFFERENT file (README.md) against that same golden value
# (must be rejected, like a patched target would be). All three run in order (DEPENDS) because they
# share the output/golden.hmac file.
cen429_test(NAME week-06/01-integrity-hmac/prepare-output
            COMMAND ${CMAKE_COMMAND} -E make_directory output)
cen429_test(NAME week-06/01-integrity-hmac/save
            COMMAND integrity save "${CMAKE_CURRENT_SOURCE_DIR}/CMakeLists.txt" output/golden.hmac
            PASS_REGEX "Golden integrity value saved")
cen429_test(NAME week-06/01-integrity-hmac/verify-ok
            COMMAND integrity verify "${CMAKE_CURRENT_SOURCE_DIR}/CMakeLists.txt" output/golden.hmac
            PASS_REGEX "RESULT: INTEGRITY OK")
cen429_test(NAME week-06/01-integrity-hmac/verify-tampered
            COMMAND integrity verify "${CMAKE_CURRENT_SOURCE_DIR}/README.md" output/golden.hmac
            PASS_REGEX "RESULT: PATCH DETECTED")
set_tests_properties(week-06/01-integrity-hmac/save PROPERTIES
                      DEPENDS week-06/01-integrity-hmac/prepare-output)
set_tests_properties(week-06/01-integrity-hmac/verify-ok PROPERTIES
                      DEPENDS week-06/01-integrity-hmac/save)
set_tests_properties(week-06/01-integrity-hmac/verify-tampered PROPERTIES
                      DEPENDS week-06/01-integrity-hmac/save)
