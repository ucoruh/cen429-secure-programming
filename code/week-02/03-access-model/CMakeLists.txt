set(CEN429_FOLDER "Week 02/03 Access model")
cen429_add_demo(access SOURCES access.c MODE optimize)

# --- Tests --------------------------------------------------------------------------------
cen429_add_demo(test_access SOURCES tests/test_access.c MODE optimize)
cen429_test(NAME week-02/03-access-model/unit COMMAND test_access
            PASS_REGEX "0 failures")

# End-to-end: run the real binary against the committed policy files.
cen429_test(NAME week-02/03-access-model/blp-no-write-down
            COMMAND access policy-confidentiality.txt
            PASS_REGEX "general\\(TopS\\) +W +notice.*DENY")
cen429_test(NAME week-02/03-access-model/chinese-wall-closes
            COMMAND access policy-chinese-wall.txt
            PASS_REGEX "consultant1 +R +b_balance_sheet.*=> DENY")
cen429_test(NAME week-02/03-access-model/biba-low-water-mark-drops
            COMMAND access policy-lwm.txt
            PASS_REGEX "processor\\(Exte\\) +W +record.*DENY")
