set(CEN429_FOLDER "Week 09/02 Diversification (two seeds)")
cen429_add_demo(access_seed1001 SOURCES diversified.c MODE optimize DEFINES SEED=1001)
cen429_add_demo(access_seed2002 SOURCES diversified.c MODE optimize DEFINES SEED=2002)

# --- Tests ------------------------------------------------------------------------------------
# Unit tests: grant_access() is pure and safe to call in-process. Build the SAME test source
# against BOTH seeds (like week-01/02-password-in-memory's WIPE variants) to prove the seed
# changes only the generated code, never the observable behavior.
cen429_add_demo(test_diversified_seed1001 SOURCES tests/test_diversified.c MODE optimize DEFINES SEED=1001)
cen429_add_demo(test_diversified_seed2002 SOURCES tests/test_diversified.c MODE optimize DEFINES SEED=2002)
cen429_test(NAME week-09/02-diversification/seed1001-unit COMMAND test_diversified_seed1001
            PASS_REGEX "0 failures")
cen429_test(NAME week-09/02-diversification/seed2002-unit COMMAND test_diversified_seed2002
            PASS_REGEX "0 failures")

# End-to-end: the two seeds must AGREE on behavior even though their machine code differs
# (see demo.sh for the byte-level diff that proves the code itself is different).
cen429_test(NAME week-09/02-diversification/seed1001-grants-valid-token
            COMMAND access_seed1001 CEN429-OK
            PASS_REGEX "GRANTED")
cen429_test(NAME week-09/02-diversification/seed2002-grants-valid-token
            COMMAND access_seed2002 CEN429-OK
            PASS_REGEX "GRANTED")
cen429_test(NAME week-09/02-diversification/seed1001-rejects-invalid
            COMMAND access_seed1001 wrong-token
            PASS_REGEX "DENIED")
cen429_test(NAME week-09/02-diversification/seed2002-rejects-invalid
            COMMAND access_seed2002 wrong-token
            PASS_REGEX "DENIED")
