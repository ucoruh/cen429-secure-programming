set(CEN429_FOLDER "Week 03/04 Password to key (PBKDF2)")
cen429_add_demo(password_to_key SOURCES password_to_key.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests ------------------------------------------------------------------------------------
# tests/pbkdf2_vectors.h holds known-answer vectors computed independently with Python's
# hashlib.pbkdf2_hmac (see the header's own comment).
cen429_add_demo(test_password_to_key SOURCES tests/test_password_to_key.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-03/04-password-to-key/unit COMMAND test_password_to_key
            PASS_REGEX "0 failures")

cen429_test(NAME week-03/04-password-to-key/runs-e2e
            COMMAND password_to_key
            PASS_REGEX "Argon2id is preferred")
