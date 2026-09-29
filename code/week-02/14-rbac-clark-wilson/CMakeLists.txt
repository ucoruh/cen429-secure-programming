set(CEN429_FOLDER "Week 02/14 RBAC and Clark-Wilson")
# Pure simulation: uses no file, network, or operating-system API.
cen429_add_demo(bank SOURCES bank.c MODE secure)

# --- Tests --------------------------------------------------------------------------------
cen429_add_demo(test_bank SOURCES tests/test_bank.c MODE secure)
cen429_test(NAME week-02/14-rbac-clark-wilson/unit COMMAND test_bank
            PASS_REGEX "0 failures")

# End-to-end: run the real binary against the committed scenario. The final IVP (section 4) runs
# AFTER the deliberately broken BAD_TRANSFER TP was certified and run, so it must report the
# inconsistency -- that is this demo's headline lesson (see README.md, step 4).
cen429_test(NAME week-02/14-rbac-clark-wilson/ivp-catches-broken-tp
            COMMAND bank scenario.txt
            PASS_REGEX "INCONSISTENT! difference")
cen429_test(NAME week-02/14-rbac-clark-wilson/ssd-blocks-dual-role
            COMMAND bank scenario.txt
            PASS_REGEX "SSD\\(TELLER,APPROVER\\).*DENY")
