set(CEN429_FOLDER "Week 03/09 Security layers")
cen429_add_demo(security_layers SOURCES security_layers.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests ------------------------------------------------------------------------------------
cen429_add_demo(test_security_layers SOURCES tests/test_security_layers.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-03/09-security-layers/unit COMMAND test_security_layers
            PASS_REGEX "0 failures")

cen429_test(NAME week-03/09-security-layers/runs-e2e
            COMMAND security_layers
            PASS_REGEX "CANNOT be opened on another device")
