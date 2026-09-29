set(CEN429_FOLDER "Week 06/05 Control-flow counter")
cen429_add_demo(flow_counter SOURCES flow_counter.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests --------------------------------------------------------------------------------------
cen429_add_demo(test_flow_counter SOURCES tests/test_flow_counter.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-06/05-flow-counter/unit COMMAND test_flow_counter
            PASS_REGEX "0 failures")

# End-to-end: the real compiled binary, all four scenarios.
cen429_test(NAME week-06/05-flow-counter/normal-approves
            COMMAND flow_counter normal
            PASS_REGEX "RESULT: PAYMENT APPROVED")
cen429_test(NAME week-06/05-flow-counter/skip-denies
            COMMAND flow_counter skip
            PASS_REGEX "RESULT: PAYMENT DENIED")
cen429_test(NAME week-06/05-flow-counter/partial-denies
            COMMAND flow_counter partial
            PASS_REGEX "RESULT: PAYMENT DENIED")
cen429_test(NAME week-06/05-flow-counter/reorder-denies
            COMMAND flow_counter reorder
            PASS_REGEX "RESULT: PAYMENT DENIED")
