set(CEN429_FOLDER "Week 06/06 Component signature")
cen429_add_demo(signature SOURCES signature.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests --------------------------------------------------------------------------------------
cen429_add_demo(test_signature SOURCES tests/test_signature.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-06/06-component-signature/unit COMMAND test_signature
            PASS_REGEX "0 failures")

# End-to-end: generate a real signature for a real file, verify it (must hold), then append one
# byte to the module (a repackaging simulation) and verify again (must be rejected).
cen429_test(NAME week-06/06-component-signature/prepare-output
            COMMAND ${CMAKE_COMMAND} -E make_directory output)
cen429_test(NAME week-06/06-component-signature/write-module
            COMMAND ${CMAKE_COMMAND} -E copy
                    "${CMAKE_CURRENT_SOURCE_DIR}/tests/fixtures/module_a.bin" output/module.dat)
cen429_test(NAME week-06/06-component-signature/generate
            COMMAND signature generate output/module.dat output/module.sig
            PASS_REGEX "Module signed")
cen429_test(NAME week-06/06-component-signature/verify-ok
            COMMAND signature verify output/module.dat output/module.sig
            PASS_REGEX "Module signature HELD")
cen429_test(NAME week-06/06-component-signature/verify-repackaged
            COMMAND signature verify "${CMAKE_CURRENT_SOURCE_DIR}/tests/fixtures/module_b.bin" output/module.sig
            PASS_REGEX "Module signature DID NOT HOLD")
set_tests_properties(week-06/06-component-signature/write-module PROPERTIES
                      DEPENDS week-06/06-component-signature/prepare-output)
set_tests_properties(week-06/06-component-signature/generate PROPERTIES
                      DEPENDS week-06/06-component-signature/write-module)
set_tests_properties(week-06/06-component-signature/verify-ok PROPERTIES
                      DEPENDS week-06/06-component-signature/generate)
set_tests_properties(week-06/06-component-signature/verify-repackaged PROPERTIES
                      DEPENDS week-06/06-component-signature/generate)
