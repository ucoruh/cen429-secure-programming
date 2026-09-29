set(CEN429_FOLDER "Week 02/12 ACE evaluation")
# Pure computation: a simulator of the Windows access-check algorithm.
# Compiled from the same source on both platforms; uses no operating-system API.
cen429_add_demo(ace SOURCES ace.c MODE secure)

# --- Tests --------------------------------------------------------------------------------
cen429_add_demo(test_ace SOURCES tests/test_ace.c MODE secure)
cen429_test(NAME week-02/12-ace-evaluation/unit COMMAND test_ace
            PASS_REGEX "0 failures")

# End-to-end: run the real binary against the committed scenario files.
cen429_test(NAME week-02/12-ace-evaluation/order-scenario
            COMMAND ace scenario-1-order.txt
            PASS_REGEX "DENY")
cen429_test(NAME week-02/12-ace-evaluation/null-empty-scenario
            COMMAND ace scenario-2-null-empty.txt
            PASS_REGEX "NULL DACL")
cen429_test(NAME week-02/12-ace-evaluation/inheritance-scenario
            COMMAND ace scenario-3-inheritance.txt
            PASS_REGEX "inherited")
cen429_test(NAME week-02/12-ace-evaluation/uac-mic-scenario
            COMMAND ace scenario-4-uac-mic.txt
            PASS_REGEX "MIC")
cen429_test(NAME week-02/12-ace-evaluation/owner-privilege-scenario
            COMMAND ace scenario-5-owner-privilege.txt
            PASS_REGEX "TAKE_OWNERSHIP")
