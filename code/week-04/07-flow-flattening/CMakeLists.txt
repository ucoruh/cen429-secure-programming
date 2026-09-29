set(CEN429_FOLDER "Week 04/07 Control-flow flattening")
# Both built unoptimized: keep the CFG difference visible in objdump.
cen429_add_demo(pin_plain     SOURCES pin.c           MODE unprotected)
cen429_add_demo(pin_flattened SOURCES pin_flattened.c  MODE unprotected)
cen429_add_demo(opaque        SOURCES opaque.c         MODE unprotected)

# --- Tests ------------------------------------------------------------------------------------
cen429_add_demo(test_pin SOURCES tests/test_pin.c MODE optimize)
cen429_test(NAME week-04/07-flow-flattening/pin-unit COMMAND test_pin
            PASS_REGEX "0 failures")

cen429_add_demo(test_opaque SOURCES tests/test_opaque.c MODE optimize)
cen429_test(NAME week-04/07-flow-flattening/opaque-unit COMMAND test_opaque
            PASS_REGEX "0 failures")

cen429_test(NAME week-04/07-flow-flattening/pin_plain-correct
            COMMAND pin_plain 4291
            PASS_REGEX "PIN 4291 -> CORRECT")
cen429_test(NAME week-04/07-flow-flattening/pin_plain-wrong
            COMMAND pin_plain 1234
            PASS_REGEX "PIN 1234 -> wrong")
cen429_test(NAME week-04/07-flow-flattening/pin_flattened-correct
            COMMAND pin_flattened 4291
            PASS_REGEX "PIN 4291 -> CORRECT")
cen429_test(NAME week-04/07-flow-flattening/pin_flattened-wrong
            COMMAND pin_flattened 1234
            PASS_REGEX "PIN 1234 -> wrong")
cen429_test(NAME week-04/07-flow-flattening/opaque-correct-independent-of-x
            COMMAND opaque 4291 7
            PASS_REGEX "PIN 4291 \\(x=7\\) -> CORRECT")
cen429_test(NAME week-04/07-flow-flattening/opaque-wrong-independent-of-x
            COMMAND opaque 0000 -50
            PASS_REGEX "PIN 0000 \\(x=-50\\) -> wrong")
cen429_test(NAME week-04/07-flow-flattening/opaque-verify-sweep
            COMMAND opaque verify
            PASS_REGEX "opaque_false was true 0 time\\(s\\)")
