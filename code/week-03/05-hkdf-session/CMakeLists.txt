set(CEN429_FOLDER "Week 03/05 HKDF session keys")
cen429_add_demo(hkdf_session SOURCES hkdf_session.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests ------------------------------------------------------------------------------------
# tests/hkdf_vectors.h holds the official RFC 5869 test vector plus vectors computed
# independently with Python's `cryptography` HKDF (see the header's own comment).
cen429_add_demo(test_hkdf_session SOURCES tests/test_hkdf_session.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-03/05-hkdf-session/unit COMMAND test_hkdf_session
            PASS_REGEX "0 failures")

cen429_test(NAME week-03/05-hkdf-session/runs-e2e
            COMMAND hkdf_session
            PASS_REGEX "earlier sessions stay")
