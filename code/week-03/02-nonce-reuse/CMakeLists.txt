set(CEN429_FOLDER "Week 03/02 Nonce reuse")
cen429_add_demo(nonce_reuse SOURCES nonce_reuse.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests ------------------------------------------------------------------------------------
cen429_add_demo(test_nonce_reuse SOURCES tests/test_nonce_reuse.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-03/02-nonce-reuse/unit COMMAND test_nonce_reuse
            PASS_REGEX "0 failures")

cen429_test(NAME week-03/02-nonce-reuse/runs-e2e
            COMMAND nonce_reuse
            PASS_REGEX "the keystream LEAKED")
